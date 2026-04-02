from __future__ import annotations

import asyncio
import json
import os
from functools import lru_cache
from datetime import date, datetime
from typing import Any

import httpx
import structlog

from app.services.data_pipeline.base_fetcher import BasePriceFetcher, normalize_symbol
from app.services.data_pipeline.exceptions import InvalidUpstreamResponse, UpstreamUnavailable
from app.services.data_pipeline.http import default_headers, new_async_client, with_retries
from app.services.data_pipeline.models import Candle, LiveQuote


class NSEFetcher(BasePriceFetcher):
    """NSE unofficial scrape-based fetcher.

    Notes:
    - NSE endpoints can be brittle and rate-limited.
    - This fetcher initializes cookies by visiting the homepage first.
    """

    source_name = "nse_scrape"

    def __init__(self) -> None:
        self._log = structlog.get_logger(__name__)
        self._client: httpx.AsyncClient | None = None
        self._initialized = False
        self._lock = asyncio.Lock()
        max_conc = int(os.getenv("NSE_MAX_CONCURRENCY", "3") or "3")
        self._sem = asyncio.Semaphore(max(1, min(max_conc, 10)))
        self._cookies_restored = False

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = new_async_client(
                headers=default_headers(
                    referer="https://www.nseindia.com",
                    accept="text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
                )
            )
        if not self._cookies_restored:
            await self._restore_cookies_best_effort()
        return self._client

    async def _restore_cookies_best_effort(self) -> None:
        self._cookies_restored = True
        try:
            from app.redis_client import get_redis

            redis_client = await get_redis()
            raw = await redis_client.get("nse:cookies")
            if not raw:
                return
            data = json.loads(raw)
            if not isinstance(data, list) or self._client is None:
                return
            for c in data:
                if not isinstance(c, dict):
                    continue
                name = (c.get("name") or "").strip()
                value = (c.get("value") or "").strip()
                domain = c.get("domain")
                path = c.get("path")
                if not name or not value:
                    continue
                try:
                    self._client.cookies.set(name, value, domain=domain, path=path)
                except Exception:  # noqa: BLE001
                    continue
            self._log.debug("nse_cookies_restored", count=len(data))
        except Exception:  # noqa: BLE001
            return

    async def _persist_cookies_best_effort(self) -> None:
        try:
            if self._client is None:
                return
            from app.redis_client import get_redis

            redis_client = await get_redis()
            jar = getattr(self._client.cookies, "jar", None)
            if jar is None:
                return

            out: list[dict[str, Any]] = []
            for cookie in jar:
                out.append(
                    {
                        "name": getattr(cookie, "name", None),
                        "value": getattr(cookie, "value", None),
                        "domain": getattr(cookie, "domain", None),
                        "path": getattr(cookie, "path", None),
                        "secure": getattr(cookie, "secure", None),
                        "expires": getattr(cookie, "expires", None),
                    }
                )

            # 30 min cookie TTL: long enough to survive restarts, short enough to avoid stale bot flags.
            await redis_client.set("nse:cookies", json.dumps(out), ex=30 * 60)
        except Exception:  # noqa: BLE001
            return

    async def _reset_client(self) -> None:
        if self._client is None:
            return
        try:
            await self._client.aclose()
        except Exception:  # noqa: BLE001
            pass
        self._client = None
        self._initialized = False

    async def aclose(self) -> None:
        await self._reset_client()

    def _page_headers(self) -> dict[str, str]:
        h = default_headers(
            referer="https://www.nseindia.com/",
            accept="text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        )
        # Home page navigation
        h["sec-fetch-mode"] = "navigate"
        h["sec-fetch-dest"] = "document"
        h["sec-fetch-site"] = "none"
        return h

    def _api_headers(self, *, referer: str | None = None) -> dict[str, str]:
        h = default_headers(
            referer=referer or "https://www.nseindia.com",
            accept="application/json, text/plain, */*",
        )
        # API calls are XHR/fetch
        h["sec-fetch-mode"] = "cors"
        h["sec-fetch-dest"] = "empty"
        h["sec-fetch-site"] = "same-origin"
        h["x-requested-with"] = "XMLHttpRequest"
        return h

    async def _init_session(self) -> None:
        async with self._lock:
            if self._initialized:
                return
            client = await self._get_client()

            async def _prime() -> None:
                # 1) Hit homepage to obtain initial cookies.
                async with self._sem:
                    r = await client.get("https://www.nseindia.com/", headers=self._page_headers())
                if r.status_code in (401, 403, 429):
                    # Some NSE setups return 403 on the very first request but still set cookies.
                    self._log.debug("nse_homepage_blocked", status=r.status_code)
                else:
                    r.raise_for_status()

                # 2) Confirm API access with an innocuous quote request.
                async with self._sem:
                    ping = await client.get(
                        "https://www.nseindia.com/api/quote-equity?symbol=SBIN",
                        headers=self._api_headers(referer="https://www.nseindia.com/get-quotes/equity?symbol=SBIN"),
                    )
                if ping.status_code == 200:
                    await self._persist_cookies_best_effort()
                    return
                if ping.status_code in (401, 403, 429):
                    # Reset client to rotate UA/cookies on next retry.
                    await self._reset_client()
                    raise UpstreamUnavailable(f"NSE blocked or rate-limited ({ping.status_code})")
                ping.raise_for_status()

            await with_retries(
                _prime,
                retries=2,
                retry_on=(UpstreamUnavailable, httpx.TransportError, httpx.TimeoutException),
            )
            self._initialized = True

    async def warmup(self) -> None:
        await self._init_session()

    async def get_warmed_client(self) -> httpx.AsyncClient:
        await self._init_session()
        return await self._get_client()

    async def healthcheck(self) -> bool:
        try:
            await self._init_session()
            client = await self._get_client()
            r = await client.get(
                "https://www.nseindia.com/api/quote-equity?symbol=SBIN",
                headers=self._api_headers(),
            )
            return r.status_code == 200
        except Exception:  # noqa: BLE001
            return False

    async def get_live_quote(self, symbol: str) -> LiveQuote:
        await self._init_session()
        client = await self._get_client()
        symbol = normalize_symbol(symbol)
        headers = self._api_headers(referer=f"https://www.nseindia.com/get-quotes/equity?symbol={symbol}")

        async def _do() -> LiveQuote:
            async with self._sem:
                r = await client.get(
                    f"https://www.nseindia.com/api/quote-equity?symbol={symbol}",
                    headers=headers,
                )
            if r.status_code in (401, 403, 429):
                raise UpstreamUnavailable(f"NSE blocked or rate-limited ({r.status_code})")
            r.raise_for_status()
            payload = r.json()
            price_info = payload.get("priceInfo") or {}
            if "lastPrice" not in price_info:
                raise InvalidUpstreamResponse("NSE quote missing priceInfo.lastPrice")

            ts = datetime.utcnow()
            return LiveQuote(
                symbol=symbol,
                last_price=float(price_info["lastPrice"]),
                timestamp=ts,
                source=self.source_name,
                change=_to_float(price_info.get("change")),
                change_percent=_to_float(price_info.get("pChange")),
                volume=_to_int(_deep_get(payload, ["securityWiseDP", "deliveryQuantity"])),
                open=_to_float(price_info.get("open")),
                high=_to_float(price_info.get("intraDayHighLow", {}).get("max")),
                low=_to_float(price_info.get("intraDayHighLow", {}).get("min")),
                prev_close=_to_float(price_info.get("previousClose")),
            )

        return await with_retries(
            _do,
            retries=2,
            retry_on=(UpstreamUnavailable, httpx.TransportError, httpx.TimeoutException),
        )

    async def get_price_history(
        self,
        symbol: str,
        *,
        start: date | None = None,
        end: date | None = None,
        interval: str = "1d",
    ) -> list[Candle]:
        if interval != "1d":
            raise ValueError("NSEFetcher currently supports interval='1d' only")

        await self._init_session()
        client = await self._get_client()
        symbol = normalize_symbol(symbol)
        start = start or date.today().replace(day=1)
        end = end or date.today()

        from_s = start.strftime("%d-%m-%Y")
        to_s = end.strftime("%d-%m-%Y")

        # NSE has historically accepted both a plain series value and a JSON-array-like encoding.
        series_values = ["EQ", "%5B%22EQ%22%5D"]
        urls = [
            "https://www.nseindia.com/api/historical/cm/equity"
            f"?symbol={symbol}&series={s}&from={from_s}&to={to_s}"
            for s in series_values
        ]
        headers = self._api_headers(referer=f"https://www.nseindia.com/get-quotes/equity?symbol={symbol}")

        async def _do() -> list[Candle]:
            last_exc: Exception | None = None
            payload: dict[str, Any] | None = None
            for url in urls:
                try:
                    async with self._sem:
                        r = await client.get(url, headers=headers)
                    if r.status_code in (401, 403, 429):
                        raise UpstreamUnavailable(f"NSE blocked or rate-limited ({r.status_code})")
                    r.raise_for_status()
                    payload = r.json()
                    break
                except Exception as exc:  # noqa: BLE001
                    last_exc = exc
                    payload = None
                    continue

            if payload is None:
                raise last_exc or UpstreamUnavailable("NSE historical endpoint unavailable")

            rows: list[dict[str, Any]] = payload.get("data") or []
            candles: list[Candle] = []
            for row in rows:
                ts = _parse_nse_date(row.get("CH_TIMESTAMP") or row.get("TIMESTAMP"))
                if ts is None:
                    continue
                candles.append(
                    Candle(
                        timestamp=ts,
                        open=float(row.get("CH_OPENING_PRICE") or row.get("OPEN")),
                        high=float(row.get("CH_TRADE_HIGH_PRICE") or row.get("HIGH")),
                        low=float(row.get("CH_TRADE_LOW_PRICE") or row.get("LOW")),
                        close=float(row.get("CH_CLOSING_PRICE") or row.get("CLOSE")),
                        volume=_to_int(row.get("CH_TOT_TRADED_QTY") or row.get("VOLUME")),
                    )
                )
            return candles

        return await with_retries(
            _do,
            retries=2,
            retry_on=(UpstreamUnavailable, httpx.TransportError, httpx.TimeoutException),
        )


@lru_cache(maxsize=1)
def get_nse_fetcher() -> NSEFetcher:
    return NSEFetcher()


async def warm_nse_session() -> None:
    await get_nse_fetcher().warmup()


def _deep_get(obj: dict[str, Any], path: list[str]) -> Any:
    cur: Any = obj
    for key in path:
        if not isinstance(cur, dict):
            return None
        cur = cur.get(key)
    return cur


def _to_float(v: Any) -> float | None:
    if v is None or v == "":
        return None
    try:
        return float(str(v).replace(",", ""))
    except Exception:  # noqa: BLE001
        return None


def _to_int(v: Any) -> int | None:
    if v is None or v == "":
        return None
    try:
        return int(float(str(v).replace(",", "")))
    except Exception:  # noqa: BLE001
        return None


def _parse_nse_date(v: Any) -> datetime | None:
    if not v:
        return None
    if isinstance(v, datetime):
        return v
    s = str(v)
    for fmt in ("%d-%b-%Y", "%d-%m-%Y", "%Y-%m-%d"):
        try:
            return datetime.strptime(s, fmt)
        except ValueError:
            continue
    return None
