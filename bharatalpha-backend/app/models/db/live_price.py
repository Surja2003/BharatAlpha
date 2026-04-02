from __future__ import annotations

from datetime import datetime

from sqlalchemy import BigInteger, DateTime, Numeric, String, text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.db.base import Base


class LivePrice(Base):
    __tablename__ = "live_prices"

    symbol: Mapped[str] = mapped_column(String(20), primary_key=True)

    ltp: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    change: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    change_pct: Mapped[float | None] = mapped_column(Numeric(8, 4), nullable=True)

    open: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    high: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    low: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)

    volume: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    bid: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    ask: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)

    week52_high: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    week52_low: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow,
        server_default=text("now()"),
    )
