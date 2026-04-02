from __future__ import annotations

from collections.abc import Iterable
from dataclasses import dataclass
from math import fabs


def sma(values: list[float], window: int) -> float | None:
    if window <= 0 or len(values) < window:
        return None
    return sum(values[-window:]) / window


def rsi(values: list[float], window: int = 14) -> float | None:
    if window <= 0 or len(values) < window + 1:
        return None
    gains = 0.0
    losses = 0.0
    for i in range(-window, 0):
        delta = values[i] - values[i - 1]
        if delta >= 0:
            gains += delta
        else:
            losses -= delta
    if losses == 0:
        return 100.0
    rs = gains / losses
    return 100.0 - (100.0 / (1.0 + rs))


def true_ranges(highs: list[float], lows: list[float], closes: list[float]) -> list[float]:
    out: list[float] = []
    for i in range(len(highs)):
        prev_close = closes[i - 1] if i > 0 else closes[i]
        tr = max(
            highs[i] - lows[i],
            fabs(highs[i] - prev_close),
            fabs(lows[i] - prev_close),
        )
        out.append(tr)
    return out


def atr(highs: list[float], lows: list[float], closes: list[float], window: int = 14) -> float | None:
    if window <= 0 or len(highs) < window:
        return None
    trs = true_ranges(highs, lows, closes)
    return sum(trs[-window:]) / window


@dataclass(frozen=True)
class TrendSnapshot:
    sma_fast: float | None
    sma_slow: float | None
    rsi14: float | None
    atr14: float | None


def snapshot(
    closes: list[float],
    highs: list[float] | None = None,
    lows: list[float] | None = None,
) -> TrendSnapshot:
    hi = highs or closes
    lo = lows or closes
    return TrendSnapshot(
        sma_fast=sma(closes, 20),
        sma_slow=sma(closes, 50),
        rsi14=rsi(closes, 14),
        atr14=atr(hi, lo, closes, 14),
    )
