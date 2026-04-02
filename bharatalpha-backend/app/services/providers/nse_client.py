from __future__ import annotations

from datetime import date

from app.services.data_pipeline.models import Candle, LiveQuote
from app.services.data_pipeline.nse_fetcher import get_nse_fetcher


class NSEClient:
    """Provider client for NSE scrape-based endpoints."""

    name = "nse"

    def __init__(self) -> None:
        self._fetcher = get_nse_fetcher()

    async def warmup(self) -> None:
        await self._fetcher.warmup()

    async def healthcheck(self) -> bool:
        return await self._fetcher.healthcheck()

    async def get_live_quote(self, symbol: str) -> LiveQuote:
        return await self._fetcher.get_live_quote(symbol)

    async def get_price_history(
        self,
        symbol: str,
        *,
        start: date | None = None,
        end: date | None = None,
        interval: str = "1d",
    ) -> list[Candle]:
        return await self._fetcher.get_price_history(symbol, start=start, end=end, interval=interval)
