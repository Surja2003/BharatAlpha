from __future__ import annotations

import asyncio
import random
from dataclasses import dataclass

import httpx
import redis.asyncio as redis
import structlog

from app.services.data_pipeline.exceptions import CredentialsMissing, UpstreamUnavailable
from app.services.data_pipeline.http import with_retries
from app.services.providers.circuit_breaker import RedisCircuitBreaker


@dataclass(frozen=True)
class RedisSingleflightConfig:
    lock_ttl_s: int = 30
    wait_attempts: int = 10
    wait_sleep_s: float = 0.25


class IIFLTokenManager:
    """Manages IIFL TTBlaze access token lifecycle.

    Responsibilities:
    - Redis cache
    - singleflight refresh (avoid thundering herd)
    - circuit breaker around auth

    The actual login call is provided via a callback.
    """

    def __init__(
        self,
        *,
        redis_client: redis.Redis,
        cache_key: str = "iifl:access_token",
        lock_key: str = "iifl:access_token:lock",
        breaker_name: str = "iifl:auth",
        singleflight: RedisSingleflightConfig | None = None,
    ) -> None:
        self._redis = redis_client
        self._cache_key = cache_key
        self._lock_key = lock_key
        self._singleflight = singleflight or RedisSingleflightConfig()
        self._breaker = RedisCircuitBreaker(redis_client=redis_client, name=breaker_name)
        self._log = structlog.get_logger(__name__)

    async def get_cached(self) -> str | None:
        v = await self._redis.get(self._cache_key)
        return v if isinstance(v, str) and v.strip() else None

    async def invalidate(self) -> None:
        try:
            await self._redis.delete(self._cache_key)
        except Exception:  # noqa: BLE001
            pass

    async def get_or_refresh(
        self,
        *,
        login_fn,
        ttl_s: int = 24 * 60 * 60,
    ) -> str:
        cached = await self.get_cached()
        if cached:
            return cached

        if await self._breaker.is_open():
            raise UpstreamUnavailable("IIFL auth circuit breaker open")

        got_lock = False
        try:
            got_lock = bool(
                await self._redis.set(
                    self._lock_key,
                    "1",
                    ex=int(self._singleflight.lock_ttl_s),
                    nx=True,
                )
            )
            if not got_lock:
                # Wait for the other worker to refresh.
                for _ in range(int(self._singleflight.wait_attempts)):
                    await asyncio.sleep(float(self._singleflight.wait_sleep_s))
                    cached2 = await self.get_cached()
                    if cached2:
                        return cached2

                # Lock holder might be stuck; attempt takeover.
                got_lock = bool(
                    await self._redis.set(
                        self._lock_key,
                        "1",
                        ex=int(self._singleflight.lock_ttl_s),
                        nx=True,
                    )
                )

            async def _do_login() -> str:
                return await login_fn()

            try:
                token = await with_retries(
                    _do_login,
                    retries=2,
                    retry_on=(UpstreamUnavailable, httpx.TransportError, httpx.TimeoutException),
                )
                await self._breaker.record_success()
            except (CredentialsMissing,):
                # Credentials problems should not open the circuit.
                raise
            except (UpstreamUnavailable, httpx.TransportError, httpx.TimeoutException):
                await self._breaker.record_failure()
                raise

            token_s = str(token).strip()
            if not token_s:
                raise UpstreamUnavailable("IIFL auth returned empty token")

            # Add small jitter so multiple instances don't refresh simultaneously.
            ttl_s = int(ttl_s)
            ttl_s = max(60, ttl_s - random.randint(0, 5 * 60))
            await self._redis.set(self._cache_key, token_s, ex=ttl_s)
            return token_s
        finally:
            if got_lock:
                try:
                    await self._redis.delete(self._lock_key)
                except Exception:  # noqa: BLE001
                    pass
