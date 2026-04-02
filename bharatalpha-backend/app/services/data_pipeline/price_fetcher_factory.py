from __future__ import annotations

import structlog

from app.config import settings
from app.redis_client import get_redis
from app.services.data_pipeline.base_fetcher import BasePriceFetcher
from app.services.data_pipeline.iifl_fetcher import IIFLFetcher
from app.services.data_pipeline.nse_fetcher import get_nse_fetcher
from app.services.data_pipeline.yfinance_fetcher import YFinanceFetcher


_log = structlog.get_logger(__name__)

_iifl_fetcher: IIFLFetcher | None = None
_yfinance_fetcher: YFinanceFetcher | None = None


async def get_iifl_fetcher() -> IIFLFetcher:
    """Process-wide singleton IIFL fetcher.

    Important for latency: keeps a shared httpx client for connection pooling.
    """

    global _iifl_fetcher
    if _iifl_fetcher is None:
        redis_client = await get_redis()
        _iifl_fetcher = IIFLFetcher(redis_client=redis_client)
    return _iifl_fetcher


def get_yfinance_fetcher() -> YFinanceFetcher:
    global _yfinance_fetcher
    if _yfinance_fetcher is None:
        _yfinance_fetcher = YFinanceFetcher()
    return _yfinance_fetcher


async def close_price_fetchers() -> None:
    """Best-effort provider cleanup (called on app shutdown)."""

    global _iifl_fetcher, _yfinance_fetcher
    if _iifl_fetcher is not None:
        await _iifl_fetcher.aclose()
        _iifl_fetcher = None

    # NSE fetcher is cached via lru_cache.
    try:
        await get_nse_fetcher().aclose()
    except Exception:  # noqa: BLE001
        pass

    _yfinance_fetcher = None


async def get_price_fetcher() -> BasePriceFetcher:
    src = settings.PRICE_SOURCE
    if src == "iifl":
        return await get_iifl_fetcher()
    if src == "nse_scrape":
        return get_nse_fetcher()
    # fall back to yfinance for anything else (upstox/kite/truedata stubs)
    return get_yfinance_fetcher()


async def get_price_fetcher_with_fallbacks() -> list[BasePriceFetcher]:
    """Ordered list: preferred source first, then fallbacks."""
    primary = await get_price_fetcher()
    fallbacks: list[BasePriceFetcher] = []

    # Prefer NSE scrape before yfinance as a secondary, when primary isn't already NSE.
    if primary.source_name != "nse_scrape":
        fallbacks.append(get_nse_fetcher())
    if primary.source_name != "yfinance":
        fallbacks.append(get_yfinance_fetcher())

    # Deduplicate by source_name
    out: list[BasePriceFetcher] = []
    seen: set[str] = set()
    for f in [primary, *fallbacks]:
        if f.source_name in seen:
            continue
        seen.add(f.source_name)
        out.append(f)
    return out
