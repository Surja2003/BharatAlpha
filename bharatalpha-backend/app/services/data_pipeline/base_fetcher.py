from __future__ import annotations

import asyncio
from abc import ABC, abstractmethod
from datetime import date, datetime

from app.services.data_pipeline.models import Candle, LiveQuote, NewsItem


class BasePriceFetcher(ABC):
    source_name: str

    @abstractmethod
    async def healthcheck(self) -> bool:
        raise NotImplementedError

    @abstractmethod
    async def get_live_quote(self, symbol: str) -> LiveQuote:
        raise NotImplementedError

    async def get_bulk_quotes(self, symbols: list[str]) -> dict[str, LiveQuote]:
        # Default implementation: parallel fanout with a conservative cap.
        # Providers can override this for true bulk endpoints.
        results: dict[str, LiveQuote] = {}
        if not symbols:
            return results

        max_concurrency = min(8, len(symbols))
        sem = asyncio.Semaphore(max_concurrency)

        async def _one(sym: str) -> tuple[str, LiveQuote]:
            async with sem:
                q = await self.get_live_quote(sym)
                return sym, q

        pairs = await asyncio.gather(*[_one(s) for s in symbols])
        for sym, q in pairs:
            results[sym] = q
        return results

    async def get_price_history(
        self,
        symbol: str,
        *,
        start: date | None = None,
        end: date | None = None,
        interval: str = "1d",
    ) -> list[Candle]:
        raise NotImplementedError

    async def get_option_chain(self, symbol: str, *, expiry: date | None = None) -> dict:
        raise NotImplementedError

    async def aclose(self) -> None:
        """Best-effort cleanup hook for underlying network clients.

        Providers that hold onto resources (httpx clients, sessions, etc.) should
        override this. Default is a no-op.
        """

        return None


class BaseMutualFundFetcher(ABC):
    source_name: str

    @abstractmethod
    async def get_nav(self, scheme_code: str) -> dict:
        raise NotImplementedError


class BaseNewsFetcher(ABC):
    source_name: str

    @abstractmethod
    async def get_news(self, query: str, *, limit: int = 30) -> list[NewsItem]:
        raise NotImplementedError


def normalize_symbol(symbol: str) -> str:
    return symbol.strip().upper().replace(".NS", "")


def now_utc() -> datetime:
    return datetime.utcnow()
