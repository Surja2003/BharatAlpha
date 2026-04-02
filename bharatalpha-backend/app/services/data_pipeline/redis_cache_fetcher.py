from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any

import redis.asyncio as redis

from app.config import settings
from app.services.data_pipeline.base_fetcher import BasePriceFetcher, normalize_symbol
from app.services.data_pipeline.exceptions import InvalidUpstreamResponse, UpstreamUnavailable
from app.services.data_pipeline.models import LiveQuote


class RedisCacheFetcher(BasePriceFetcher):
    """Fast cache-backed fetcher.

    Reads `price:{SYMBOL}` from Redis (written by websocket publisher / pollers).

    This provider is intentionally strict for single quotes (missing key => error)
    and permissive for bulk (returns only the symbols found).
    """

    source_name = "redis_cache"

    def __init__(self, *, redis_client: redis.Redis, max_tick_age_s: float | None = None) -> None:
        self._redis = redis_client
        self._max_tick_age_s = float(settings.REDIS_TICK_MAX_AGE_S if max_tick_age_s is None else max_tick_age_s)

    async def healthcheck(self) -> bool:
        try:
            await self._redis.ping()
            return True
        except Exception:  # noqa: BLE001
            return False

    async def get_live_quote(self, symbol: str) -> LiveQuote:
        symbol = normalize_symbol(symbol)
        raw = await self._redis.get(f"price:{symbol}")
        if not raw:
            raise UpstreamUnavailable("cache_miss")
        q = _parse_cached_tick(raw, symbol=symbol, max_tick_age_s=self._max_tick_age_s)
        return q

    async def get_bulk_quotes(self, symbols: list[str]) -> dict[str, LiveQuote]:
        symbols_n = [normalize_symbol(s) for s in symbols if str(s).strip()]
        if not symbols_n:
            return {}

        keys = [f"price:{s}" for s in symbols_n]
        raws = await self._redis.mget(keys)

        out: dict[str, LiveQuote] = {}
        for sym, raw in zip(symbols_n, raws, strict=False):
            if not raw:
                continue
            try:
                out[sym] = _parse_cached_tick(raw, symbol=sym, max_tick_age_s=self._max_tick_age_s)
            except Exception:  # noqa: BLE001
                continue
        return out


def _parse_cached_tick(raw: Any, *, symbol: str, max_tick_age_s: float) -> LiveQuote:
    try:
        obj = json.loads(raw)
    except Exception as exc:  # noqa: BLE001
        raise InvalidUpstreamResponse("Cached tick is not valid JSON") from exc

    if not isinstance(obj, dict):
        raise InvalidUpstreamResponse("Cached tick JSON must be an object")

    last = obj.get("last_price")
    if last is None:
        last = obj.get("last")
    if last is None:
        last = obj.get("ltp")
    if last is None:
        raise InvalidUpstreamResponse("Cached tick missing last price")

    ts = obj.get("ts") or obj.get("timestamp")
    dt = _parse_dt(ts)
    if dt is None:
        raise InvalidUpstreamResponse("Cached tick missing/invalid timestamp")

    # Normalize to naive UTC for internal consistency.
    if dt.tzinfo is not None:
        dt = dt.astimezone(timezone.utc).replace(tzinfo=None)

    age_s = (datetime.utcnow() - dt).total_seconds()
    if age_s > float(max_tick_age_s):
        raise UpstreamUnavailable("stale_cache")

    return LiveQuote(
        symbol=normalize_symbol(obj.get("symbol") or symbol),
        last_price=float(last),
        timestamp=dt,
        source="redis_cache",
        change=_to_float(obj.get("change")),
        change_percent=_to_float(obj.get("change_percent") or obj.get("changePercent")),
        volume=_to_int(obj.get("volume")),
        open=_to_float(obj.get("open")),
        high=_to_float(obj.get("high")),
        low=_to_float(obj.get("low")),
        prev_close=_to_float(obj.get("prev_close") or obj.get("prevClose")),
    )


def _parse_dt(v: Any) -> datetime | None:
    if not v:
        return None
    if isinstance(v, datetime):
        return v
    s = str(v).strip()
    if not s:
        return None
    try:
        # ISO-ish
        return datetime.fromisoformat(s.replace("Z", "+00:00"))
    except Exception:  # noqa: BLE001
        return None


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
