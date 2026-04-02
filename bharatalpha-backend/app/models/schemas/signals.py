from __future__ import annotations

from datetime import datetime

from pydantic import ConfigDict
from pydantic import BaseModel, Field


class SignalGenerateRequest(BaseModel):
    symbol: str = Field(..., examples=["SBIN"])
    interval: str = Field(default="1d", examples=["1d"])
    lookback_days: int = Field(default=120, ge=30, le=365)


class SignalOut(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    symbol: str
    signal: str
    confidence: int | None = None
    risk_level: str | None = None

    bharatalpha_score: int | None = None
    market_regime: str | None = None

    ltp_at_signal: float | None = None
    generated_at: datetime

    targets: dict | None = None
    model_scores: dict | None = None
    reasoning_chain: list | None = None

    disclaimer: str
