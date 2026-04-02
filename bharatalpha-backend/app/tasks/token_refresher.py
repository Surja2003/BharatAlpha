from __future__ import annotations

import asyncio

import structlog

from app.redis_client import get_redis
from app.services.data_pipeline.iifl_fetcher import IIFLFetcher
from app.tasks.celery_app import celery_app


@celery_app.task(name="app.tasks.token_refresher.refresh_iifl_token")
def refresh_iifl_token() -> dict:
    """Refreshes IIFL token and caches it in Redis."""

    log = structlog.get_logger(__name__)

    async def _run() -> dict:
        redis_client = await get_redis()
        fetcher = IIFLFetcher(redis_client=redis_client)
        token = await fetcher._get_access_token()
        return {"success": True, "token_cached": bool(token)}

    try:
        return asyncio.run(_run())
    except Exception as exc:  # noqa: BLE001
        log.exception("refresh_iifl_token_failed")
        return {"success": False, "error": str(exc)}
