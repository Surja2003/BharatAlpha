from __future__ import annotations

from dataclasses import dataclass

import redis.asyncio as redis


@dataclass(frozen=True)
class RedisCircuitBreakerConfig:
    failure_window_s: int = 60
    open_seconds: int = 120
    failures_to_open: int = 3


class RedisCircuitBreaker:
    """A small Redis-backed circuit breaker.

    This is intentionally minimal:
    - Counts failures in a sliding-ish fixed window via Redis TTL
    - Opens breaker for a short period

    It is designed to protect upstreams (and your own threads) during incidents.
    """

    def __init__(
        self,
        *,
        redis_client: redis.Redis,
        name: str,
        config: RedisCircuitBreakerConfig | None = None,
    ) -> None:
        self._redis = redis_client
        self._name = name
        self._cfg = config or RedisCircuitBreakerConfig()

        self._fails_key = f"cb:{name}:fails"
        self._open_key = f"cb:{name}:open"

    async def is_open(self) -> bool:
        return bool(await self._redis.get(self._open_key))

    async def record_success(self) -> None:
        try:
            await self._redis.delete(self._fails_key)
            await self._redis.delete(self._open_key)
        except Exception:  # noqa: BLE001
            pass

    async def record_failure(self) -> None:
        try:
            fails = await self._redis.incr(self._fails_key)
            await self._redis.expire(self._fails_key, int(self._cfg.failure_window_s))
            if int(fails) >= int(self._cfg.failures_to_open):
                await self._redis.set(self._open_key, "1", ex=int(self._cfg.open_seconds))
        except Exception:  # noqa: BLE001
            pass
