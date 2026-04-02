from __future__ import annotations

from fastapi import APIRouter, Request

from app.api.v1.router import success_response
from app.redis_client import get_redis
from app.services.data_pipeline.mf_fetcher import AMFIFetcher

router = APIRouter(prefix="/funds", tags=["mutual_funds"])


@router.get("/nav/{scheme_code}")
async def get_nav(scheme_code: str, request: Request):
	fetcher = AMFIFetcher(redis_client=await get_redis())
	data = await fetcher.get_nav(scheme_code)
	return success_response(request, data, data_source=fetcher.source_name)
