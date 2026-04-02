from __future__ import annotations

from collections.abc import AsyncGenerator

import redis.asyncio as redis

from app.config import settings


_redis: redis.Redis | None = None


async def get_redis() -> redis.Redis:
    global _redis
    if _redis is None:
        _redis = redis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
        )
    return _redis


async def close_redis() -> None:
    global _redis
    if _redis is not None:
        await _redis.close()
        _redis = None


async def redis_dependency() -> AsyncGenerator[redis.Redis, None]:
    yield await get_redis()
