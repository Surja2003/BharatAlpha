from __future__ import annotations

from datetime import datetime

from sqlalchemy import BigInteger, DateTime, Integer, Numeric, String, UniqueConstraint, text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.db.base import Base


class QuarterlyResult(Base):
    __tablename__ = "quarterly_results"
    __table_args__ = (UniqueConstraint("symbol", "quarter", name="uq_quarterly_results_symbol_quarter"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    symbol: Mapped[str] = mapped_column(String(20), index=True, nullable=False)
    quarter: Mapped[str] = mapped_column(String(20), nullable=False)

    revenue: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    net_profit: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    ebitda: Mapped[int | None] = mapped_column(BigInteger, nullable=True)

    eps: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    margin_pct: Mapped[float | None] = mapped_column(Numeric(6, 2), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        server_default=text("now()"),
    )
