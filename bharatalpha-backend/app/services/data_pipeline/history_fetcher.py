from __future__ import annotations

import csv
import io
import zipfile
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from typing import Any, Callable

import structlog

from app.config import settings
from app.redis_client import get_redis
from app.services.data_pipeline.exceptions import CredentialsMissing, InvalidUpstreamResponse, UpstreamUnavailable
from app.services.data_pipeline.http import with_retries
from app.services.data_pipeline.iifl_fetcher import IIFLFetcher
from app.services.data_pipeline.models import Candle
from app.services.data_pipeline.price_fetcher_factory import get_price_fetcher_with_fallbacks


_log = structlog.get_logger(__name__)


@dataclass(frozen=True)
class HistoryFetchResult:
    candles: list[Candle]
    source: str
    synthetic_history: bool
    errors: list[dict[str, str]]


async def fetch_history_with_fallbacks(
    symbol: str,
    *,
    lookback_days: int,
    interval: str = "1d",
) -> HistoryFetchResult:
    res = await try_fetch_history_with_fallbacks(
        symbol,
        lookback_days=lookback_days,
        interval=interval,
    )
    if not res.candles:
        raise UpstreamUnavailable("Unable to fetch price history")
    return res


async def try_fetch_history_with_fallbacks(
    symbol: str,
    *,
    lookback_days: int,
    interval: str = "1d",
) -> HistoryFetchResult:
    symbol = symbol.strip().upper()
    errors: list[dict[str, str]] = []

    # 1) IIFL TTBlaze historical (primary)
    try:
        candles = await _history_iifl(symbol, days=lookback_days, interval=interval)
        if candles:
            return HistoryFetchResult(
                candles=candles,
                source="iifl_history",
                synthetic_history=False,
                errors=errors,
            )
        raise UpstreamUnavailable("no candles returned")
    except Exception as exc:  # noqa: BLE001
        errors.append({"source": "iifl_history", "error": str(exc)})

    # 2) NSE bhavcopy (new nsearchives URL; fallback to www1 historical zips)
    try:
        candles = await _history_nse_bhavcopy(symbol, lookback_days=lookback_days)
        if candles:
            return HistoryFetchResult(
                candles=candles,
                source="nse_bhavcopy",
                synthetic_history=False,
                errors=errors,
            )
        raise UpstreamUnavailable("no candles returned")
    except Exception as exc:  # noqa: BLE001
        errors.append({"source": "nse_bhavcopy", "error": str(exc)})

    # 3) jugaad-trader (best-effort; depends on installed module/version)
    try:
        candles = await _history_jugaad_trader(symbol, lookback_days=lookback_days, interval=interval)
        if candles:
            return HistoryFetchResult(
                candles=candles,
                source="jugaad_trader",
                synthetic_history=False,
                errors=errors,
            )
        raise UpstreamUnavailable("no candles returned")
    except Exception as exc:  # noqa: BLE001
        errors.append({"source": "jugaad_trader", "error": str(exc)})

    # 4) Synthetic (only if explicitly allowed)
    if settings.ALLOW_SYNTHETIC_HISTORY:
        candles = await _synthetic_history_from_live(symbol, lookback_days=lookback_days)
        if candles:
            return HistoryFetchResult(
                candles=candles,
                source="synthetic",
                synthetic_history=True,
                errors=errors,
            )

    return HistoryFetchResult(
        candles=[],
        source="none",
        synthetic_history=False,
        errors=errors,
    )


async def _history_iifl(symbol: str, *, days: int, interval: str) -> list[Candle]:
    if not settings.IIFL_API_KEY or not settings.IIFL_LOGIN_SECRET_KEY:
        raise CredentialsMissing("Missing IIFL_API_KEY and/or IIFL login secret key")
    redis_client = await get_redis()
    fetcher = IIFLFetcher(redis_client=redis_client)
    return await fetcher.get_historical_iifl(symbol, days=days, interval=interval)


def _bhavcopy_zip_url_www1(d: date) -> str:
    # Example:
    # https://www1.nseindia.com/content/historical/EQUITIES/2024/JAN/cm01JAN2024bhav.csv.zip
    return (
        "https://www1.nseindia.com/content/historical/EQUITIES/"
        f"{d.year}/{d.strftime('%b').upper()}/cm{d.strftime('%d%b%Y').upper()}bhav.csv.zip"
    )


def _nse_bhavcopy_headers() -> dict[str, str]:
    return {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        "Referer": "https://www.nseindia.com/",
        "Connection": "keep-alive",
    }


async def _history_nse_bhavcopy(symbol: str, *, lookback_days: int) -> list[Candle]:
    symbol = symbol.strip().upper()

    from app.services.data_pipeline.nse_fetcher import get_nse_fetcher

    fetcher = get_nse_fetcher()
    client = await fetcher.get_warmed_client()
    headers = _nse_bhavcopy_headers()

    # Primary (latest bhavcopy as CSV)
    primary_url = "https://nsearchives.nseindia.com/products/content/sec_bhavdata_equities.csv"
    try:
        r = await client.get(primary_url, headers=headers)
        if r.status_code == 200:
            c = _parse_nse_equities_bhavcsv(symbol, r.text)
            if c is not None:
                # If we only have the latest day, return it (this is just a fallback source anyway).
                return [c]
        elif r.status_code not in (404,):
            # If blocked, fall through to historical zip attempts.
            _log.info("nse_bhavcopy_primary_failed", status=r.status_code)
    except Exception as exc:  # noqa: BLE001
        _log.info("nse_bhavcopy_primary_error", err=str(exc))

    # Scan backwards; weekends/holidays will 404.
    # Use a small multiplier so we still get enough trading days.
    max_scan_days = max(60, lookback_days * 3)
    end_d = date.today()

    # Best-effort prime for www1 domain; some setups 403 without this.
    try:
        await client.get("https://www1.nseindia.com/archives/equities/bhavcopy/", headers=headers)
    except Exception:  # noqa: BLE001
        pass

    candles: list[Candle] = []

    async def _fetch_one(d: date) -> Candle | None:
        url = _bhavcopy_zip_url_www1(d)

        async def _do() -> Candle | None:
            r = await client.get(url, headers=headers)
            if r.status_code == 404:
                return None
            if r.status_code in (401, 403, 429, 500, 502, 503, 504):
                raise UpstreamUnavailable(f"NSE bhavcopy unavailable ({r.status_code})")
            r.raise_for_status()

            z = zipfile.ZipFile(io.BytesIO(r.content))
            names = [n for n in z.namelist() if n.lower().endswith(".csv")]
            if not names:
                raise InvalidUpstreamResponse("Bhavcopy zip missing CSV")
            with z.open(names[0], "r") as f:
                # Files are usually UTF-8 but tolerate bad bytes.
                text = io.TextIOWrapper(f, encoding="utf-8", errors="ignore")
                reader = csv.DictReader(text)
                for row in reader:
                    if not isinstance(row, dict):
                        continue
                    if (row.get("SYMBOL") or "").strip().upper() != symbol:
                        continue
                    if (row.get("SERIES") or "").strip().upper() not in {"EQ", "BE", "BZ"}:
                        continue

                    open_ = row.get("OPEN")
                    high = row.get("HIGH")
                    low = row.get("LOW")
                    close = row.get("CLOSE")
                    vol = row.get("TOTTRDQTY")
                    if open_ is None or high is None or low is None or close is None:
                        return None

                    ts = datetime(d.year, d.month, d.day)
                    return Candle(
                        timestamp=ts,
                        open=float(open_),
                        high=float(high),
                        low=float(low),
                        close=float(close),
                        volume=_to_int(vol),
                    )
            return None

        return await with_retries(_do, retries=1)

    for offset in range(max_scan_days):
        d = end_d - timedelta(days=offset)
        c = await _fetch_one(d)
        if c is not None:
            candles.append(c)
        if len(candles) >= lookback_days:
            break

    candles.sort(key=lambda c: c.timestamp)
    return candles


async def _history_jugaad_trader(symbol: str, *, lookback_days: int, interval: str) -> list[Candle]:
    if interval != "1d":
        raise ValueError("jugaad-trader fallback currently supports interval='1d' only")

    try:
        from jugaad_trader.nse import NSELive  # type: ignore

        jugaad_available = True
    except ImportError:
        try:
            from jugaad_trader import NSELive  # type: ignore

            jugaad_available = True
        except ImportError:
            jugaad_available = False

    if not jugaad_available:
        _log.info("jugaad_trader_not_available_skipping")
        return []

    nse = NSELive()  # noqa: N806

    start = date.today() - timedelta(days=max(1, lookback_days * 2))
    end = date.today()

    df = None
    # Try common entry points on NSELive
    for fn_name in ("stock_df", "historical_data", "equity_history"):
        fn = getattr(nse, fn_name, None)
        if not callable(fn):
            continue
        try:
            df = _call_jugaad_history(fn, symbol=symbol, start=start, end=end)
            break
        except Exception:  # noqa: BLE001
            df = None
            continue

    if df is None:
        raise UpstreamUnavailable("jugaad_trader did not provide a usable history function")

    return _candles_from_dataframe(df, limit=lookback_days)


def _parse_nse_equities_bhavcsv(symbol: str, csv_text: str) -> Candle | None:
    """Parse NSE sec_bhavdata_equities.csv (latest day) and return one Candle."""

    symbol = symbol.strip().upper()
    text = csv_text.lstrip("\ufeff")
    reader = csv.DictReader(io.StringIO(text))
    for row in reader:
        if not isinstance(row, dict):
            continue
        if (row.get("SYMBOL") or "").strip().upper() != symbol:
            continue
        if (row.get("SERIES") or "").strip().upper() not in {"EQ", "BE", "BZ"}:
            continue

        open_ = row.get("OPEN_PRICE") or row.get("OPEN")
        high = row.get("HIGH_PRICE") or row.get("HIGH")
        low = row.get("LOW_PRICE") or row.get("LOW")
        close = row.get("CLOSE_PRICE") or row.get("CLOSE")
        vol = row.get("TTL_TRD_QNTY") or row.get("TOTTRDQTY") or row.get("VOLUME")
        if open_ is None or high is None or low is None or close is None:
            return None

        dt_val = row.get("DATE1") or row.get("DATE") or row.get("TRADING_DATE")
        ts = _parse_date_like(dt_val) or datetime.utcnow()
        return Candle(
            timestamp=ts,
            open=float(open_),
            high=float(high),
            low=float(low),
            close=float(close),
            volume=_to_int(vol),
        )
    return None


def _call_jugaad_history(fn: Callable[..., Any], *, symbol: str, start: date, end: date) -> Any:
    # Attempt keyword variants seen across forks.
    for kwargs in (
        {"symbol": symbol, "from_date": start, "to_date": end, "series": "EQ"},
        {"symbol": symbol, "start": start, "end": end, "series": "EQ"},
        {"symbol": symbol, "from_date": start, "to_date": end},
        {"symbol": symbol, "start": start, "end": end},
    ):
        try:
            return fn(**kwargs)
        except TypeError:
            continue

    # Positional fallback (symbol, from, to)
    try:
        return fn(symbol, start, end)
    except TypeError as exc:
        raise exc


def _candles_from_dataframe(df: Any, *, limit: int) -> list[Candle]:
    # We expect a pandas.DataFrame-like object.
    try:
        import pandas as pd  # noqa: F401

        records = df.to_dict(orient="records")
    except Exception as exc:  # noqa: BLE001
        raise InvalidUpstreamResponse(f"Unexpected jugaad-trader history type: {type(df)} ({exc})")

    candles: list[Candle] = []
    for row in records:
        if not isinstance(row, dict):
            continue

        dt_val = row.get("DATE") or row.get("Date") or row.get("date") or row.get("TIMESTAMP")
        ts = _parse_date_like(dt_val)
        if ts is None:
            continue

        open_ = row.get("OPEN") or row.get("Open") or row.get("open")
        high = row.get("HIGH") or row.get("High") or row.get("high")
        low = row.get("LOW") or row.get("Low") or row.get("low")
        close = row.get("CLOSE") or row.get("Close") or row.get("close")
        vol = row.get("VOLUME") or row.get("Volume") or row.get("volume")

        if open_ is None or high is None or low is None or close is None:
            continue

        candles.append(
            Candle(
                timestamp=ts,
                open=float(open_),
                high=float(high),
                low=float(low),
                close=float(close),
                volume=_to_int(vol),
            )
        )

    candles.sort(key=lambda c: c.timestamp)
    if limit > 0 and len(candles) > limit:
        candles = candles[-limit:]
    return candles


def _parse_date_like(v: Any) -> datetime | None:
    if v is None or v == "":
        return None
    if isinstance(v, datetime):
        return v
    if isinstance(v, date):
        return datetime(v.year, v.month, v.day)
    s = str(v).strip()
    for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%d-%b-%Y", "%Y-%m-%d %H:%M:%S"):
        try:
            return datetime.strptime(s, fmt)
        except ValueError:
            continue
    return None


async def _synthetic_history_from_live(symbol: str, *, lookback_days: int) -> list[Candle]:
    import random

    fetchers = await get_price_fetcher_with_fallbacks()
    live = None
    for f in fetchers:
        try:
            live = await f.get_live_quote(symbol)
            break
        except Exception:  # noqa: BLE001
            continue

    if live is None:
        raise UpstreamUnavailable("Unable to fetch a live quote for synthetic history")

    rng = random.Random(symbol)
    price = float(live.last_price)
    out: list[Candle] = []
    for i in range(int(lookback_days), 0, -1):
        r = rng.gauss(0.0, 0.012)
        open_ = price
        close = max(1.0, open_ * (1.0 + r))
        intraday = abs(rng.gauss(0.0, 0.008))
        high = max(open_, close) * (1.0 + intraday)
        low = min(open_, close) * (1.0 - intraday)
        ts = datetime.utcnow() - timedelta(days=i)
        out.append(Candle(timestamp=ts, open=open_, high=high, low=low, close=close, volume=None))
        price = close

    return out


def _to_int(v: Any) -> int | None:
    if v is None or v == "":
        return None
    try:
        return int(float(str(v).replace(",", "")))
    except Exception:  # noqa: BLE001
        return None
