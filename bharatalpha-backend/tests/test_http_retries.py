from __future__ import annotations

import pytest

from app.services.data_pipeline.http import with_retries


class TransientError(Exception):
    pass


@pytest.mark.asyncio
async def test_with_retries_respects_retry_on_filter() -> None:
    calls = {"n": 0}

    async def fn() -> None:
        calls["n"] += 1
        raise ValueError("non-retryable")

    with pytest.raises(ValueError):
        await with_retries(fn, retries=5, retry_on=(TransientError,))

    assert calls["n"] == 1


@pytest.mark.asyncio
async def test_with_retries_retries_retryable_exceptions() -> None:
    calls = {"n": 0}

    async def fn() -> str:
        calls["n"] += 1
        if calls["n"] < 3:
            raise TransientError("try again")
        return "ok"

    out = await with_retries(fn, retries=5, retry_on=(TransientError,))
    assert out == "ok"
    assert calls["n"] == 3
