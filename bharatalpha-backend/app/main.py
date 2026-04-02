from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager
from time import perf_counter
from uuid import uuid4

import structlog
import redis
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.v1.router import error_response, get_api_router, success_response
from app.config import settings
from app.database import close_engine
from app.logging import configure_logging
from app.redis_client import close_redis
from app.security import TokenError

from sqlalchemy.exc import OperationalError


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging(settings.ENVIRONMENT, settings.DEBUG)
    log = structlog.get_logger(__name__)
    log.info("startup", app=settings.APP_NAME, environment=settings.ENVIRONMENT)

    # Startup ordering (per data pipeline needs):
    # 1) IIFL token
    # 2) IIFL scripmaster map
    # 3) NSE warm session (for fallbacks)
    if settings.PRICE_SOURCE == "iifl":
        log.info(
            "iifl_config",
            app_key_length=len(settings.IIFL_API_KEY or ""),
            secret_key_length=len(settings.IIFL_LOGIN_SECRET_KEY or ""),
            secret_key_source=settings.IIFL_LOGIN_SECRET_SOURCE,
        )
        try:
            from app.services.data_pipeline.price_fetcher_factory import get_iifl_fetcher

            iifl = await get_iifl_fetcher()
            await iifl._get_access_token()  # token cached in Redis
            log.info("IIFL token generated successfully")

            n = await iifl.load_scrip_master()
            log.info("Loaded scrip codes from IIFL", count=n)
        except Exception:
            log.exception("iifl_startup_init_failed")

    # Best-effort: warm NSE cookies once so subsequent NSE calls are less likely to 401/403.
    try:
        from app.services.data_pipeline.nse_fetcher import warm_nse_session

        await warm_nse_session()
        log.info("nse_session_warmed")
    except Exception:
        log.info("nse_session_warm_skipped")

    ws_task: asyncio.Task | None = None
    ws_stop: asyncio.Event | None = None
    if settings.PRICE_SOURCE == "iifl":
        try:
            from app.redis_client import get_redis
            from app.services.data_pipeline.iifl_fetcher import websocket_price_publisher

            # Prefer Redis-managed symbol list; fallback to env var.
            import os

            redis_client = await get_redis()
            tracked = await redis_client.smembers("tracked:symbols")
            symbols = sorted({str(s).strip().upper() for s in tracked if str(s).strip()})
            if not symbols:
                env_symbols = os.getenv("TRACKED_SYMBOLS", "").strip()
                symbols = [s.strip().upper() for s in env_symbols.split(",") if s.strip()]

            if symbols:
                ws_stop = asyncio.Event()
                ws_task = asyncio.create_task(
                    websocket_price_publisher(
                        redis_client=redis_client,
                        symbols=symbols,
                        stop_event=ws_stop,
                    )
                )
                app.state.iifl_ws_task = ws_task
                app.state.iifl_ws_stop = ws_stop
                log.info("iifl_ws_started", symbols=len(symbols))
        except Exception:
            log.exception("iifl_ws_start_failed")
    yield

    if ws_stop is not None:
        ws_stop.set()
    if ws_task is not None:
        ws_task.cancel()
        try:
            await ws_task
        except Exception:  # noqa: BLE001
            pass

    try:
        from app.services.data_pipeline.price_fetcher_factory import close_price_fetchers

        await close_price_fetchers()
    except Exception:
        log.exception("provider_shutdown_cleanup_failed")
    await close_redis()
    await close_engine()
    log.info("shutdown")


app = FastAPI(title=settings.APP_NAME, debug=settings.DEBUG, lifespan=lifespan)

allowed_origins = [
    "https://bharatalpha.in",
    "http://localhost",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if settings.ENVIRONMENT != "development" else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_timing_middleware(request: Request, call_next):
    request.state.start_perf = perf_counter()
    request_id = request.headers.get("x-request-id") or str(uuid4())
    request.state.request_id = request_id

    structlog.contextvars.bind_contextvars(
        request_id=request_id,
        path=str(request.url.path),
        method=request.method,
    )
    try:
        response = await call_next(request)
        response.headers["x-request-id"] = request_id
        return response
    finally:
        try:
            structlog.contextvars.clear_contextvars()
        except Exception:  # noqa: BLE001
            pass


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    code = "HTTP_ERROR"
    if exc.status_code == 404:
        code = "NOT_FOUND"
    elif exc.status_code == 401:
        code = "UNAUTHORIZED"
    elif exc.status_code == 403:
        code = "FORBIDDEN"
    return error_response(code, str(exc.detail), status_code=exc.status_code)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return error_response(
        "VALIDATION_ERROR",
        "Request validation failed",
        details={"errors": exc.errors()},
        status_code=422,
    )


@app.exception_handler(TokenError)
async def token_exception_handler(request: Request, exc: TokenError):
    return error_response("UNAUTHORIZED", "Unauthorized", status_code=401)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    log = structlog.get_logger(__name__)
    log.exception("unhandled_error", path=str(request.url.path))
    return error_response("INTERNAL_ERROR", "Internal server error", status_code=500)


@app.exception_handler(OperationalError)
async def db_operational_error_handler(request: Request, exc: OperationalError):
    return error_response(
        "DB_UNAVAILABLE",
        "Database unavailable",
        status_code=503,
    )


@app.exception_handler(ConnectionRefusedError)
async def connection_refused_error_handler(request: Request, exc: ConnectionRefusedError):
    return error_response(
        "DB_UNAVAILABLE",
        "Database unavailable",
        status_code=503,
    )


@app.exception_handler(redis.exceptions.ConnectionError)
async def redis_connection_error_handler(request: Request, exc: redis.exceptions.ConnectionError):
    return error_response(
        "REDIS_UNAVAILABLE",
        "Redis unavailable",
        status_code=503,
    )


@app.get("/health")
async def health(request: Request):
    return success_response(
        request,
        {
            "status": "ok",
            "app": settings.APP_NAME,
            "environment": settings.ENVIRONMENT,
        },
    )


app.include_router(get_api_router())
