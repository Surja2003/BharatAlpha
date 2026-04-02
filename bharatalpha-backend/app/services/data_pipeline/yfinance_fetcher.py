from __future__ import annotations

import asyncio
from datetime import date, datetime

import structlog
import yfinance as yf

from app.services.data_pipeline.base_fetcher import BasePriceFetcher, normalize_symbol
from app.services.data_pipeline.models import Candle, LiveQuote


class YFinanceFetcher(BasePriceFetcher):
    source_name = "yfinance"

    def __init__(self) -> None:
        self._log = structlog.get_logger(__name__)

    async def healthcheck(self) -> bool:
        try:
            q = await self.get_live_quote("SBIN")
            return q.last_price > 0
        except Exception:  # noqa: BLE001
            return False

    async def get_live_quote(self, symbol: str) -> LiveQuote:
        symbol = normalize_symbol(symbol)
        yf_symbol = symbol if symbol.endswith(".NS") else f"{symbol}.NS"

        def _fetch() -> dict:
            t = yf.Ticker(yf_symbol)
            last = prev_close = open_ = day_high = day_low = volume = None

            # Prefer history() since yfinance's fast_info can raise KeyError internally.
            try:
                hist = t.history(period="2d", interval="1m", auto_adjust=False)
                if hist is not None and not hist.empty:
                    last = float(hist["Close"].iloc[-1])
                    volume = int(hist["Volume"].iloc[-1]) if "Volume" in hist else None
                    open_ = float(hist["Open"].iloc[0])
                    day_high = float(hist["High"].max())
                    day_low = float(hist["Low"].min())
                    if len(hist) >= 2:
                        prev_close = float(hist["Close"].iloc[-2])
            except Exception:  # noqa: BLE001
                pass

            if last is None:
                # fallback to info dict (slower and sometimes rate-limited)
                try:
                    i = t.info or {}
                except Exception:  # noqa: BLE001
                    i = {}
                last = i.get("regularMarketPrice") or i.get("currentPrice")
                prev_close = i.get("previousClose") or i.get("regularMarketPreviousClose")
                open_ = i.get("regularMarketOpen")
                day_high = i.get("dayHigh")
                day_low = i.get("dayLow")
                volume = i.get("volume")

            if last is None:
                raise RuntimeError("yfinance did not return a live price")

            return {
                "last": float(last),
                "prev_close": float(prev_close) if prev_close is not None else None,
                "open": float(open_) if open_ is not None else None,
                "high": float(day_high) if day_high is not None else None,
                "low": float(day_low) if day_low is not None else None,
                "volume": int(volume) if volume is not None else None,
            }

        data = await asyncio.to_thread(_fetch)
        prev_close = data.get("prev_close")
        last = data["last"]
        change = (last - prev_close) if prev_close is not None else None
        change_pct = (change / prev_close * 100.0) if (change is not None and prev_close) else None

        return LiveQuote(
            symbol=symbol,
            last_price=last,
            timestamp=datetime.utcnow(),
            source=self.source_name,
            change=change,
            change_percent=change_pct,
            volume=data.get("volume"),
            open=data.get("open"),
            high=data.get("high"),
            low=data.get("low"),
            prev_close=prev_close,
        )

    async def get_price_history(
        self,
        symbol: str,
        *,
        start: date | None = None,
        end: date | None = None,
        interval: str = "1d",
    ) -> list[Candle]:
        symbol = normalize_symbol(symbol)
        yf_symbol = symbol if symbol.endswith(".NS") else f"{symbol}.NS"

        def _period_for_range(start_d: date | None, end_d: date | None) -> str:
            if start_d is None:
                return "6mo"
            end_eff = end_d or date.today()
            days = (end_eff - start_d).days
            if days <= 7:
                return "7d"
            if days <= 30:
                return "1mo"
            if days <= 90:
                return "3mo"
            if days <= 180:
                return "6mo"
            if days <= 365:
                return "1y"
            return "2y"

        def _fetch() -> list[Candle]:
            t = yf.Ticker(yf_symbol)
            hist = t.history(start=start, end=end, interval=interval, auto_adjust=False)
            if hist is None or hist.empty:
                # yfinance can sometimes return empty for start/end ranges; period-based calls often work better.
                period = _period_for_range(start, end)
                hist = t.history(period=period, interval=interval, auto_adjust=False)
            candles: list[Candle] = []
            if hist is None or hist.empty:
                return candles
            for idx, row in hist.iterrows():
                ts = idx.to_pydatetime() if hasattr(idx, "to_pydatetime") else idx
                candles.append(
                    Candle(
                        timestamp=ts,
                        open=float(row["Open"]),
                        high=float(row["High"]),
                        low=float(row["Low"]),
                        close=float(row["Close"]),
                        volume=int(row["Volume"]) if "Volume" in row and row["Volume"] is not None else None,
                    )
                )
            return candles

        return await asyncio.to_thread(_fetch)
