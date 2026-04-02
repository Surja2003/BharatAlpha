from __future__ import annotations

import asyncio
import re
from datetime import datetime

import feedparser
import structlog

from app.services.data_pipeline.base_fetcher import BaseNewsFetcher
from app.services.data_pipeline.models import NewsItem


_DEFAULT_RSS_FEEDS: list[tuple[str, str]] = [
    ("Moneycontrol", "https://www.moneycontrol.com/rss/marketreports.xml"),
    ("LiveMint", "https://www.livemint.com/rss/markets"),
    ("EconomicTimes", "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms"),
]


class RSSNewsFetcher(BaseNewsFetcher):
    source_name = "rss_free"

    def __init__(self, feeds: list[tuple[str, str]] | None = None) -> None:
        self._feeds = feeds or _DEFAULT_RSS_FEEDS
        self._log = structlog.get_logger(__name__)

    async def get_news(self, query: str, *, limit: int = 30) -> list[NewsItem]:
        query = query.strip()
        if not query:
            return []

        tasks = [asyncio.to_thread(_parse_feed, name, url) for name, url in self._feeds]
        parsed_lists = await asyncio.gather(*tasks, return_exceptions=True)

        results: list[NewsItem] = []
        for parsed in parsed_lists:
            if isinstance(parsed, Exception):
                continue
            results.extend(parsed)

        results = _filter_news(results, query)
        results = _dedupe(results)
        return results[:limit]


def _parse_feed(source_name: str, url: str) -> list[NewsItem]:
    feed = feedparser.parse(url)
    items: list[NewsItem] = []
    for e in feed.entries[:100]:
        title = (e.get("title") or "").strip()
        link = (e.get("link") or "").strip()
        summary = (e.get("summary") or "").strip() or None
        published_at = _parse_published(e)
        if not title or not link:
            continue
        items.append(
            NewsItem(
                title=title,
                url=link,
                published_at=published_at,
                source=source_name,
                summary=summary,
                symbols=_extract_symbols(title + " " + (summary or "")),
            )
        )
    return items


def _parse_published(entry: dict) -> datetime | None:
    # feedparser exposes "published_parsed" as time.struct_time
    ts = entry.get("published_parsed") or entry.get("updated_parsed")
    if ts is None:
        return None
    try:
        return datetime(*ts[:6])
    except Exception:  # noqa: BLE001
        return None


def _filter_news(items: list[NewsItem], query: str) -> list[NewsItem]:
    q = query.lower()
    out: list[NewsItem] = []
    for it in items:
        hay = (it.title + " " + (it.summary or "")).lower()
        if q in hay:
            out.append(it)
    return out


def _dedupe(items: list[NewsItem]) -> list[NewsItem]:
    seen: set[str] = set()
    out: list[NewsItem] = []
    for it in items:
        key = re.sub(r"\W+", " ", it.title.lower()).strip()
        if key in seen:
            continue
        seen.add(key)
        out.append(it)
    return out


_SYMBOL_RE = re.compile(r"\b[A-Z]{2,10}\b")


def _extract_symbols(text: str) -> list[str] | None:
    if not text:
        return None
    syms = [m.group(0) for m in _SYMBOL_RE.finditer(text.upper())]
    # keep it small/noisy-safe
    syms = [s for s in syms if s not in {"NSE", "BSE", "IPO", "ETF", "FII", "DII"}]
    return syms[:10] or None
