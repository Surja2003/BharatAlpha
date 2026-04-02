from __future__ import annotations

import asyncio
from dataclasses import dataclass
from time import perf_counter
from typing import Any, Awaitable, Callable

import structlog

from app.services.data_pipeline.base_fetcher import BasePriceFetcher
from app.services.data_pipeline.exceptions import DataSourceError


_log = structlog.get_logger(__name__)


@dataclass(frozen=True)
class ProviderError:
    provider: str
    error: str


@dataclass(frozen=True)
class FirstSuccessResult:
    provider: str
    value: Any
    errors: list[ProviderError]
    latency_ms: int


class ProviderCallFailed(Exception):
    def __init__(self, *, provider: str, op: str, error: Exception):
        super().__init__(f"{provider} failed for {op}: {error}")
        self.provider = provider
        self.op = op
        self.error = error


class AllProvidersFailed(DataSourceError):
    def __init__(self, *, op: str, errors: list[ProviderError]):
        super().__init__(f"All providers failed for {op}")
        self.op = op
        self.errors = errors


async def _call_provider(
    provider: BasePriceFetcher,
    *,
    op: str,
    fn: Callable[[], Awaitable[Any]],
    timeout_s: float,
) -> tuple[str, Any]:
    t0 = perf_counter()
    try:
        v = await asyncio.wait_for(fn(), timeout=timeout_s)
        dt_ms = int((perf_counter() - t0) * 1000)
        _log.info("provider_ok", provider=provider.source_name, op=op, latency_ms=dt_ms)
        return provider.source_name, v
    except Exception as exc:  # noqa: BLE001
        dt_ms = int((perf_counter() - t0) * 1000)
        _log.warning("provider_err", provider=provider.source_name, op=op, latency_ms=dt_ms, err=str(exc))
        raise ProviderCallFailed(provider=provider.source_name, op=op, error=exc) from exc


async def first_success(
    providers: list[BasePriceFetcher],
    *,
    op: str,
    call_factory: Callable[[BasePriceFetcher], Callable[[], Awaitable[Any]]],
    timeout_s: float,
    overall_timeout_s: float,
) -> FirstSuccessResult:
    """Run providers concurrently and return the first successful result.

    - Per-provider timeout via asyncio.wait_for
    - Overall timeout enforces a strict time budget
    - Collects all errors from completed tasks before returning
    """

    t0 = perf_counter()
    errors: list[ProviderError] = []

    async def _one(p: BasePriceFetcher) -> tuple[str, Any]:
        return await _call_provider(p, op=op, fn=call_factory(p), timeout_s=timeout_s)

    tasks = [asyncio.create_task(_one(p)) for p in providers]
    try:
        pending = set(tasks)
        deadline = perf_counter() + float(overall_timeout_s)

        while pending and perf_counter() < deadline:
            remaining = max(0.0, deadline - perf_counter())
            done, pending = await asyncio.wait(
                pending,
                timeout=remaining,
                return_when=asyncio.FIRST_COMPLETED,
            )

            if not done:
                break

            for t in done:
                try:
                    provider, value = t.result()
                    for pt in pending:
                        pt.cancel()
                    latency_ms = int((perf_counter() - t0) * 1000)
                    return FirstSuccessResult(provider=provider, value=value, errors=errors, latency_ms=latency_ms)
                except ProviderCallFailed as exc:
                    errors.append(ProviderError(provider=exc.provider, error=str(exc.error)))
                except Exception as exc:  # noqa: BLE001
                    errors.append(ProviderError(provider="unknown", error=str(exc)))

        if not errors:
            raise TimeoutError(f"Time budget exceeded for {op}")
        raise AllProvidersFailed(op=op, errors=errors)
    finally:
        for t in tasks:
            if not t.done():
                t.cancel()
        # Drain cancellations to avoid leaking pending tasks.
        try:
            await asyncio.gather(*tasks, return_exceptions=True)
        except Exception:  # noqa: BLE001
            pass
