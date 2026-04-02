from __future__ import annotations

import asyncio
import json
import os
from datetime import datetime, timezone
from time import perf_counter
from typing import Any

from fastapi import APIRouter, Request

from app.config import settings
from app.api.v1.router import success_response
from app.redis_client import get_redis
from app.services.data_pipeline.base_fetcher import normalize_symbol
from app.services.data_pipeline.price_fetcher_factory import get_price_fetcher_with_fallbacks
from app.services.data_pipeline.redis_cache_fetcher import RedisCacheFetcher

router = APIRouter(prefix="/health", tags=["health"])


def _parse_iso_dt(v: Any) -> datetime | None:
    if not v:
        return None
    if isinstance(v, datetime):
        return v
    s = str(v).strip()
    if not s:
        return None
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00"))
    except Exception:  # noqa: BLE001
        return None


async def _tracked_symbols(redis_client) -> list[str]:
    try:
        tracked = await redis_client.smembers("tracked:symbols")
        symbols = sorted({normalize_symbol(s) for s in tracked if str(s).strip()})
        if symbols:
            return symbols
    except Exception:  # noqa: BLE001
        pass

    env_symbols = os.getenv("TRACKED_SYMBOLS", "").strip()
    if not env_symbols:
        return []
    return [normalize_symbol(s) for s in env_symbols.split(",") if s.strip()]


async def _redis_tick_health(redis_client) -> dict[str, Any]:
    symbols = await _tracked_symbols(redis_client)
    if not symbols:
        return {"tracked": 0, "hits": 0, "missing": 0}

    keys = [f"price:{s}" for s in symbols]
    raws = await redis_client.mget(keys)

    now = datetime.utcnow()
    hits = 0
    missing = 0
    invalid = 0
    stale = 0
    ages: list[float] = []

    sample_n = max(0, int(settings.REDIS_TICK_DIAG_SAMPLE_N))
    missing_syms: list[str] = []
    invalid_syms: list[str] = []
    stale_syms: list[str] = []

    for sym, raw in zip(symbols, raws, strict=False):
        if not raw:
            missing += 1
            if sample_n and len(missing_syms) < sample_n:
                missing_syms.append(sym)
            continue
        try:
            obj = json.loads(raw)
            if not isinstance(obj, dict):
                invalid += 1
                if sample_n and len(invalid_syms) < sample_n:
                    invalid_syms.append(sym)
                continue
            dt = _parse_iso_dt(obj.get("ts") or obj.get("timestamp"))
            if dt is None:
                invalid += 1
                if sample_n and len(invalid_syms) < sample_n:
                    invalid_syms.append(sym)
                continue
            # If tz-aware, normalize to naive UTC.
            if dt.tzinfo is not None:
                dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
            age_s = max(0.0, (now - dt).total_seconds())
            ages.append(age_s)
            hits += 1
            if age_s > float(settings.REDIS_TICK_MAX_AGE_S):
                stale += 1
                if sample_n and len(stale_syms) < sample_n:
                    stale_syms.append(sym)
        except Exception:  # noqa: BLE001
            invalid += 1
            if sample_n and len(invalid_syms) < sample_n:
                invalid_syms.append(sym)
            continue

    tracked_n = len(symbols)
    missing_ratio = (missing / tracked_n) if tracked_n else 0.0
    stale_ratio = (stale / hits) if hits else (None if tracked_n else 0.0)

    status = "ok"
    if tracked_n and (missing > 0 or stale > 0 or invalid > 0):
        status = "warn"

    return {
        "status": status,
        "tracked": len(symbols),
        "hits": hits,
        "missing": missing,
        "invalid": invalid,
        "stale": stale,
        "missing_ratio": round(float(missing_ratio), 4),
        "stale_ratio": (round(float(stale_ratio), 4) if stale_ratio is not None else None),
        "missing_symbols_sample": missing_syms,
        "invalid_symbols_sample": invalid_syms,
        "stale_symbols_sample": stale_syms,
        "freshest_age_s": min(ages) if ages else None,
        "stalest_age_s": max(ages) if ages else None,
        "max_age_s": float(settings.REDIS_TICK_MAX_AGE_S),
    }


@router.get("/providers")
async def providers_health(request: Request):
    providers = await get_price_fetcher_with_fallbacks()
    try:
        redis_client = await get_redis()
        providers = [RedisCacheFetcher(redis_client=redis_client), *providers]
    except Exception:  # noqa: BLE001
        pass

    async def _one(p):
        t0 = perf_counter()
        try:
            ok = await asyncio.wait_for(p.healthcheck(), timeout=1.5)
            out: dict[str, Any] = {
                "provider": p.source_name,
                "ok": bool(ok),
                "latency_ms": int((perf_counter() - t0) * 1000),
            }
            if p.source_name == "redis_cache" and bool(ok):
                try:
                    out["tick_cache"] = await _redis_tick_health(redis_client)
                except Exception as exc:  # noqa: BLE001
                    out["tick_cache_error"] = str(exc)
            if p.source_name == "iifl" and bool(ok):
                try:
                    out["scripmaster"] = {
                        "count": int(await redis_client.hlen("iifl:scrip_map")),
                        "ttl_s": int(await redis_client.ttl("iifl:scrip_map")),
                    }
                except Exception as exc:  # noqa: BLE001
                    out["scripmaster_error"] = str(exc) or type(exc).__name__
            return out
        except Exception as exc:  # noqa: BLE001
            msg = str(exc) or type(exc).__name__
            return {
                "provider": p.source_name,
                "ok": False,
                "latency_ms": int((perf_counter() - t0) * 1000),
                "error": msg,
            }

    items = await asyncio.gather(*[_one(p) for p in providers])

    # Best-effort: report whether the IIFL websocket publisher background task is alive.
    ws_task = getattr(request.app.state, "iifl_ws_task", None)
    ws_stop = getattr(request.app.state, "iifl_ws_stop", None)
    ws: dict[str, Any] = {"present": bool(ws_task)}
    if ws_task is not None:
        try:
            ws["done"] = bool(ws_task.done())
            ws["cancelled"] = bool(ws_task.cancelled())
            ws["running"] = not bool(ws_task.done())
            ws["stop_set"] = bool(ws_stop.is_set()) if ws_stop is not None else None
            if ws_task.done() and not ws_task.cancelled():
                try:
                    exc = ws_task.exception()
                    ws["error"] = str(exc) if exc else None
                except Exception:  # noqa: BLE001
                    ws["error"] = None
        except Exception:  # noqa: BLE001
            ws["error"] = "unable_to_inspect_task"

    # Cross-process liveness via Redis heartbeat timestamps.
    heartbeat: dict[str, Any] = {}
    try:
        redis_client = await get_redis()
        now = datetime.utcnow()

        async def _age(key: str) -> float | None:
            raw = await redis_client.get(key)
            dt = _parse_iso_dt(raw)
            if dt is None:
                return None
            if dt.tzinfo is not None:
                dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
            return max(0.0, (now - dt).total_seconds())

        heartbeat["iifl_ws_age_s"] = await _age(settings.IIFL_WS_HEARTBEAT_KEY)
        heartbeat["price_poller_age_s"] = await _age(settings.PRICE_POLLER_HEARTBEAT_KEY)

        # Last tick meta (WS may be alive but not receiving ticks).
        try:
            raw = await redis_client.get(settings.IIFL_WS_LAST_TICK_KEY)
            last_tick: dict[str, Any] | None = None
            if raw:
                obj = json.loads(raw)
                if isinstance(obj, dict):
                    last_tick = obj
            if last_tick:
                dt = _parse_iso_dt(last_tick.get("ts"))
                if dt is not None and dt.tzinfo is not None:
                    dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
                heartbeat["iifl_ws_last_symbol"] = last_tick.get("symbol")
                heartbeat["iifl_ws_last_tick_age_s"] = (
                    max(0.0, (now - dt).total_seconds()) if dt is not None else None
                )
        except Exception:  # noqa: BLE001
            heartbeat["iifl_ws_last_tick_error"] = "unavailable"

        # Rolling tick counter (windowed by key TTL)
        try:
            raw = await redis_client.get(settings.IIFL_WS_TICK_RATE_KEY)
            window_s = int(settings.IIFL_WS_TICK_RATE_WINDOW_S)
            n = int(raw) if raw and str(raw).strip().isdigit() else 0
            heartbeat["iifl_ws_ticks_window_s"] = window_s
            heartbeat["iifl_ws_ticks_in_window"] = n
            heartbeat["iifl_ws_ticks_per_min"] = round((n / max(1, window_s)) * 60.0, 2)
        except Exception:  # noqa: BLE001
            heartbeat["iifl_ws_tick_rate_error"] = "unavailable"

        # Per-symbol top-N tick counts (zset)
        try:
            top_n = max(1, int(settings.IIFL_WS_TICK_RATE_TOP_N))
            zkey = settings.IIFL_WS_TICK_RATE_ZSET_KEY
            zitems = await redis_client.zrevrange(zkey, 0, top_n - 1, withscores=True)
            heartbeat["iifl_ws_top_symbols"] = [
                {"symbol": sym, "ticks": int(score)}
                for (sym, score) in (zitems or [])
                if sym is not None
            ]
        except Exception:  # noqa: BLE001
            heartbeat["iifl_ws_top_symbols_error"] = "unavailable"

        heartbeat["ttl_s"] = int(settings.PUBLISHER_HEARTBEAT_TTL_S)
        heartbeat["keys"] = {
            "iifl_ws": settings.IIFL_WS_HEARTBEAT_KEY,
            "iifl_ws_last_tick": settings.IIFL_WS_LAST_TICK_KEY,
            "iifl_ws_tick_rate": settings.IIFL_WS_TICK_RATE_KEY,
            "iifl_ws_tick_rate_symbols": settings.IIFL_WS_TICK_RATE_ZSET_KEY,
            "price_poller": settings.PRICE_POLLER_HEARTBEAT_KEY,
        }
    except Exception:  # noqa: BLE001
        heartbeat["error"] = "unavailable"

    return success_response(
        request,
        {"items": items, "ws_publisher": ws, "publisher_heartbeat": heartbeat},
        data_source="internal",
    )
