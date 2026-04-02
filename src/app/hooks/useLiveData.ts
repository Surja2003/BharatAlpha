import { useCallback, useEffect, useRef, useState } from 'react';
import {
    fetchBulkQuotes,
    fetchIndexQuotes,
    fetchNews,
    fetchQuote,
    INDEX_SYMBOLS,
    type BulkQuote,
    type BulkQuotesResponse,
    type LiveQuote,
    type NewsItem,
} from '../services/api';

// ─── Index shape used by Dashboard ───────────────────────────────────────────
export interface LiveIndex {
    symbol: string;
    name: string;
    value: number;
    change: number;
    changePct: number;
    source?: string;
}

// ─── useLiveIndices ───────────────────────────────────────────────────────────
/** Fetches NIFTY 50, SENSEX, BANK NIFTY etc. from the backend, refreshes every 15s */
export function useLiveIndices(intervalMs = 15_000) {
    const [indices, setIndices] = useState<LiveIndex[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const fetch = useCallback(async (signal?: AbortSignal) => {
        try {
            const quotes = await fetchIndexQuotes(signal);
            const liveList: LiveIndex[] = INDEX_SYMBOLS.map(idx => {
                const q = quotes[idx.symbol];
                if (!q) return null;
                return {
                    symbol: idx.symbol,
                    name: idx.label,
                    value: q.last_price,
                    change: q.change ?? 0,
                    changePct: q.change_percent ?? 0,
                    source: 'live',
                };
            }).filter(Boolean) as LiveIndex[];

            if (liveList.length > 0) {
                setIndices(liveList);
                setLastUpdated(new Date());
            }
        } catch {
            // silently keep old data on error
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const ac = new AbortController();
        fetch(ac.signal);
        const id = setInterval(() => fetch(ac.signal), intervalMs);
        return () => { clearInterval(id); ac.abort(); };
    }, [fetch, intervalMs]);

    // "seconds ago" counter
    const [secsAgo, setSecsAgo] = useState(0);
    useEffect(() => {
        if (!lastUpdated) return;
        const id = setInterval(() => {
            setSecsAgo(Math.round((Date.now() - lastUpdated.getTime()) / 1000));
        }, 1000);
        return () => clearInterval(id);
    }, [lastUpdated]);

    return { indices, loading, lastUpdated, secsAgo };
}

// ─── useLiveQuote ─────────────────────────────────────────────────────────────
/** Single symbol, refreshes every N ms */
export function useLiveQuote(symbol: string, intervalMs = 10_000) {
    const [quote, setQuote] = useState<LiveQuote | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!symbol) return;
        setLoading(true);
        const ac = new AbortController();

        const load = async () => {
            try {
                const q = await fetchQuote(symbol, ac.signal);
                setQuote(q);
                setError(null);
            } catch (e: unknown) {
                if ((e as Error)?.name !== 'AbortError') {
                    setError((e as Error)?.message ?? 'Failed');
                }
            } finally {
                setLoading(false);
            }
        };

        load();
        const id = setInterval(load, intervalMs);
        return () => { clearInterval(id); ac.abort(); };
    }, [symbol, intervalMs]);

    return { quote, loading, error };
}

// ─── useBulkQuotes ────────────────────────────────────────────────────────────
/** Fetch prices for multiple symbols, returns a map, refreshes every N ms */
export function useBulkQuotes(symbols: string[], intervalMs = 20_000) {
    const [quotes, setQuotes] = useState<BulkQuotesResponse>({});
    const [loading, setLoading] = useState(true);
    const symbolsKey = symbols.join(',');

    useEffect(() => {
        if (!symbols.length) return;
        setLoading(true);
        const ac = new AbortController();

        const load = async () => {
            try {
                const q = await fetchBulkQuotes(symbols, ac.signal);
                setQuotes(q);
            } catch {
                // keep old data
            } finally {
                setLoading(false);
            }
        };

        load();
        const id = setInterval(load, intervalMs);
        return () => { clearInterval(id); ac.abort(); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [symbolsKey, intervalMs]);

    return { quotes, loading };
}

// ─── useLiveNews ──────────────────────────────────────────────────────────────
/** Fetch market news for a given query */
export function useLiveNews(query: string, limit = 15) {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!query) return;
        const ac = new AbortController();
        setLoading(true);

        fetchNews(query, limit, ac.signal)
            .then(items => { setNews(items); setLoading(false); })
            .catch(() => setLoading(false));

        return () => ac.abort();
    }, [query, limit]);

    return { news, loading };
}
