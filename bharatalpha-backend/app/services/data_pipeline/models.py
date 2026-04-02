from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime


@dataclass(frozen=True)
class LiveQuote:
    symbol: str
    last_price: float
    timestamp: datetime
    source: str
    currency: str = "INR"
    change: float | None = None
    change_percent: float | None = None
    volume: int | None = None
    open: float | None = None
    high: float | None = None
    low: float | None = None
    prev_close: float | None = None


@dataclass(frozen=True)
class Candle:
    timestamp: datetime
    open: float
    high: float
    low: float
    close: float
    volume: int | None = None


@dataclass(frozen=True)
class NewsItem:
    title: str
    url: str
    published_at: datetime | None
    source: str
    summary: str | None = None
    symbols: list[str] | None = None
