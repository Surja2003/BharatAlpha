from __future__ import annotations

from datetime import date, timedelta

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.api.v1.router import error_response, success_response
from app.database import get_db_session
from app.models.db.signal import Signal
from app.models.db.stock import Stock
from app.models.schemas.signals import SignalGenerateRequest
from app.services.data_pipeline.history_fetcher import try_fetch_history_with_fallbacks
from app.services.ml.signal_engine import generate_signal

router = APIRouter(prefix="/stocks", tags=["stocks"])


@router.get("/{symbol}/signal")
async def get_latest_signal(
	symbol: str,
	request: Request,
	session: AsyncSession = Depends(get_db_session),
):
	symbol = symbol.strip().upper()
	res = await session.execute(
		select(Signal).where(Signal.symbol == symbol).order_by(desc(Signal.generated_at)).limit(1)
	)
	row = res.scalars().first()
	if row is None:
		return error_response("NOT_FOUND", "No signal found", status_code=404)

	data = {
		"symbol": row.symbol,
		"signal": row.signal,
		"confidence": row.confidence,
		"risk_level": row.risk_level,
		"bharatalpha_score": row.bharatalpha_score,
		"market_regime": row.market_regime,
		"ltp_at_signal": float(row.ltp_at_signal) if row.ltp_at_signal is not None else None,
		"generated_at": row.generated_at,
		"targets": row.targets,
		"model_scores": row.model_scores,
		"reasoning_chain": row.reasoning_chain,
		"disclaimer": row.disclaimer,
	}
	return success_response(request, data, data_source="db")


@router.get("/{symbol}/signals")
async def list_signals(
	symbol: str,
	request: Request,
	limit: int = Query(30, ge=1, le=200),
	session: AsyncSession = Depends(get_db_session),
):
	symbol = symbol.strip().upper()
	res = await session.execute(
		select(Signal).where(Signal.symbol == symbol).order_by(desc(Signal.generated_at)).limit(limit)
	)
	rows = res.scalars().all()
	data = [
		{
			"symbol": r.symbol,
			"signal": r.signal,
			"confidence": r.confidence,
			"risk_level": r.risk_level,
			"bharatalpha_score": r.bharatalpha_score,
			"market_regime": r.market_regime,
			"ltp_at_signal": float(r.ltp_at_signal) if r.ltp_at_signal is not None else None,
			"generated_at": r.generated_at,
			"targets": r.targets,
			"model_scores": r.model_scores,
			"reasoning_chain": r.reasoning_chain,
			"disclaimer": r.disclaimer,
		}
		for r in rows
	]
	return success_response(request, {"symbol": symbol, "items": data}, data_source="db")


@router.post("/signals/generate")
async def generate_and_persist_signal(
	payload: SignalGenerateRequest,
	request: Request,
	session: AsyncSession = Depends(get_db_session),
):
	symbol = payload.symbol.strip().upper()

	# ensure stock exists (optional but helpful)
	stock = None
	stock_res = await session.execute(select(Stock).where(Stock.symbol == symbol).limit(1))
	stock = stock_res.scalars().first()

	result = await try_fetch_history_with_fallbacks(
		symbol,
		lookback_days=payload.lookback_days,
		interval=payload.interval,
	)
	if not result.candles:
		return error_response(
			"UPSTREAM_FAILED",
			"Unable to fetch price history",
			details={
				"errors": result.errors,
				"allow_synthetic_history": settings.ALLOW_SYNTHETIC_HISTORY,
			},
			status_code=502,
		)

	generated = generate_signal(symbol=symbol, candles=result.candles, live=None)
	generated.setdefault("model_scores", {})
	generated["model_scores"]["synthetic_history"] = bool(result.synthetic_history)
	if result.synthetic_history:
		generated["disclaimer"] = (
			(generated.get("disclaimer") or "")
			+ " NOTE: Synthetic price history was used."
		)

	row = Signal(
		symbol=symbol,
		signal=generated["signal"],
		confidence=generated.get("confidence"),
		risk_level=generated.get("risk_level"),
		reasoning_chain=generated.get("reasoning_chain"),
		targets=generated.get("targets"),
		model_scores=generated.get("model_scores"),
		market_regime=generated.get("market_regime"),
		ltp_at_signal=generated.get("ltp_at_signal"),
		bharatalpha_score=generated.get("bharatalpha_score"),
		disclaimer=generated.get("disclaimer") or "Educational only.",
	)
	session.add(row)

	if stock is not None:
		stock.signal = row.signal
		stock.signal_confidence = row.confidence
		stock.risk_level = row.risk_level
		stock.bharatalpha_score = row.bharatalpha_score
		stock.signal_updated_at = generated.get("generated_at")

	await session.commit()

	return success_response(request, generated, data_source="signal_engine")
