from __future__ import annotations

import asyncio

import structlog
from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.models.db.signal import Signal
from app.models.db.stock import Stock
from app.services.data_pipeline.history_fetcher import try_fetch_history_with_fallbacks
from app.services.ml.signal_engine import generate_signal
from app.tasks.celery_app import celery_app


@celery_app.task(name="app.tasks.signal_generator.generate_signals_for_active")
def generate_signals_for_active() -> dict:
    """Generates and persists daily signals for active stocks."""

    log = structlog.get_logger(__name__)

    async def _run() -> dict:
        # We only need history; use the centralized fallback chain.
        lookback_days = 180

        async with AsyncSessionLocal() as session:
            res = await session.execute(select(Stock).where(Stock.is_active.is_(True)))
            stocks = list(res.scalars().all())

            generated = 0
            errors = 0
            for stock in stocks:
                symbol = stock.symbol
                result = await try_fetch_history_with_fallbacks(symbol, lookback_days=lookback_days, interval="1d")
                if not result.candles:
                    errors += 1
                    log.warning("signal_history_failed", symbol=symbol, errors=result.errors)
                    continue

                payload = generate_signal(symbol=symbol, candles=result.candles, live=None)
                payload.setdefault("model_scores", {})
                payload["model_scores"]["synthetic_history"] = bool(result.synthetic_history)

                row = Signal(
                    symbol=symbol,
                    signal=payload["signal"],
                    confidence=payload.get("confidence"),
                    risk_level=payload.get("risk_level"),
                    reasoning_chain=payload.get("reasoning_chain"),
                    targets=payload.get("targets"),
                    model_scores=payload.get("model_scores"),
                    market_regime=payload.get("market_regime"),
                    ltp_at_signal=payload.get("ltp_at_signal"),
                    bharatalpha_score=payload.get("bharatalpha_score"),
                    disclaimer=payload.get("disclaimer") or "Educational only.",
                )
                session.add(row)

                stock.signal = payload["signal"]
                stock.signal_confidence = payload.get("confidence")
                stock.risk_level = payload.get("risk_level")
                stock.bharatalpha_score = payload.get("bharatalpha_score")
                stock.signal_updated_at = payload.get("generated_at")

                generated += 1

            await session.commit()

        return {"success": True, "generated": generated, "errors": errors}

    try:
        return asyncio.run(_run())
    except Exception as exc:  # noqa: BLE001
        log.exception("generate_signals_for_active_failed")
        return {"success": False, "error": str(exc)}
