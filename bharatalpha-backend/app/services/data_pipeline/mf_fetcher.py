from __future__ import annotations

import asyncio
from datetime import datetime

import httpx
import redis.asyncio as redis
import structlog

from app.services.data_pipeline.base_fetcher import BaseMutualFundFetcher
from app.services.data_pipeline.http import new_async_client, with_retries


_AMFI_NAV_ALL_URL = "https://www.amfiindia.com/spages/NAVAll.txt"


class AMFIFetcher(BaseMutualFundFetcher):
    source_name = "amfi_free"

    def __init__(self, *, redis_client: redis.Redis | None = None) -> None:
        self._redis = redis_client
        self._client: httpx.AsyncClient | None = None
        self._log = structlog.get_logger(__name__)

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = new_async_client(headers={"user-agent": "BharatAlpha/1.0"})
        return self._client

    async def _get_nav_all_text(self) -> str:
        cache_key = "amfi:navall"
        if self._redis is not None:
            try:
                cached = await self._redis.get(cache_key)
                if cached:
                    return cached
            except Exception:  # noqa: BLE001
                # Redis is optional for AMFI caching; ignore connection issues.
                pass

        client = await self._get_client()

        async def _do() -> str:
            r = await client.get(_AMFI_NAV_ALL_URL)
            r.raise_for_status()
            return r.text

        text = await with_retries(_do, retries=2)
        if self._redis is not None:
            # cache for 6 hours
            try:
                await self._redis.set(cache_key, text, ex=6 * 60 * 60)
            except Exception:  # noqa: BLE001
                pass
        return text

    async def get_nav(self, scheme_code: str) -> dict:
        scheme_code = scheme_code.strip()
        text = await self._get_nav_all_text()
        # NAVAll format: Scheme Code;ISIN Div Payout/ ISIN Growth;ISIN Div Reinvestment;Scheme Name;Net Asset Value;Date
        lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
        for ln in lines:
            if not ln[0].isdigit():
                continue
            parts = [p.strip() for p in ln.split(";")]
            if len(parts) < 6:
                continue
            if parts[0] != scheme_code:
                continue
            return {
                "scheme_code": parts[0],
                "scheme_name": parts[3],
                "nav": float(parts[4]),
                "date": parts[5],
                "source": self.source_name,
                "fetched_at": datetime.utcnow().isoformat(),
            }
        return {
            "scheme_code": scheme_code,
            "source": self.source_name,
            "error": "SCHEME_NOT_FOUND",
        }


async def close_amfi(fetcher: AMFIFetcher) -> None:
    if fetcher._client is not None:
        await fetcher._client.aclose()
        fetcher._client = None
