from __future__ import annotations

from dataclasses import asdict
from datetime import date, datetime, timedelta

import structlog

from app.api.v1.router import SEBI_DISCLAIMER
from app.services.data_pipeline.models import Candle, LiveQuote
from app.services.ml.technical_indicators import snapshot


_log = structlog.get_logger(__name__)


def _risk_level(*, atr14: float | None, price: float) -> str | None:
    if atr14 is None or price <= 0:
        return None
    atr_pct = atr14 / price
    if atr_pct < 0.015:
        return "low"
    if atr_pct < 0.03:
        return "medium"
    return "high"


def _confidence(*, sma_fast: float | None, sma_slow: float | None, rsi14: float | None, price: float) -> int | None:
    if sma_fast is None or sma_slow is None or rsi14 is None or price <= 0:
        return None

    gap_pct = abs(sma_fast - sma_slow) / price
    gap_score = min(1.0, gap_pct / 0.05)  # 5% gap => max

    rsi_dist = abs(rsi14 - 50.0) / 50.0
    rsi_score = min(1.0, rsi_dist)

    score = 0.6 * gap_score + 0.4 * rsi_score
    return int(round(score * 100))


def _market_regime(*, sma_fast: float | None, sma_slow: float | None, atr14: float | None, price: float) -> str | None:
    if sma_fast is None or sma_slow is None or atr14 is None or price <= 0:
        return None
    trend = "bull" if sma_fast >= sma_slow else "bear"
    vol = "lowvol" if (atr14 / price) < 0.02 else "highvol"
    return f"{trend}_{vol}"


def generate_signal(
    *,
    symbol: str,
    candles: list[Candle],
    live: LiveQuote | None = None,
) -> dict:
    """Generate a conservative BUY/SELL/HOLD signal from daily candles.

    This is Phase-3 ready but intentionally lightweight (no heavy ML deps).
    """

    if len(candles) < 60:
        return {
            "symbol": symbol,
            "signal": "HOLD",
            "confidence": None,
            "risk_level": None,
            "bharatalpha_score": None,
            "market_regime": None,
            "ltp_at_signal": float(live.last_price) if live else None,
            "generated_at": datetime.utcnow(),
            "targets": None,
            "model_scores": {"rule_engine": 1.0},
            "reasoning_chain": [
                {"rule": "min_history", "required": 60, "actual": len(candles), "result": "HOLD"}
            ],
            "disclaimer": SEBI_DISCLAIMER,
        }

    closes = [float(c.close) for c in candles]
    highs = [float(c.high) for c in candles]
    lows = [float(c.low) for c in candles]

    price = float(live.last_price) if live else closes[-1]
    snap = snapshot(closes, highs, lows)

    sma_fast = snap.sma_fast
    sma_slow = snap.sma_slow
    rsi14 = snap.rsi14
    atr14 = snap.atr14

    signal = "HOLD"
    rule_hit = "neutral"

    if sma_fast is not None and sma_slow is not None and rsi14 is not None:
        if sma_fast > sma_slow and 40.0 <= rsi14 <= 72.0:
            signal = "BUY"
            rule_hit = "trend_up"
        elif sma_fast < sma_slow and 28.0 <= rsi14 <= 60.0:
            signal = "SELL"
            rule_hit = "trend_down"

    conf = _confidence(sma_fast=sma_fast, sma_slow=sma_slow, rsi14=rsi14, price=price)
    risk = _risk_level(atr14=atr14, price=price)
    regime = _market_regime(sma_fast=sma_fast, sma_slow=sma_slow, atr14=atr14, price=price)

    targets = None
    if atr14 is not None and price > 0:
        sl = float(atr14) * 1.0
        tp = float(atr14) * 2.0
        if signal == "BUY":
            targets = {"stop_loss": round(price - sl, 2), "take_profit": round(price + tp, 2)}
        elif signal == "SELL":
            targets = {"stop_loss": round(price + sl, 2), "take_profit": round(price - tp, 2)}

    score = conf

    return {
        "symbol": symbol,
        "signal": signal,
        "confidence": conf,
        "risk_level": risk,
        "bharatalpha_score": score,
        "market_regime": regime,
        "ltp_at_signal": price,
        "generated_at": datetime.utcnow(),
        "targets": targets,
        "model_scores": {
            "rule_engine": 1.0,
            "sma_fast": sma_fast,
            "sma_slow": sma_slow,
            "rsi14": rsi14,
            "atr14": atr14,
        },
        "reasoning_chain": [
            {
                "rule": rule_hit,
                "sma_fast": sma_fast,
                "sma_slow": sma_slow,
                "rsi14": rsi14,
            }
        ],
        "disclaimer": SEBI_DISCLAIMER,
    }
