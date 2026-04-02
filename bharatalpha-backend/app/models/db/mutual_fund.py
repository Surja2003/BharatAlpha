from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import BigInteger, Boolean, Date, DateTime, Integer, Numeric, String, text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.db.base import Base


class MutualFund(Base):
    __tablename__ = "mutual_funds"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    scheme_code: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)
    isin: Mapped[str | None] = mapped_column(String(20), nullable=True)
    name: Mapped[str] = mapped_column(String(300), nullable=False)
    amc: Mapped[str | None] = mapped_column(String(100), nullable=True)
    category: Mapped[str | None] = mapped_column(String(50), nullable=True)
    subcategory: Mapped[str | None] = mapped_column(String(50), nullable=True)

    nav: Mapped[float | None] = mapped_column(Numeric(12, 4), nullable=True)
    nav_change: Mapped[float | None] = mapped_column(Numeric(10, 4), nullable=True)
    nav_change_pct: Mapped[float | None] = mapped_column(Numeric(8, 4), nullable=True)

    aum: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    expense_ratio: Mapped[float | None] = mapped_column(Numeric(6, 4), nullable=True)

    returns_1y: Mapped[float | None] = mapped_column(Numeric(8, 2), nullable=True)
    returns_3y: Mapped[float | None] = mapped_column(Numeric(8, 2), nullable=True)
    returns_5y: Mapped[float | None] = mapped_column(Numeric(8, 2), nullable=True)

    benchmark: Mapped[str | None] = mapped_column(String(100), nullable=True)
    benchmark_return_3y: Mapped[float | None] = mapped_column(Numeric(8, 2), nullable=True)

    risk_level: Mapped[str | None] = mapped_column(String(20), nullable=True)
    min_sip: Mapped[int | None] = mapped_column(Integer, nullable=True)
    min_lumpsum: Mapped[int | None] = mapped_column(Integer, nullable=True)

    bharatalpha_fund_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    nav_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        server_default=text("now()"),
    )
