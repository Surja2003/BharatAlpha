from __future__ import annotations

import asyncio
import json
import os
from datetime import date, datetime, timedelta
from typing import Any
from zoneinfo import ZoneInfo

import httpx
import redis.asyncio as redis
import structlog
import websockets

from app.config import settings
from app.services.data_pipeline.base_fetcher import BasePriceFetcher, normalize_symbol
from app.services.data_pipeline.exceptions import CredentialsMissing, InvalidUpstreamResponse, UpstreamUnavailable
from app.services.data_pipeline.http import new_async_client, with_retries
from app.services.data_pipeline.models import Candle, LiveQuote
from app.services.providers.token_manager import IIFLTokenManager


class IIFLFetcher(BasePriceFetcher):
    """IIFL price fetcher.

    This implementation is intentionally defensive because IIFL's exact REST paths
    can vary by account/API version. You can override paths via env vars:
    - IIFL_AUTH_PATH (default: /apimarketdata/auth/login)
    - IIFL_QUOTE_PATH (default: /apimarketdata/marketdata/quote)

    If any call fails, callers should fall back to NSE/YFinance.
    """

    source_name = "iifl"

    def __init__(self, *, redis_client: redis.Redis) -> None:
        self._redis = redis_client
        self._log = structlog.get_logger(__name__)
        self._client: httpx.AsyncClient | None = None
        self._token_manager = IIFLTokenManager(redis_client=self._redis)

        # Default without trailing slash; some deployments are sensitive to it.
        self._auth_path = os.getenv("IIFL_AUTH_PATH", "/apimarketdata/auth/login")
        self._quote_path = os.getenv("IIFL_QUOTE_PATH", "/apimarketdata/marketdata/quote")
        self._history_path = os.getenv("IIFL_HISTORY_PATH", "/apimarketdata/instruments/history/")
        self._master_path = os.getenv("IIFL_MASTER_PATH", "/apimarketdata/instruments/master/")

        # Optional local mapping for symbol -> scrip code.
        # Supports either JSON: {"SBIN": 3045} or CSV: SBIN=3045,TCS=1660
        self._scrip_code_map: dict[str, int] = {}
        raw_map = os.getenv("IIFL_SCRIP_CODE_MAP")
        if raw_map:
            self._scrip_code_map = _parse_scrip_code_map(raw_map)

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None:
            if not settings.IIFL_BASE_URL:
                raise CredentialsMissing("IIFL_BASE_URL not configured")
            self._client = new_async_client(base_url=settings.IIFL_BASE_URL)
        return self._client

    async def aclose(self) -> None:
        if self._client is None:
            return
        try:
            await self._client.aclose()
        except Exception:  # noqa: BLE001
            pass
        self._client = None

    async def healthcheck(self) -> bool:
        # Keep healthcheck fast: prefer cached token; if absent, do a single quick probe.
        try:
            cached = await self._token_manager.get_cached()
            if cached:
                return True
        except Exception:  # noqa: BLE001
            pass

        try:
            if not settings.IIFL_API_KEY or not settings.IIFL_LOGIN_SECRET_KEY:
                return False

            client = await self._get_client()
            payload: dict[str, Any] = {
                "appKey": settings.IIFL_API_KEY,
                "secretKey": settings.IIFL_LOGIN_SECRET_KEY,
            }
            headers = {
                "accept": "application/json",
                "content-type": "application/json",
                "apikey": settings.IIFL_API_KEY,
            }

            # Do not reuse the full login flow here (variants/retries) to avoid
            # turning health into a slow upstream fanout.
            r = await asyncio.wait_for(client.post(self._auth_path, json=payload, headers=headers), timeout=0.6)
            if r.status_code != 200:
                return False
            data = r.json() if r.text else {}
            data_obj = data.get("data") or data.get("Data") or data
            if isinstance(data_obj, dict):
                token = (
                    data_obj.get("TokenId")
                    or data_obj.get("token")
                    or data_obj.get("Token")
                    or data_obj.get("accessToken")
                    or data_obj.get("AccessToken")
                )
                return bool(str(token).strip()) if token is not None else False
            return False
        except Exception:  # noqa: BLE001
            return False

    async def _get_access_token(self) -> str:
        token = await self._token_manager.get_or_refresh(login_fn=self._login_and_get_token)
        return token

    async def _login_and_get_token(self) -> str:
        if not settings.IIFL_API_KEY:
            raise CredentialsMissing("Missing IIFL_API_KEY")

        if not settings.IIFL_LOGIN_SECRET_KEY:
            tt_len = len((settings.IIFL_TTBLAZE_SECRET_KEY or "").strip()) if settings.IIFL_TTBLAZE_SECRET_KEY else 0
            sec_len = len((settings.IIFL_SECRET_KEY or "").strip()) if settings.IIFL_SECRET_KEY else 0
            if max(tt_len, sec_len) > 12:
                raise CredentialsMissing(
                    "Invalid TTBlaze secretKey: must be <= 12 chars (password-like). "
                    "You appear to have configured a long portal secret; replace it with the short TTBlaze login secret."
                )
            raise CredentialsMissing("Missing IIFL TTBlaze login secret key (<= 12 chars)")

        client = await self._get_client()

        secret_key = settings.IIFL_LOGIN_SECRET_KEY
        app_key = settings.IIFL_API_KEY

        # TTBlaze login payload/header shapes vary by deployment.
        # We try a small set of known variants (no retries on 400; just alternatives).
        base_headers = {
            "accept": "application/json",
            "content-type": "application/json",
        }

        # Keep this intentionally small to avoid excessive upstream calls.
        # Most TTBlaze deployments accept lowerCamel JSON keys.
        payload_variants: list[tuple[str, dict[str, Any]]] = [
            ("lowerCamel", {"appKey": app_key, "secretKey": secret_key}),
        ]

        header_variants: list[tuple[str, dict[str, str]]] = [
            ("with_apikey", {**base_headers, "apikey": app_key}),
            ("no_apikey", {**base_headers}),
        ]

        # Path variants: with and without trailing slash.
        path_variants: list[str] = []
        for p in [self._auth_path, self._auth_path.rstrip("/") + "/"]:
            if p and p not in path_variants:
                path_variants.append(p)

        async def _try_login(path: str, payload: dict[str, Any], headers: dict[str, str], variant: str) -> str:
            self._log.debug(
                "iifl_login_attempt",
                auth_path=path,
                variant=variant,
                app_key_length=len(app_key or ""),
                secret_key_length=len(secret_key or ""),
                secret_key_source=settings.IIFL_LOGIN_SECRET_SOURCE,
            )

            resp = await client.post(path, json=payload, headers=headers)
            text = resp.text

            # Parse JSON error payload if present (without assuming it always is JSON).
            err_payload: dict[str, Any] | None = None
            try:
                err_payload = resp.json() if text else None
            except Exception:  # noqa: BLE001
                err_payload = None

            if resp.status_code in (401, 403):
                raise CredentialsMissing("IIFL auth rejected credentials")

            if resp.status_code == 400:
                # Common TTBlaze error: {"type":"error","code":"e-response-0004","description":"Data Not found."}
                code = (err_payload or {}).get("code")
                desc = (err_payload or {}).get("description")
                hint = "Most commonly this means your appKey/secretKey pair is not valid for TTBlaze."
                try:
                    errs = (((err_payload or {}).get("result") or {}).get("errors") or []) if isinstance(err_payload, dict) else []
                    types = {t for e in errs if isinstance(e, dict) for t in (e.get("types") or []) if isinstance(t, str)}
                    if "string.max" in types:
                        hint = (
                            "Your TTBlaze `secretKey` must be <= 12 chars (password-like). "
                            "Use the short TTBlaze secret/password in `IIFL_SECRET_KEY` or a short `IIFL_TTBLAZE_SECRET_KEY` (<=12), not a long portal secret."
                        )
                except Exception:  # noqa: BLE001
                    pass

                hint = (
                    hint
                    + " "
                    + "Double-check that `IIFL_API_KEY` is the TTBlaze 'App Key' and the chosen login secret matches that app."
                )
                raise InvalidUpstreamResponse(
                    f"IIFL auth bad request (400): code={code!r} description={desc!r}. {hint}"
                )

            if resp.status_code in (429, 500, 502, 503, 504):
                raise UpstreamUnavailable(f"IIFL auth unavailable ({resp.status_code})")

            resp.raise_for_status()
            data = resp.json() if text else {}

            data_obj = data.get("data") or data.get("Data") or data
            token = None
            if isinstance(data_obj, dict):
                token = (
                    data_obj.get("TokenId")
                    or data_obj.get("token")
                    or data_obj.get("Token")
                    or data_obj.get("accessToken")
                    or data_obj.get("AccessToken")
                )

            if not token:
                self._log.warning(
                    "iifl_login_missing_token",
                    status=resp.status_code,
                    keys=list(data_obj.keys()) if isinstance(data_obj, dict) else type(data_obj).__name__,
                )
                raise InvalidUpstreamResponse("IIFL auth response missing token field")

            token_s = str(token).strip()
            if not token_s:
                raise InvalidUpstreamResponse("IIFL auth returned empty token")

            return token_s

        errors: list[str] = []
        last_exc: Exception | None = None
        for path in path_variants:
            for p_name, payload in payload_variants:
                for h_name, headers in header_variants:
                    variant = f"{p_name}/{h_name}"
                    try:
                        # Retry only on transient upstream/network failures; do not retry 400/credentials.
                        return await with_retries(
                            lambda: _try_login(path, payload, headers, variant),
                            retries=2,
                            retry_on=(UpstreamUnavailable, httpx.TransportError, httpx.TimeoutException),
                        )
                    except CredentialsMissing as exc:
                        # Credentials are wrong; don't try other shapes.
                        raise
                    except InvalidUpstreamResponse as exc:
                        # Could be wrong payload/path/secret; keep trying other shapes.
                        last_exc = exc
                        errors.append(f"{path} {variant}: {exc}")
                        continue
                    except Exception as exc:  # noqa: BLE001
                        last_exc = exc
                        errors.append(f"{path} {variant}: {type(exc).__name__}: {exc}")
                        continue

        # If all variants fail, raise the last error (with a compact summary).
        if last_exc is not None:
            msg = str(last_exc)
            if errors:
                msg = msg + " | attempts=" + str(min(len(errors), 6))
            raise InvalidUpstreamResponse(msg) from last_exc
        raise InvalidUpstreamResponse("IIFL auth failed")

    async def get_live_quote(self, symbol: str) -> LiveQuote:
        symbol = normalize_symbol(symbol)
        client = await self._get_client()
        token = await self._get_access_token()

        headers = {"authorization": f"Bearer {token}"}
        payload = {"symbol": symbol}

        async def _do() -> LiveQuote:
            r = await client.post(self._quote_path, json=payload, headers=headers)
            if r.status_code in (401, 403):
                # token expired; refresh once
                await self._token_manager.invalidate()
                raise UpstreamUnavailable("IIFL token expired")
            if r.status_code in (429, 500, 502, 503, 504):
                raise UpstreamUnavailable(f"IIFL quote unavailable ({r.status_code})")
            r.raise_for_status()
            data = r.json()
            q = data.get("data") or data.get("result") or data

            last = q.get("lastPrice") or q.get("ltp") or q.get("LastTradedPrice")
            if last is None:
                raise InvalidUpstreamResponse("IIFL quote missing last price")

            ts = datetime.utcnow()
            return LiveQuote(
                symbol=symbol,
                last_price=float(last),
                timestamp=ts,
                source=self.source_name,
                change=_to_float(q.get("change") or q.get("chg")),
                change_percent=_to_float(q.get("changePercent") or q.get("pChange")),
                volume=_to_int(q.get("volume") or q.get("vol")),
                open=_to_float(q.get("open")),
                high=_to_float(q.get("high")),
                low=_to_float(q.get("low")),
                prev_close=_to_float(q.get("prevClose") or q.get("previousClose")),
            )

        try:
            return await with_retries(_do, retries=1)
        except UpstreamUnavailable:
            # one refresh attempt if we invalidated token
            token = await self._get_access_token()
            return await with_retries(_do, retries=0)

    def _resolve_scrip_code(self, symbol: str) -> int:
        """Resolve IIFL ScripCode.

        The TTBlaze historical endpoint requires a numeric ScripCode.
        Resolution order:
        1) If `symbol` is already numeric, use it.
        2) If `IIFL_SCRIP_CODE_MAP` is configured, look up by normalized symbol.
        """

        s = normalize_symbol(symbol)
        if s.isdigit():
            return int(s)
        if s in self._scrip_code_map:
            return int(self._scrip_code_map[s])
        # Prefer Redis-loaded scrip map (built from scripmaster on startup)
        raise ValueError(
            "ScripCode not found for symbol; ensure IIFL scripmaster has been loaded or provide IIFL_SCRIP_CODE_MAP"
        )

    async def resolve_scrip_code(self, symbol: str) -> int:
        """Resolve ScripCode using env map first, then Redis scripmaster map."""

        s = normalize_symbol(symbol)
        if s.isdigit():
            return int(s)
        if s in self._scrip_code_map:
            return int(self._scrip_code_map[s])

        v = await self._redis.hget("iifl:scrip_map", s)
        if v:
            try:
                return int(_ensure_str(v))
            except Exception as exc:  # noqa: BLE001
                raise InvalidUpstreamResponse(f"Invalid scrip code in redis for {s}") from exc

        raise ValueError(f"ScripCode not found for symbol {s}")

    async def load_scrip_master(self, *, force: bool = False) -> int:
        """Fetch and cache the IIFL scripmaster (symbol <-> scrip code) into Redis.

        Stores:
          - Hash iifl:scrip_map: { SYMBOL -> ScripCode }
          - Hash iifl:code_map:  { ScripCode -> SYMBOL }
        TTL: 7 days
        """

        if not settings.IIFL_API_KEY:
            raise CredentialsMissing("Missing IIFL_API_KEY")

        if not force:
            # If TTL exists and there are entries, skip.
            ttl = await self._redis.ttl("iifl:scrip_map")
            if ttl and ttl > 0:
                try:
                    n = await self._redis.hlen("iifl:scrip_map")
                    if n and n > 0:
                        return int(n)
                except Exception:  # noqa: BLE001
                    pass

        client = await self._get_client()
        token = await self._get_access_token()
        headers = {
            "apikey": settings.IIFL_API_KEY,
            "authorization": f"Bearer {token}",
            "content-type": "application/json",
        }
        payload: dict[str, Any] = {"Exchange": "N", "ExchangeType": "C"}

        async def _do() -> dict[str, Any]:
            # TTBlaze docs mention GET, but some variants require POST with body.
            r = await client.post(self._master_path, json=payload, headers=headers)
            if r.status_code in (401, 403):
                await self._token_manager.invalidate()
                raise UpstreamUnavailable("IIFL token expired")
            if r.status_code in (429, 500, 502, 503, 504):
                raise UpstreamUnavailable(f"IIFL master unavailable ({r.status_code})")
            if r.status_code == 405:
                r = await client.get(self._master_path, headers=headers)
            r.raise_for_status()
            return r.json()

        data = await with_retries(_do, retries=1)
        rows: Any = data
        if isinstance(data, dict):
            rows = data.get("data") or data.get("Data") or data.get("result") or data.get("Result")
        if not isinstance(rows, list):
            raise InvalidUpstreamResponse("IIFL master response missing list")

        scrip_map: dict[str, str] = {}
        code_map: dict[str, str] = {}

        for row in rows:
            if not isinstance(row, dict):
                continue

            sym = (
                row.get("Symbol")
                or row.get("symbol")
                or row.get("TradingSymbol")
                or row.get("tradingsymbol")
                or row.get("ShortName")
                or row.get("shortname")
                or row.get("Name")
                or row.get("name")
            )
            code = row.get("ScripCode") or row.get("scripcode") or row.get("Scripcode") or row.get("Scrip_Code")
            if not sym or code is None:
                continue
            sym_s = normalize_symbol(str(sym))
            code_s = str(code).strip()
            if not code_s.isdigit():
                continue
            scrip_map[sym_s] = code_s
            code_map[code_s] = sym_s

        if not scrip_map:
            raise InvalidUpstreamResponse("IIFL master parsed to empty scrip map")

        pipe = self._redis.pipeline()
        await pipe.delete("iifl:scrip_map")
        await pipe.delete("iifl:code_map")
        await pipe.hset("iifl:scrip_map", mapping=scrip_map)
        await pipe.hset("iifl:code_map", mapping=code_map)
        await pipe.expire("iifl:scrip_map", 7 * 24 * 60 * 60)
        await pipe.expire("iifl:code_map", 7 * 24 * 60 * 60)
        await pipe.execute()

        self._log.info("iifl_scrip_master_loaded", count=len(scrip_map))
        return int(len(scrip_map))

    async def get_historical_iifl(self, symbol: str, days: int = 365, *, interval: str = "1d") -> list[Candle]:
        """Fetch OHLCV candles from IIFL TTBlaze historical endpoint.

        Endpoint:
          POST /apimarketdata/instruments/history/

        Requires headers:
          apikey: IIFL_API_KEY
          Authorization: Bearer <token>
        """

        if interval != "1d":
            raise ValueError("IIFL historical currently supports interval='1d' only")

        client = await self._get_client()
        token = await self._get_access_token()
        scrip_code = await self.resolve_scrip_code(symbol)

        if not settings.IIFL_API_KEY:
            raise CredentialsMissing("Missing IIFL_API_KEY")

        ist = ZoneInfo(settings.TIMEZONE)
        end_dt = datetime.now(ist)
        start_dt = end_dt - timedelta(days=int(days))

        # Match the format in IIFL docs/examples: YYYYMMDDHHMM (exchange local time)
        start_s = start_dt.strftime("%Y%m%d") + "0915"
        end_s = end_dt.strftime("%Y%m%d") + "0915"

        headers = {
            "apikey": settings.IIFL_API_KEY,
            "authorization": f"Bearer {token}",
            "content-type": "application/json",
        }

        payload: dict[str, Any] = {
            "Exchange": "N",
            "ExchangeType": "C",
            "ScripCode": int(scrip_code),
            "StartTime": start_s,
            "EndTime": end_s,
            "Interval": interval,
        }

        async def _do() -> list[Candle]:
            r = await client.post(self._history_path, json=payload, headers=headers)
            if r.status_code in (401, 403):
                await self._token_manager.invalidate()
                raise UpstreamUnavailable("IIFL token expired")
            if r.status_code in (429, 500, 502, 503, 504):
                raise UpstreamUnavailable(f"IIFL history unavailable ({r.status_code})")
            r.raise_for_status()
            data = r.json()

            # Try common shapes: {data:[...]}, {result:[...]}, or raw list
            rows = data
            if isinstance(data, dict):
                rows = data.get("data") or data.get("result") or data.get("Data") or data.get("Result")
            if not isinstance(rows, list):
                raise InvalidUpstreamResponse("IIFL history response missing candle list")

            candles: list[Candle] = []
            for row in rows:
                if not isinstance(row, dict):
                    continue

                ts = (
                    row.get("DateTime")
                    or row.get("Datetime")
                    or row.get("Time")
                    or row.get("Timestamp")
                    or row.get("ts")
                )
                dt = _parse_iifl_dt(ts)
                if dt is None:
                    continue

                open_ = row.get("Open") or row.get("open")
                high = row.get("High") or row.get("high")
                low = row.get("Low") or row.get("low")
                close = row.get("Close") or row.get("close")
                vol = row.get("Volume") or row.get("volume")
                if open_ is None or high is None or low is None or close is None:
                    continue

                candles.append(
                    Candle(
                        timestamp=dt,
                        open=float(open_),
                        high=float(high),
                        low=float(low),
                        close=float(close),
                        volume=_to_int(vol),
                    )
                )

            candles.sort(key=lambda c: c.timestamp)
            return candles

        try:
            return await with_retries(_do, retries=1)
        except UpstreamUnavailable:
            # one refresh attempt if we invalidated token
            token = await self._get_access_token()
            headers["authorization"] = f"Bearer {token}"
            return await with_retries(_do, retries=0)

    async def get_price_history(
        self,
        symbol: str,
        *,
        start: date | None = None,
        end: date | None = None,
        interval: str = "1d",
    ) -> list[Candle]:
        # For now, ignore explicit start/end and treat as lookback based on `start`.
        days = 365
        if start is not None:
            days = max(1, (date.today() - start).days)
        return await self.get_historical_iifl(symbol, days=days, interval=interval)


async def websocket_price_publisher(
    *,
    redis_client: redis.Redis,
    symbols: list[str],
    stop_event: asyncio.Event,
) -> None:
    """Connects to IIFL WS and publishes live ticks to Redis.

    Writes:
    - `price:{SYMBOL}` => JSON tick (TTL 10s)
    - publishes JSON tick on Redis channel `prices`

    This is best-effort; it reconnects on failure until stop_event is set.
    """

    log = structlog.get_logger(__name__)

    if not settings.IIFL_WS_URL:
        raise CredentialsMissing("IIFL_WS_URL not configured")

    # Some IIFL WS variants expect scrip codes rather than symbols.
    # We publish what we receive; API layer can map later.
    subs = [normalize_symbol(s) for s in symbols]

    while not stop_event.is_set():
        try:
            async with websockets.connect(settings.IIFL_WS_URL, ping_interval=20, ping_timeout=20) as ws:
                await ws.send(json.dumps({"type": "subscribe", "symbols": subs}))

                # Initial heartbeat: proves WS loop is alive even before first tick.
                try:
                    await redis_client.set(
                        settings.IIFL_WS_HEARTBEAT_KEY,
                        datetime.utcnow().isoformat(),
                        ex=int(settings.PUBLISHER_HEARTBEAT_TTL_S),
                    )
                except Exception:  # noqa: BLE001
                    pass

                while not stop_event.is_set():
                    raw = await ws.recv()
                    try:
                        tick = json.loads(raw)
                    except Exception:  # noqa: BLE001
                        continue

                    # Best-effort shape normalization
                    symbol = tick.get("symbol") or tick.get("Symbol")
                    if not symbol:
                        continue
                    symbol = normalize_symbol(str(symbol))
                    tick["symbol"] = symbol
                    tick.setdefault("source", "iifl_ws")
                    tick.setdefault("ts", datetime.utcnow().isoformat())

                    # Heartbeat on each tick (best-effort).
                    try:
                        await redis_client.set(
                            settings.IIFL_WS_HEARTBEAT_KEY,
                            datetime.utcnow().isoformat(),
                            ex=int(settings.PUBLISHER_HEARTBEAT_TTL_S),
                        )
                    except Exception:  # noqa: BLE001
                        pass

                    # Last tick metadata for health/debug across processes.
                    try:
                        await redis_client.set(
                            settings.IIFL_WS_LAST_TICK_KEY,
                            json.dumps({"ts": tick.get("ts"), "symbol": symbol}, separators=(",", ":")),
                            ex=int(settings.PUBLISHER_HEARTBEAT_TTL_S),
                        )
                    except Exception:  # noqa: BLE001
                        pass

                    # Rolling tick counter (best-effort): helps detect "alive but no ticks".
                    try:
                        key = settings.IIFL_WS_TICK_RATE_KEY
                        window_s = int(settings.IIFL_WS_TICK_RATE_WINDOW_S)
                        n = await redis_client.incr(key)
                        if n == 1:
                            await redis_client.expire(key, window_s)
                    except Exception:  # noqa: BLE001
                        pass

                    # Per-symbol rolling tick counts (best-effort): top-N activity.
                    try:
                        zkey = settings.IIFL_WS_TICK_RATE_ZSET_KEY
                        window_s = int(settings.IIFL_WS_TICK_RATE_WINDOW_S)
                        await redis_client.zincrby(zkey, 1.0, symbol)
                        # Only set expiry if none exists; avoids extending the window every tick.
                        await redis_client.expire(zkey, window_s, nx=True)
                    except Exception:  # noqa: BLE001
                        pass

                    await redis_client.set(f"price:{symbol}", json.dumps(tick), ex=10)
                    await redis_client.publish("prices", json.dumps(tick))

        except Exception as exc:  # noqa: BLE001
            log.warning("iifl_ws_error", err=str(exc))
            await asyncio.sleep(2.0)


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


def _parse_iifl_dt(v: Any) -> datetime | None:
    if not v:
        return None
    if isinstance(v, datetime):
        return v
    s = str(v).strip()
    # Common formats we've seen across brokers
    for fmt in (
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%d",
        "%d-%m-%Y %H:%M",
        "%d-%m-%Y",
        "%Y%m%d%H%M",
    ):
        try:
            return datetime.strptime(s, fmt)
        except ValueError:
            continue
    return None


def _parse_scrip_code_map(raw: str) -> dict[str, int]:
    raw = raw.strip()
    if not raw:
        return {}
    # JSON mapping
    if raw.startswith("{"):
        try:
            obj = json.loads(raw)
            if isinstance(obj, dict):
                return {normalize_symbol(k): int(v) for k, v in obj.items()}
        except Exception:  # noqa: BLE001
            return {}

    # CSV mapping: SBIN=3045,TCS=1660
    out: dict[str, int] = {}
    for part in raw.split(","):
        part = part.strip()
        if not part:
            continue
        if "=" not in part:
            continue
        k, v = part.split("=", 1)
        k = normalize_symbol(k)
        v = v.strip()
        if not v.isdigit():
            continue
        out[k] = int(v)
    return out


def _ensure_str(v: Any) -> str:
    if isinstance(v, bytes):
        return v.decode("utf-8", errors="ignore")
    return str(v)
