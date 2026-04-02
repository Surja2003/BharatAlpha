from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Query, Request

from app.api.v1.router import error_response, success_response
from app.config import settings
from app.services.marketdata.aggregator import AllProvidersFailed, DataSourceError, first_success
from app.redis_client import get_redis
from app.services.data_pipeline.news_fetcher import RSSNewsFetcher
from app.services.data_pipeline.price_fetcher_factory import get_price_fetcher_with_fallbacks
from app.services.data_pipeline.redis_cache_fetcher import RedisCacheFetcher

router = APIRouter(prefix="/market", tags=["market"])


@router.get("/quote/{symbol}")
async def get_quote(symbol: str, request: Request):
	# Fast path: Redis live tick cache (populated by WS publisher / Celery poller)
	try:
		redis_client = await get_redis()
		cache = RedisCacheFetcher(redis_client=redis_client)
		q = await cache.get_live_quote(symbol)
		return success_response(
			request,
			{
				"symbol": q.symbol,
				"last_price": q.last_price,
				"timestamp": q.timestamp.isoformat(),
				"change": q.change,
				"change_percent": q.change_percent,
				"volume": q.volume,
				"open": q.open,
				"high": q.high,
				"low": q.low,
				"prev_close": q.prev_close,
				"currency": q.currency,
			},
			data_source=q.source,
		)
	except Exception:  # noqa: BLE001
		pass

	fetchers = await get_price_fetcher_with_fallbacks()
	try:
		res = await first_success(
			fetchers,
			op="live_quote",
			call_factory=lambda f: (lambda: f.get_live_quote(symbol)),
			timeout_s=settings.LIVE_QUOTE_TIMEOUT_S,
			overall_timeout_s=settings.LIVE_QUOTE_BUDGET_S,
		)
		q = res.value
		return success_response(
			request,
			{
				"symbol": q.symbol,
				"last_price": q.last_price,
				"timestamp": q.timestamp.isoformat(),
				"change": q.change,
				"change_percent": q.change_percent,
				"volume": q.volume,
				"open": q.open,
				"high": q.high,
				"low": q.low,
				"prev_close": q.prev_close,
				"currency": q.currency,
			},
			data_source=res.provider,
		)
	except TimeoutError:
		return error_response("UPSTREAM_TIMEOUT", "Provider time budget exceeded", status_code=504)
	except AllProvidersFailed as exc:
		return error_response(
			"UPSTREAM_FAILED",
			"All data sources failed",
			details={"errors": [{"provider": e.provider, "error": e.error} for e in exc.errors]},
			status_code=502,
		)
	except DataSourceError as exc:
		return error_response(
			"UPSTREAM_FAILED",
			"All data sources failed",
			details={"error": str(exc)},
			status_code=502,
		)


@router.get("/quotes")
async def get_quotes(

	request: Request,
	symbols: str = Query(..., description="Comma-separated symbols, e.g. SBIN,TCS"),
):

	symbol_list = [s.strip().upper() for s in symbols.split(",") if s.strip()]
	if not symbol_list:
		return error_response("VALIDATION_ERROR", "No symbols provided")

	# Fast path: fill from Redis cache; fetch only missing symbols from providers.
	cached: dict[str, object] = {}
	missing = list(symbol_list)
	try:
		redis_client = await get_redis()
		cache = RedisCacheFetcher(redis_client=redis_client)
		cached_quotes = await cache.get_bulk_quotes(symbol_list)
		if cached_quotes:
			cached = {
				sym: {
					"symbol": q.symbol,
					"last_price": q.last_price,
					"timestamp": q.timestamp.isoformat(),
					"change": q.change,
					"change_percent": q.change_percent,
					"source": q.source,
				}
				for sym, q in cached_quotes.items()
			}
			missing = [s for s in symbol_list if s not in cached_quotes]
	except Exception:  # noqa: BLE001
		cached = {}
		missing = list(symbol_list)

	if not missing:
		return success_response(request, cached, data_source="redis_cache")

	fetchers = await get_price_fetcher_with_fallbacks()
	try:
		res = await first_success(
			fetchers,
			op="bulk_quotes",
			call_factory=lambda f: (lambda: f.get_bulk_quotes(missing)),
			timeout_s=settings.BULK_QUOTES_TIMEOUT_S,
			overall_timeout_s=settings.BULK_QUOTES_BUDGET_S,
		)
		batch = res.value
		data = {
			sym: {
				"symbol": q.symbol,
				"last_price": q.last_price,
				"timestamp": q.timestamp.isoformat(),
				"change": q.change,
				"change_percent": q.change_percent,
				"source": q.source,
			}
			for sym, q in batch.items()
		}
		merged = dict(cached)
		merged.update(data)
		return success_response(request, merged, data_source=res.provider)
	except TimeoutError:
		return error_response("UPSTREAM_TIMEOUT", "Provider time budget exceeded", status_code=504)
	except AllProvidersFailed as exc:
		return error_response(
			"UPSTREAM_FAILED",
			"All data sources failed",
			details={"errors": [{"provider": e.provider, "error": e.error} for e in exc.errors]},
			status_code=502,
		)
	except DataSourceError as exc:
		return error_response(
			"UPSTREAM_FAILED",
			"All data sources failed",
			details={"error": str(exc)},
			status_code=502,
		)


@router.get("/history/{symbol}")
async def get_history(

	symbol: str,
	request: Request,
	start: date | None = None,
	end: date | None = None,
	interval: str = "1d",
):

	fetchers = await get_price_fetcher_with_fallbacks()
	try:
		res = await first_success(
			fetchers,
			op="price_history",
			call_factory=lambda f: (lambda: f.get_price_history(symbol, start=start, end=end, interval=interval)),
			timeout_s=settings.HISTORY_TIMEOUT_S,
			overall_timeout_s=settings.HISTORY_BUDGET_S,
		)
		candles = res.value
		data = [
			{
				"timestamp": c.timestamp.isoformat(),
				"open": c.open,
				"high": c.high,
				"low": c.low,
				"close": c.close,
				"volume": c.volume,
			}
			for c in candles
		]
		return success_response(
			request,
			{"symbol": symbol.upper(), "candles": data},
			data_source=res.provider,
		)
	except TimeoutError:
		return error_response("UPSTREAM_TIMEOUT", "Provider time budget exceeded", status_code=504)
	except AllProvidersFailed as exc:
		return error_response(
			"UPSTREAM_FAILED",
			"All data sources failed",
			details={"errors": [{"provider": e.provider, "error": e.error} for e in exc.errors]},
			status_code=502,
		)
	except DataSourceError as exc:
		return error_response(
			"UPSTREAM_FAILED",
			"All data sources failed",
			details={"error": str(exc)},
			status_code=502,
		)


@router.get("/news")
async def get_news(request: Request, q: str = Query(..., min_length=2), limit: int = 30):
    fetcher = RSSNewsFetcher()
    items = await fetcher.get_news(q, limit=limit)
    data = [
        {
            "title": it.title,
            "url": it.url,
            "published_at": it.published_at.isoformat() if it.published_at else None,
            "source": it.source,
            "summary": it.summary,
            "symbols": it.symbols,
        }
        for it in items
    ]
    return success_response(request, {"query": q, "items": data}, data_source=fetcher.source_name)
