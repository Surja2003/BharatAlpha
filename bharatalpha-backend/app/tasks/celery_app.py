from __future__ import annotations

from urllib.parse import urlparse

from celery import Celery
from celery.schedules import crontab

from app.config import settings


def _ssl_options_for_redis(url: str) -> dict | None:
    parsed = urlparse(url)
    if parsed.scheme == "rediss":
        return {"ssl_cert_reqs": "CERT_NONE"}
    return None


celery_app = Celery(
    "bharatalpha",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=[
        "app.tasks.token_refresher",
        "app.tasks.price_updater",
        "app.tasks.signal_generator",
    ],
)

ssl_opts = _ssl_options_for_redis(settings.REDIS_URL)
if ssl_opts:
    celery_app.conf.broker_use_ssl = ssl_opts
    celery_app.conf.redis_backend_use_ssl = ssl_opts

celery_app.conf.update(
    timezone=settings.TIMEZONE,
    enable_utc=False,
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
)

# Beat schedule (Asia/Kolkata)
celery_app.conf.beat_schedule = {
    # 08:45 IST: refresh token before market opens
    "refresh-iifl-token": {
        "task": "app.tasks.token_refresher.refresh_iifl_token",
        "schedule": crontab(minute=45, hour=8),
    },
    # Every 5 minutes during market hours (simple default). Fine-tune later.
    "poll-live-prices": {
        "task": "app.tasks.price_updater.poll_live_prices",
        "schedule": crontab(minute="*/5", hour="9-15"),
    },
    # After market close: generate daily signals
    "generate-daily-signals": {
        "task": "app.tasks.signal_generator.generate_signals_for_active",
        "schedule": crontab(minute=5, hour=16),
    },
}
