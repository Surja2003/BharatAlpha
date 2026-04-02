# BharatAlpha Backend (FastAPI)

## Quickstart (Windows / PowerShell)

1) Create + activate a venv (example):
- `python -m venv .venv`
- `./.venv/Scripts/Activate.ps1`

2) Install runtime deps (recommended on Windows):
- `python -m pip install -r requirements.runtime.txt`

3) Configure env:
- Copy/edit `.env` in this folder.

4) Start dependencies (optional but recommended):
- `docker compose up -d` (uses `docker-compose.yml`)

5) Run the API:
- `uvicorn app.main:app --reload --port 8000`

Health:
- `GET /health`
- `GET /api/v1/health/providers`

## Latency Budgets

The market endpoints use a strict time budget for “first success wins” provider fanout:
- `LIVE_QUOTE_TIMEOUT_S` / `LIVE_QUOTE_BUDGET_S`
- `BULK_QUOTES_TIMEOUT_S` / `BULK_QUOTES_BUDGET_S`
- `HISTORY_TIMEOUT_S` / `HISTORY_BUDGET_S`

Guidance:
- `*_TIMEOUT_S` applies per provider call.
- `*_BUDGET_S` caps the whole request.

## HTTPX Pool Tuning

Providers that use `httpx.AsyncClient` share connection pools across requests (important for low latency). Tune via:
- `HTTPX_MAX_CONNECTIONS`
- `HTTPX_MAX_KEEPALIVE_CONNECTIONS`
- `HTTPX_KEEPALIVE_EXPIRY_S`
- `HTTPX_TIMEOUT_S` / `HTTPX_CONNECT_TIMEOUT_S`
- `HTTPX_HTTP2`

## Redis Tick Cache

If live ticks are being published into Redis keys `price:{SYMBOL}`, the market quote endpoints will use that cache as a fast-path.

Staleness guard:
- `REDIS_TICK_MAX_AGE_S` (seconds): cached ticks older than this are treated as cache misses and the API falls back to upstream providers.

Diagnostics:
- `REDIS_TICK_DIAG_SAMPLE_N`: maximum number of missing/stale symbols to include in health output.

## Publisher Heartbeats

For multi-instance deployments, in-process task inspection is not enough. The backend also uses Redis heartbeats:
- `IIFL_WS_HEARTBEAT_KEY` is updated by the IIFL websocket publisher loop.
- `IIFL_WS_LAST_TICK_KEY` stores last tick metadata (timestamp + symbol) for debugging.
- `IIFL_WS_TICK_RATE_KEY` is a rolling counter (TTL window) to estimate ticks/min.
- `IIFL_WS_TICK_RATE_ZSET_KEY` tracks per-symbol rolling tick counts so health can show top active symbols.
- `PRICE_POLLER_HEARTBEAT_KEY` is updated by the Celery live price poller task.
- `PUBLISHER_HEARTBEAT_TTL_S` controls expiry; health reports the current age in seconds.

## Notes

- On Windows, `requirements.txt` may include heavier optional/ML dependencies. Prefer `requirements.runtime.txt` unless you explicitly need ML/training components.
