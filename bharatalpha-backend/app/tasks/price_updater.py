from __future__ import annotations

import asyncio
import os

import structlog
from sqlalchemy import select

from app.database import async_sessionmaker
from app.models.db.stock import Stock
from app.redis_client import get_redis
from app.config import settings
from app.services.data_pipeline.price_fetcher_factory import get_price_fetcher_with_fallbacks
from app.tasks.celery_app import celery_app


@celery_app.task(name="app.tasks.price_updater.poll_live_prices")
def poll_live_prices() -> dict:
    """Polls live prices and stores latest ticks in Redis.

    Sources:
    - Primary: settings.PRICE_SOURCE
    - Fallbacks: NSE scrape, then yfinance

    Symbols list:
    - Uses DB `stocks` table where `is_active = true`
    - Falls back to env var `TRACKED_SYMBOLS=SBIN,TCS,INFY`
    """

    log = structlog.get_logger(__name__)

    async def _load_symbols() -> list[str]:
        env_symbols = os.getenv("TRACKED_SYMBOLS")
        if env_symbols:
            return [s.strip().upper() for s in env_symbols.split(",") if s.strip()]

        async with async_sessionmaker() as session:
            res = await session.execute(select(Stock.symbol).where(Stock.is_active.is_(True)))
            return [str(sym).upper() for (sym,) in res.all() if sym]

    async def _run() -> dict:
        redis_client = await get_redis()

        # Cross-process heartbeat so health can report publisher/poller liveness.
        try:
            from datetime import datetime

            await redis_client.set(
                settings.PRICE_POLLER_HEARTBEAT_KEY,
                datetime.utcnow().isoformat(),
                ex=int(settings.PUBLISHER_HEARTBEAT_TTL_S),
            )
        except Exception:  # noqa: BLE001
            pass
        symbols = await _load_symbols()
        if not symbols:
            return {"success": True, "polled": 0, "note": "no symbols configured"}

        fetchers = await get_price_fetcher_with_fallbacks()

        quotes: dict[str, dict] = {}
        for fetcher in fetchers:
            try:
                batch = await fetcher.get_bulk_quotes(symbols)
                quotes = {
                    sym: {
                        "symbol": q.symbol,
                        "last_price": q.last_price,
                        "ts": q.timestamp.isoformat(),
                        "source": q.source,
                        "change": q.change,
                        "change_percent": q.change_percent,
                    }
                    for sym, q in batch.items()
                }
                break
            except Exception as exc:  # noqa: BLE001
                log.warning("price_poll_failed", source=fetcher.source_name, err=str(exc))
                continue

        if not quotes:
            return {"success": False, "error": "all_sources_failed"}

        # Store and publish
        for sym, tick in quotes.items():
            await redis_client.set(f"price:{sym}", json_dumps(tick), ex=10)
        await redis_client.publish("prices", json_dumps({"type": "bulk", "ticks": quotes}))

        return {"success": True, "polled": len(quotes)}

    try:
        return asyncio.run(_run())
    except Exception as exc:  # noqa: BLE001
        log.exception("poll_live_prices_failed")
        return {"success": False, "error": str(exc)}


def json_dumps(obj: object) -> str:
    import json

    return json.dumps(obj, ensure_ascii=False, separators=(",", ":"))
