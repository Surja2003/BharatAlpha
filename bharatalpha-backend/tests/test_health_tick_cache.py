from __future__ import annotations

import json
from datetime import datetime, timedelta

import pytest

from app.api.v1.health import _redis_tick_health


class _FakeRedis:
    def __init__(self, *, values: dict[str, str], tracked: set[str]):
        self._values = values
        self._tracked = tracked

    async def smembers(self, key: str):
        assert key == "tracked:symbols"
        return self._tracked

    async def mget(self, keys: list[str]):
        return [self._values.get(k) for k in keys]


@pytest.mark.asyncio
async def test_redis_tick_health_counts_hits_missing_invalid(monkeypatch) -> None:
    now = datetime.utcnow()

    # Fresh tick
    t1 = {"symbol": "SBIN", "last_price": 1, "ts": (now - timedelta(seconds=1)).isoformat()}
    # Invalid JSON
    bad = "{not json"
    # Missing key for TCS

    r = _FakeRedis(
        values={
            "price:SBIN": json.dumps(t1),
            "price:INFY": bad,
        },
        tracked={"SBIN", "TCS", "INFY"},
    )

    out = await _redis_tick_health(r)
    assert out["status"] == "warn"
    assert out["tracked"] == 3
    assert out["hits"] == 1
    assert out["missing"] == 1
    assert out["invalid"] == 1
    assert out["missing_ratio"] == pytest.approx(1 / 3, rel=1e-3)
    assert out["stale_ratio"] == pytest.approx(0.0, abs=1e-9)
    assert out["missing_symbols_sample"] == ["TCS"]
    assert out["invalid_symbols_sample"] == ["INFY"]
    assert out["freshest_age_s"] is not None
    assert out["stalest_age_s"] is not None
