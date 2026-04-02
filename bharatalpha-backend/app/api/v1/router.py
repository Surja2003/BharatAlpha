from __future__ import annotations

from datetime import datetime, timezone
from time import perf_counter
from typing import Any

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse


SEBI_DISCLAIMER = (
    "BharatAlpha signals are for educational purposes only and are not financial advice. "
    "Past performance is not indicative of future results. "
    "Always consult a SEBI registered investment advisor before investing."
)


def _latency_ms(request: Request) -> int:
    started = getattr(request.state, "start_perf", None)
    if started is None:
        return 0
    return max(0, int((perf_counter() - started) * 1000))


def success_response(
    request: Request,
    data: Any,
    *,
    cached: bool = False,
    data_source: str = "internal",
) -> dict[str, Any]:
    return {
        "success": True,
        "data": data,
        "meta": {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "cached": cached,
            "latency_ms": _latency_ms(request),
            "data_source": data_source,
            "disclaimer": SEBI_DISCLAIMER,
        },
    }


def error_response(
    code: str,
    message: str,
    *,
    details: dict[str, Any] | None = None,
    status_code: int = 400,
) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "success": False,
            "error": {
                "code": code,
                "message": message,
                "details": details or {},
            },
        },
    )


def get_api_router() -> APIRouter:
    api_router = APIRouter(prefix="/api/v1")

    from app.api.v1.auth import router as auth_router
    from app.api.v1.market import router as market_router
    from app.api.v1.mutual_funds import router as mutual_funds_router
    from app.api.v1.portfolio import router as portfolio_router
    from app.api.v1.screener import router as screener_router
    from app.api.v1.stocks import router as stocks_router
    from app.api.v1.websocket import router as websocket_router
    from app.api.v1.health import router as health_router
    from app.api.v1.advisor import router as advisor_router

    api_router.include_router(auth_router)
    api_router.include_router(market_router)
    api_router.include_router(stocks_router)
    api_router.include_router(screener_router)
    api_router.include_router(portfolio_router)
    api_router.include_router(mutual_funds_router)
    api_router.include_router(websocket_router)
    api_router.include_router(health_router)
    api_router.include_router(advisor_router)

    return api_router


# Kept for backwards compatibility with imports; do not include subrouters here.
router = APIRouter()
