from __future__ import annotations

from datetime import datetime

from sqlalchemy import BigInteger, DateTime, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.db.base import Base


class Price(Base):
    __tablename__ = "prices"

    time: Mapped[datetime] = mapped_column(DateTime(timezone=True), primary_key=True, nullable=False)
    symbol: Mapped[str] = mapped_column(String(20), primary_key=True, nullable=False)

    open: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    high: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    low: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    close: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    volume: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    vwap: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
