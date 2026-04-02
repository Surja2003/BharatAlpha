from __future__ import annotations

import json

import pytest

from app.services.data_pipeline.redis_cache_fetcher import RedisCacheFetcher
from app.services.data_pipeline.exceptions import UpstreamUnavailable


class _FakeRedis:
    def __init__(self, store: dict[str, str]):
        self._store = store

    async def ping(self) -> bool:
        return True

    async def get(self, key: str):
        return self._store.get(key)

    async def mget(self, keys: list[str]):
        return [self._store.get(k) for k in keys]


@pytest.mark.asyncio
async def test_redis_cache_fetcher_single_quote_parses_tick() -> None:
    tick = {
        "symbol": "SBIN",
        "last_price": 612.5,
        "ts": "2026-03-22T10:00:00",
        "change": 1.25,
        "change_percent": 0.2,
    }
    r = _FakeRedis({"price:SBIN": json.dumps(tick)})
    f = RedisCacheFetcher(redis_client=r, max_tick_age_s=10**9)  # type: ignore[arg-type]

    q = await f.get_live_quote("sbin")
    assert q.symbol == "SBIN"
    assert q.last_price == 612.5
    assert q.change == 1.25


@pytest.mark.asyncio
async def test_redis_cache_fetcher_bulk_returns_only_hits() -> None:
    t1 = {"symbol": "SBIN", "last_price": 600, "ts": "2026-03-22T10:00:00"}
    r = _FakeRedis({"price:SBIN": json.dumps(t1)})
    f = RedisCacheFetcher(redis_client=r, max_tick_age_s=10**9)  # type: ignore[arg-type]

    out = await f.get_bulk_quotes(["SBIN", "TCS"])
    assert set(out.keys()) == {"SBIN"}


@pytest.mark.asyncio
async def test_redis_cache_fetcher_stale_tick_is_cache_miss() -> None:
    tick = {"symbol": "SBIN", "last_price": 600, "ts": "2000-01-01T00:00:00"}
    r = _FakeRedis({"price:SBIN": json.dumps(tick)})
    f = RedisCacheFetcher(redis_client=r, max_tick_age_s=1.0)  # type: ignore[arg-type]

    with pytest.raises(UpstreamUnavailable):
        await f.get_live_quote("SBIN")
