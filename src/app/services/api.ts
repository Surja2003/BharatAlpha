// ─── BharatAlpha API Client ───────────────────────────────────────────────────
// All calls go to the local FastAPI backend at http://localhost:8000

const BASE_URL = 'http://127.0.0.1:8000/api/v1';

// ─── Shared Response Types ────────────────────────────────────────────────────
export interface ApiMeta {
    timestamp: string;
    cached: boolean;
    latency_ms: number;
    data_source: string;
    disclaimer: string;
}

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    meta: ApiMeta;
}

// ─── Domain Types ─────────────────────────────────────────────────────────────
export interface LiveQuote {
    symbol: string;
    last_price: number;
    timestamp: string;
    change: number;
    change_percent: number;
    volume: number | null;
    open: number | null;
    high: number | null;
    low: number | null;
    prev_close: number | null;
    currency: string;
}

export interface BulkQuote {
    symbol: string;
    last_price: number;
    timestamp: string;
    change: number;
    change_percent: number;
    source: string;
}

export type BulkQuotesResponse = Record<string, BulkQuote>;

export interface NewsItem {
    title: string;
    url: string;
    published_at: string | null;
    source: string;
    summary: string | null;
    symbols: string[];
}

// ─── Index symbols known to NSE  ──────────────────────────────────────────────
// These are the canonical symbols for major Indian indices via NSE scrape / IIFL
export const INDEX_SYMBOLS = [
    { symbol: 'NIFTY 50', label: 'NIFTY 50', nseSymbol: 'NIFTY%2050' },
    { symbol: 'SENSEX', label: 'SENSEX', nseSymbol: 'SENSEX' },
    { symbol: 'BANKNIFTY', label: 'BANK NIFTY', nseSymbol: 'NIFTY%20BANK' },
    { symbol: 'NIFTYIT', label: 'NIFTY IT', nseSymbol: 'NIFTY%20IT' },
    { symbol: 'NIFTYMIDCAP', label: 'NIFTY MIDCAP', nseSymbol: 'NIFTY%20MIDCAP%20100' },
    { symbol: 'NIFTYSMALLCAP', label: 'NIFTY SMALLCAP', nseSymbol: 'NIFTY%20SMALLCAP%20100' },
];

// Stock symbols for gainers / losers / most active on dashboard
export const NIFTY50_SYMBOLS = [
    'RELIANCE', 'TCS', 'HDFCBANK', 'ICICIBANK', 'INFY', 'SBIN', 'WIPRO',
    'BAJFINANCE', 'LT', 'NTPC', 'HINDUNILVR', 'ITC', 'AXISBANK', 'MARUTI',
    'ADANIENT', 'KOTAKBANK', 'HCLTECH', 'TATAMOTORS', 'SUNPHARMA', 'ONGC',
];

// ─── Typed fetch helper ───────────────────────────────────────────────────────
async function apiFetch<T>(path: string, signal?: AbortSignal): Promise<ApiResponse<T>> {
    const res = await fetch(`${BASE_URL}${path}`, {
        signal,
        headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message ?? `HTTP ${res.status}`);
    }
    return res.json() as Promise<ApiResponse<T>>;
}

// ─── API Functions ────────────────────────────────────────────────────────────

/** Fetch a single live stock/index quote */
export async function fetchQuote(symbol: string, signal?: AbortSignal): Promise<LiveQuote> {
    const data = await apiFetch<LiveQuote>(`/market/quote/${encodeURIComponent(symbol)}`, signal);
    return data.data;
}

/** Fetch multiple quotes in one request */
export async function fetchBulkQuotes(
    symbols: string[],
    signal?: AbortSignal,
): Promise<BulkQuotesResponse> {
    const joined = symbols.map(encodeURIComponent).join(',');
    const data = await apiFetch<BulkQuotesResponse>(`/market/quotes?symbols=${joined}`, signal);
    return data.data;
}

/** Fetch market news for a query */
export async function fetchNews(query: string, limit = 20, signal?: AbortSignal): Promise<NewsItem[]> {
    const data = await apiFetch<{ query: string; items: NewsItem[] }>(
        `/market/news?q=${encodeURIComponent(query)}&limit=${limit}`,
        signal,
    );
    return data.data.items;
}

/** Fetch index quotes by scraping NSE — backend handles this via nse_scrape provider */
export async function fetchIndexQuotes(signal?: AbortSignal): Promise<Record<string, LiveQuote>> {
    const symbols = ['NIFTY 50', 'SENSEX', 'BANKNIFTY', 'NIFTY IT', 'NIFTY MIDCAP 100', 'NIFTY SMALLCAP 100'];
    const results: Record<string, LiveQuote> = {};
    // Fetch in parallel with individual quote calls (NSE scrape supports index symbols)
    const fetches = symbols.map(s =>
        fetchQuote(s, signal)
            .then(q => { results[s] = q; })
            .catch(() => { /* silently skip failed indices */ }),
    );
    await Promise.all(fetches);
    return results;
}
