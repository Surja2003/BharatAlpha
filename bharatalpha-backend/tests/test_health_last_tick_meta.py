from __future__ import annotations

import json
from datetime import datetime, timedelta

import pytest

from app.api.v1 import health as health_mod


class _FakeRedis:
    def __init__(self, values: dict[str, str]):
        self._values = values

    async def get(self, key: str):
        return self._values.get(key)


@pytest.mark.asyncio
async def test_health_last_tick_json_parses_without_error(monkeypatch) -> None:
    now = datetime.utcnow()
    last = {"ts": (now - timedelta(seconds=2)).isoformat(), "symbol": "SBIN"}

    r = _FakeRedis({"iifl:ws:last_tick": json.dumps(last)})

    # Exercise internal parsing logic used by providers_health
    raw = await r.get("iifl:ws:last_tick")
    obj = json.loads(raw)
    dt = health_mod._parse_iso_dt(obj.get("ts"))
    assert dt is not None
    assert obj.get("symbol") == "SBIN"
