from __future__ import annotations

import asyncio
import random
from collections.abc import Callable
from typing import Any

import httpx

from app.config import settings


_DEFAULT_UAS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
]


def default_headers(
    *,
    referer: str | None = None,
    accept: str = "application/json, text/plain, */*",
) -> dict[str, str]:
    headers = {
        "user-agent": random.choice(_DEFAULT_UAS),
        "accept": accept,
        "accept-language": "en-US,en;q=0.9",
        "connection": "keep-alive",
        "dnt": "1",
        "upgrade-insecure-requests": "1",
        "sec-fetch-site": "same-origin",
        "sec-fetch-mode": "navigate",
        "sec-fetch-dest": "document",
        "sec-ch-ua": '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
    }
    if referer:
        headers["referer"] = referer
    return headers


def new_async_client(*, base_url: str | None = None, headers: dict[str, str] | None = None) -> httpx.AsyncClient:
    limits = httpx.Limits(
        max_connections=int(settings.HTTPX_MAX_CONNECTIONS),
        max_keepalive_connections=int(settings.HTTPX_MAX_KEEPALIVE_CONNECTIONS),
        keepalive_expiry=float(settings.HTTPX_KEEPALIVE_EXPIRY_S),
    )
    timeout = httpx.Timeout(float(settings.HTTPX_TIMEOUT_S), connect=float(settings.HTTPX_CONNECT_TIMEOUT_S))
    kwargs: dict[str, object] = {
        "headers": headers or default_headers(),
        "timeout": timeout,
        "follow_redirects": True,
        "limits": limits,
        "http2": bool(settings.HTTPX_HTTP2),
        "transport": httpx.AsyncHTTPTransport(retries=0),
    }
    if base_url is not None:
        kwargs["base_url"] = base_url
    return httpx.AsyncClient(**kwargs)


async def with_retries(
    fn: Callable[[], Any],
    *,
    retries: int = 2,
    base_delay_s: float = 0.5,
    jitter_s: float = 0.3,
    retry_on: tuple[type[BaseException], ...] = (Exception,),
) -> Any:
    last_exc: Exception | None = None
    for attempt in range(retries + 1):
        try:
            return await fn()
        except Exception as exc:  # noqa: BLE001
            last_exc = exc
            if retry_on and not isinstance(exc, retry_on):
                raise
            if attempt >= retries:
                raise
            delay = base_delay_s * (2**attempt) + random.random() * jitter_s
            await asyncio.sleep(delay)
    raise last_exc or RuntimeError("retry loop failed")
