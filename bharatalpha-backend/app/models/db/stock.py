from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import BigInteger, Boolean, Date, DateTime, Integer, Numeric, String, text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.db.base import Base


class Stock(Base):
    __tablename__ = "stocks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    symbol: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    sector: Mapped[str | None] = mapped_column(String(100), nullable=True)
    industry: Mapped[str | None] = mapped_column(String(100), nullable=True)
    exchange: Mapped[str] = mapped_column(String(10), nullable=False, default="NSE")
    series: Mapped[str] = mapped_column(String(5), nullable=False, default="EQ")
    isin: Mapped[str | None] = mapped_column(String(20), nullable=True)
    iifl_scrip_code: Mapped[str | None] = mapped_column(String(20), nullable=True)
    market_cap: Mapped[int | None] = mapped_column(BigInteger, nullable=True)

    pe_ratio: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    pb_ratio: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    ev_ebitda: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    roe: Mapped[float | None] = mapped_column(Numeric(8, 2), nullable=True)
    roce: Mapped[float | None] = mapped_column(Numeric(8, 2), nullable=True)
    debt_equity: Mapped[float | None] = mapped_column(Numeric(8, 2), nullable=True)
    current_ratio: Mapped[float | None] = mapped_column(Numeric(8, 2), nullable=True)
    eps: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    book_value: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    dividend_yield: Mapped[float | None] = mapped_column(Numeric(6, 2), nullable=True)
    revenue_growth_yoy: Mapped[float | None] = mapped_column(Numeric(8, 2), nullable=True)
    profit_growth_yoy: Mapped[float | None] = mapped_column(Numeric(8, 2), nullable=True)
    sector_pe: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)

    promoter_holding: Mapped[float | None] = mapped_column(Numeric(6, 2), nullable=True)
    fii_holding: Mapped[float | None] = mapped_column(Numeric(6, 2), nullable=True)
    dii_holding: Mapped[float | None] = mapped_column(Numeric(6, 2), nullable=True)
    promoter_change_qoq: Mapped[float | None] = mapped_column(Numeric(6, 2), nullable=True)
    fii_change_qoq: Mapped[float | None] = mapped_column(Numeric(6, 2), nullable=True)
    shareholding_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    bharatalpha_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    signal: Mapped[str | None] = mapped_column(String(10), nullable=True)
    signal_confidence: Mapped[int | None] = mapped_column(Integer, nullable=True)
    risk_level: Mapped[str | None] = mapped_column(String(10), nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    listed_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    fundamentals_updated_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    signal_updated_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        server_default=text("now()"),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        server_default=text("now()"),
    )
