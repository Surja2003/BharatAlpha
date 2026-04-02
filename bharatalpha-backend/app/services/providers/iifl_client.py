from __future__ import annotations

import redis.asyncio as redis

from app.services.data_pipeline.iifl_fetcher import IIFLFetcher
from app.services.data_pipeline.models import Candle, LiveQuote


class IIFLClient:
    """Provider client for IIFL TTBlaze.

    This wraps the existing, defensive `IIFLFetcher` implementation.
    The intent is to provide a stable surface area for the Aggregator layer.
    """

    name = "iifl"

    def __init__(self, *, redis_client: redis.Redis) -> None:
        self._fetcher = IIFLFetcher(redis_client=redis_client)

    async def warmup(self) -> None:
        await self._fetcher._get_access_token()

    async def healthcheck(self) -> bool:
        return await self._fetcher.healthcheck()

    async def get_live_quote(self, symbol: str) -> LiveQuote:
        return await self._fetcher.get_live_quote(symbol)

    async def get_price_history(self, symbol: str, *, start=None, end=None, interval: str = "1d") -> list[Candle]:
        return await self._fetcher.get_price_history(symbol, start=start, end=end, interval=interval)
