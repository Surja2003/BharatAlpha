from __future__ import annotations

import asyncio

import pytest

from app.services.data_pipeline.base_fetcher import BasePriceFetcher
from app.services.marketdata.aggregator import first_success


class _Provider(BasePriceFetcher):
    def __init__(self, *, name: str, delay_s: float, fail: bool = False) -> None:
        self.source_name = name
        self._delay_s = delay_s
        self._fail = fail

    async def healthcheck(self) -> bool:
        return True

    async def get_live_quote(self, symbol: str):
        await asyncio.sleep(self._delay_s)
        if self._fail:
            raise RuntimeError("boom")
        return {"symbol": symbol, "provider": self.source_name}


@pytest.mark.asyncio
async def test_first_success_returns_fastest_provider() -> None:
    slow = _Provider(name="slow", delay_s=0.2)
    fast = _Provider(name="fast", delay_s=0.05)

    res = await first_success(
        [slow, fast],
        op="live_quote",
        call_factory=lambda p: (lambda: p.get_live_quote("SBIN")),
        timeout_s=0.5,
        overall_timeout_s=0.5,
    )

    assert res.provider == "fast"
    assert res.value["symbol"] == "SBIN"


@pytest.mark.asyncio
async def test_first_success_skips_failures_and_returns_next_success() -> None:
    bad = _Provider(name="bad", delay_s=0.01, fail=True)
    ok = _Provider(name="ok", delay_s=0.05)

    res = await first_success(
        [bad, ok],
        op="live_quote",
        call_factory=lambda p: (lambda: p.get_live_quote("SBIN")),
        timeout_s=0.5,
        overall_timeout_s=0.5,
    )

    assert res.provider == "ok"
    assert res.value["provider"] == "ok"
