from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, Numeric, String, Text, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.models.db.base import Base


class Signal(Base):
    __tablename__ = "signals"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    symbol: Mapped[str] = mapped_column(String(20), index=True, nullable=False)

    signal: Mapped[str] = mapped_column(String(10), nullable=False)
    confidence: Mapped[int | None] = mapped_column(Integer, nullable=True)
    risk_level: Mapped[str | None] = mapped_column(String(10), nullable=True)

    reasoning_chain: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    targets: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    model_scores: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    market_regime: Mapped[str | None] = mapped_column(String(20), nullable=True)
    ltp_at_signal: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    bharatalpha_score: Mapped[int | None] = mapped_column(Integer, nullable=True)

    generated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow,
        server_default=text("now()"),
    )
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    backtest_sharpe: Mapped[float | None] = mapped_column(Numeric(6, 3), nullable=True)
    backtest_winrate: Mapped[float | None] = mapped_column(Numeric(6, 3), nullable=True)
    passed_backtest: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default=text("false"))

    disclaimer: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        default="Not financial advice. Educational only.",
    )
