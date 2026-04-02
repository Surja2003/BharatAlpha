from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


_BACKEND_ROOT = Path(__file__).resolve().parents[1]


class Settings(BaseSettings):
    # ── App ──────────────────────────────────────────────────────
    APP_NAME: str = "BharatAlpha"
    ENVIRONMENT: str = "development"
    DEBUG: bool = False
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # ── Database ─────────────────────────────────────────────────
    DATABASE_URL: str  # postgresql+asyncpg://user:pass@host/db
    REDIS_URL: str  # redis://default:pass@host:port

    # ── IIFL Securities API (free with demat account) ────────────
    IIFL_API_KEY: str | None = None
    IIFL_SECRET_KEY: str | None = None
    # TTBlaze login expects a short `password` value (often <= 12 chars).
    IIFL_TTBLAZE_SECRET_KEY: str | None = None
    IIFL_CLIENT_CODE: str | None = None  # your demat client ID
    IIFL_2PIN: str | None = None
    IIFL_BASE_URL: str = "https://ttblaze.iifl.com"
    IIFL_WS_URL: str = "wss://ttblaze.iifl.com/feed"

    # ── Data Source Routing (change one line = upgrade) ──────────
    PRICE_SOURCE: Literal[
        "iifl",
        "upstox",
        "kite",
        "truedata",
        "nse_scrape",
    ] = "iifl"

    FUNDAMENTAL_SOURCE: Literal[
        "screener_scrape",
        "screener_api",
        "yfinance",
    ] = "screener_scrape"

    NEWS_SOURCE: Literal[
        "rss_free",
        "newsapi",
    ] = "rss_free"

    MF_SOURCE: Literal[
        "amfi_free",
    ] = "amfi_free"

    FNO_SOURCE: Literal[
        "iifl",
        "truedata",
    ] = "iifl"

    # ── ML ───────────────────────────────────────────────────────
    MODEL_DIR: str = "./models"
    MLFLOW_URI: str = "sqlite:///mlflow.db"

    # ── Dev/Test Switches ─────────────────────────────────────────
    # Synthetic history is only for local/dev unblock. Keep OFF by default.
    ALLOW_SYNTHETIC_HISTORY: bool = False

    # ── Market ───────────────────────────────────────────────────
    MARKET_OPEN: str = "09:15"
    MARKET_CLOSE: str = "15:30"
    PRE_OPEN_START: str = "09:00"
    TIMEZONE: str = "Asia/Kolkata"

    # ── Latency Budgets (seconds) ────────────────────────────────
    # These cap upstream fanout so API endpoints stay responsive.
    LIVE_QUOTE_TIMEOUT_S: float = 0.9
    LIVE_QUOTE_BUDGET_S: float = 1.2
    BULK_QUOTES_TIMEOUT_S: float = 1.2
    BULK_QUOTES_BUDGET_S: float = 1.6
    HISTORY_TIMEOUT_S: float = 2.5
    HISTORY_BUDGET_S: float = 3.0

    # ── Redis Price Cache ────────────────────────────────────────
    # Treat cached ticks older than this as cache misses.
    # Keep <= the Redis TTL used by publishers (currently 10s).
    REDIS_TICK_MAX_AGE_S: float = 8.0
    REDIS_TICK_DIAG_SAMPLE_N: int = 10

    # ── Background Publisher Heartbeats ───────────────────────────
    # Cross-process liveness signal for websocket publisher / pollers.
    PUBLISHER_HEARTBEAT_TTL_S: int = 30
    IIFL_WS_HEARTBEAT_KEY: str = "iifl:ws:heartbeat"
    IIFL_WS_LAST_TICK_KEY: str = "iifl:ws:last_tick"
    IIFL_WS_TICK_RATE_KEY: str = "iifl:ws:ticks:window"
    IIFL_WS_TICK_RATE_WINDOW_S: int = 60
    IIFL_WS_TICK_RATE_ZSET_KEY: str = "iifl:ws:ticks:symbols:window"
    IIFL_WS_TICK_RATE_TOP_N: int = 5
    PRICE_POLLER_HEARTBEAT_KEY: str = "prices:poller:heartbeat"

    # ── HTTP Client Tuning (httpx) ───────────────────────────────
    # Keep conservative defaults; raise max connections for higher QPS.
    HTTPX_TIMEOUT_S: float = 20.0
    HTTPX_CONNECT_TIMEOUT_S: float = 10.0
    HTTPX_MAX_CONNECTIONS: int = 100
    HTTPX_MAX_KEEPALIVE_CONNECTIONS: int = 20
    HTTPX_KEEPALIVE_EXPIRY_S: float = 30.0
    HTTPX_HTTP2: bool = True

    @field_validator(
        "IIFL_API_KEY",
        "IIFL_SECRET_KEY",
        "IIFL_TTBLAZE_SECRET_KEY",
        "IIFL_CLIENT_CODE",
        "IIFL_2PIN",
        mode="before",
    )
    @classmethod
    def _strip_optional_secrets(cls, v: object) -> object:
        if v is None:
            return None
        s = str(v).strip()
        return s or None

    @property
    def IIFL_LOGIN_SECRET_KEY(self) -> str | None:
        """Secret to send as `secretKey` for TTBlaze login.

        TTBlaze login `secretKey` is typically a short (<= 12 char) password-like
        value. Users sometimes mistakenly paste a long portal secret into
        `IIFL_TTBLAZE_SECRET_KEY`; if it looks too long, ignore it and fall back
        to `IIFL_SECRET_KEY`.
        """

        tt = (self.IIFL_TTBLAZE_SECRET_KEY or "").strip() if self.IIFL_TTBLAZE_SECRET_KEY else ""
        if tt and len(tt) <= 12:
            return tt
        sec = (self.IIFL_SECRET_KEY or "").strip() if self.IIFL_SECRET_KEY else ""
        if sec and len(sec) <= 12:
            return sec
        return None

    @property
    def IIFL_LOGIN_SECRET_SOURCE(self) -> str:
        tt = (self.IIFL_TTBLAZE_SECRET_KEY or "").strip() if self.IIFL_TTBLAZE_SECRET_KEY else ""
        if tt and len(tt) <= 12:
            return "IIFL_TTBLAZE_SECRET_KEY"
        sec = (self.IIFL_SECRET_KEY or "").strip() if self.IIFL_SECRET_KEY else ""
        if sec and len(sec) <= 12:
            return "IIFL_SECRET_KEY"
        return "missing"

    @model_validator(mode="after")
    def _validate_provider_secrets(self) -> "Settings":
        if self.PRICE_SOURCE == "iifl":
            missing = [
                name
                for name in ("IIFL_API_KEY",)
                if not getattr(self, name)
            ]
            if missing:
                raise ValueError("Missing required IIFL settings for selected source: " + ", ".join(missing))
        return self

    model_config = SettingsConfigDict(
        env_file=str(_BACKEND_ROOT / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


# Convenience instance (ok for small apps). Prefer get_settings() for DI.
settings = get_settings()
