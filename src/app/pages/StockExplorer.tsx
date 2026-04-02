import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { SlidersHorizontal, ChevronDown, X, Loader2 } from 'lucide-react';
import { allStocks } from '../data/mockData';
import { SignalBadge } from '../components/common/SignalBadge';
import { ChangeChip } from '../components/common/PriceDisplay';
import { Sparkline } from '../components/common/Sparkline';
import { useBulkQuotes } from '../hooks/useLiveData';

const CAPS = ['All', 'Large Cap', 'Mid Cap', 'Small Cap', 'Nifty 50', 'By Sector', 'F&O Stocks', 'High Dividend'];
const SORTS = ['Market Cap', 'P/E Ratio', 'Gain Today', 'Volume', 'BharatAlpha Score'];

const STOCK_AVATAR_BG_CLASS: Record<string, string> = {
  RELIANCE: 'bg-[hsl(154_45%_32%)]',
  TCS: 'bg-[hsl(228_45%_32%)]',
  HDFCBANK: 'bg-[hsl(144_45%_32%)]',
  INFY: 'bg-[hsl(181_45%_32%)]',
  ICICIBANK: 'bg-[hsl(181_45%_32%)]',
  WIPRO: 'bg-[hsl(339_45%_32%)]',
  HINDUNILVR: 'bg-[hsl(144_45%_32%)]',
  ITC: 'bg-[hsl(181_45%_32%)]',
  BAJFINANCE: 'bg-[hsl(282_45%_32%)]',
  MARUTI: 'bg-[hsl(329_45%_32%)]',
  SUNPHARMA: 'bg-[hsl(191_45%_32%)]',
  TITAN: 'bg-[hsl(228_45%_32%)]',
  ADANIPORTS: 'bg-[hsl(245_45%_32%)]',
  TATAMOTORS: 'bg-[hsl(228_45%_32%)]',
  ONGC: 'bg-[hsl(43_45%_32%)]',
  NTPC: 'bg-[hsl(6_45%_32%)]',
  'BAJAJ-AUTO': 'bg-[hsl(282_45%_32%)]',
  NESTLEIND: 'bg-[hsl(6_45%_32%)]',
  TATASTEEL: 'bg-[hsl(228_45%_32%)]',
  AXISBANK: 'bg-[hsl(245_45%_32%)]',
  LT: 'bg-[hsl(292_45%_32%)]',
  POWERGRID: 'bg-[hsl(80_45%_32%)]',
  COALINDIA: 'bg-[hsl(319_45%_32%)]',
  HCLTECH: 'bg-[hsl(144_45%_32%)]',
  ULTRACEMCO: 'bg-[hsl(265_45%_32%)]',
};

function getScoreTextClass(score: number) {
  if (score >= 80) return 'text-[var(--ba-green)]';
  if (score >= 60) return 'text-[var(--ba-gold)]';
  return 'text-[var(--ba-red)]';
}

function getScoreStroke(score: number) {
  if (score >= 80) return 'var(--ba-green)';
  if (score >= 60) return 'var(--ba-gold)';
  return 'var(--ba-red)';
}

function ScoreGauge({ score }: { score: number }) {
  const color = getScoreStroke(score);
  const textClass = getScoreTextClass(score);
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="w-9 h-9 relative">
        <svg width="36" height="36" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="14" fill="none" stroke="var(--ba-border)" strokeWidth="3" />
          <circle
            cx="18" cy="18" r="14" fill="none" stroke={color} strokeWidth="3"
            strokeDasharray={`${(score / 100) * 88} 88`}
            strokeLinecap="round"
            transform="rotate(-90 18 18)"
          />
        </svg>
        <div className={['absolute inset-0 flex items-center justify-center text-[9px] font-bold font-jetbrains', textClass].join(' ')}>
          {score}
        </div>
      </div>
    </div>
  );
}

export default function StockExplorer() {
  const navigate = useNavigate();
  const [activeCap, setActiveCap] = useState('All');
  const [sortBy, setSortBy] = useState('Market Cap');
  const [showFilters, setShowFilters] = useState(false);
  const [peRange, setPeRange] = useState([0, 100]);
  const [roeMin, setRoeMin] = useState(0);
  const [query, setQuery] = useState('');

  const symbolsList = useMemo(() => allStocks.map(s => s.symbol), []);
  const { quotes: liveQuotes, loading: quotesLoading } = useBulkQuotes(symbolsList, 30_000);

  const filtered = useMemo(() => {
    let stocks = allStocks.map(s => {
      const q = liveQuotes[s.symbol];
      if (!q) return s;
      return { ...s, price: q.last_price, change: q.change, changePct: q.change_percent };
    });

    // Filter by query
    if (query) {
      const q = query.toLowerCase();
      stocks = stocks.filter(s => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q));
    }

    // Filter by cap
    if (activeCap === 'Large Cap') stocks = stocks.filter(s => s.marketCap >= 200000);
    else if (activeCap === 'Mid Cap') stocks = stocks.filter(s => s.marketCap >= 50000 && s.marketCap < 200000);
    else if (activeCap === 'Small Cap') stocks = stocks.filter(s => s.marketCap < 50000);
    else if (activeCap === 'Nifty 50') stocks = stocks.slice(0, 12);
    else if (activeCap === 'F&O Stocks') stocks = stocks.filter(s => s.marketCap >= 100000);
    else if (activeCap === 'High Dividend') stocks = stocks.filter(s => s.roe > 20);

    // Filter by PE
    stocks = stocks.filter(s => s.pe >= peRange[0] && s.pe <= peRange[1]);

    // Filter by ROE
    if (roeMin > 0) stocks = stocks.filter(s => s.roe >= roeMin);

    // Sort
    if (sortBy === 'Market Cap') stocks.sort((a, b) => b.marketCap - a.marketCap);
    else if (sortBy === 'P/E Ratio') stocks.sort((a, b) => a.pe - b.pe);
    else if (sortBy === 'Gain Today') stocks.sort((a, b) => b.changePct - a.changePct);
    else if (sortBy === 'Volume') stocks.sort((a, b) => b.volume - a.volume);
    else if (sortBy === 'BharatAlpha Score') stocks.sort((a, b) => b.bharatAlphaScore - a.bharatAlphaScore);

    return stocks;
  }, [activeCap, sortBy, peRange, roeMin, query]);

  const formatMCap = (v: number) => {
    if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L Cr`;
    return `₹${(v / 1000).toFixed(1)}K Cr`;
  };

  return (
    <div className="text-[var(--ba-text-primary)] flex flex-col gap-4">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="font-dm-serif text-[28px] text-[var(--ba-text-primary)] m-0">
            Explore 5,500+ Stocks
          </h1>
          {quotesLoading && (
            <div className="flex items-center gap-1.5 text-[11px] font-dm-sans text-[var(--ba-blue)] bg-[var(--ba-blue)]/[0.1] px-2 py-1 rounded-md">
              <Loader2 size={10} className="animate-spin" /> Live prices
            </div>
          )}
        </div>
        <p className="text-[13px] text-[var(--ba-text-secondary)] mt-1 mb-0 font-dm-sans">
          NSE + BSE • Data: IIFL TTBlaze • NSE
        </p>
      </div>

      {/* Search + Filter Row */}
      <div className="flex gap-2 items-center">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search stocks..."
          className="flex-1 bg-[var(--ba-bg-secondary)] border border-[var(--ba-border)] rounded-[10px] px-[14px] py-2 text-[13px] text-[var(--ba-text-primary)] font-dm-sans outline-none"
        />

        <button
          onClick={() => setShowFilters(!showFilters)}
          type="button"
          className={[
            'flex items-center gap-1.5 border rounded-[10px] px-[14px] py-2 cursor-pointer text-[13px] font-dm-sans',
            showFilters
              ? 'bg-[var(--ba-blue)] border-[var(--ba-blue)] text-white'
              : 'bg-[var(--ba-bg-secondary)] border-[var(--ba-border)] text-[var(--ba-text-secondary)]',
          ].join(' ')}
        >
          <SlidersHorizontal size={14} /> Filters
        </button>

        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Sort stocks"
            title="Sort stocks"
            className="appearance-none bg-[var(--ba-bg-secondary)] border border-[var(--ba-border)] rounded-[10px] pl-[14px] pr-8 py-2 cursor-pointer text-[13px] text-[var(--ba-text-secondary)] font-dm-sans outline-none"
          >
            {SORTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--ba-text-muted)]" />
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {CAPS.map(cap => (
          <button
            key={cap}
            onClick={() => setActiveCap(cap)}
            type="button"
            className={[
              'shrink-0 px-[14px] py-1.5 rounded-full border text-[12px] cursor-pointer font-dm-sans whitespace-nowrap transition-colors',
              activeCap === cap
                ? 'border-[var(--ba-blue)] bg-[var(--ba-blue)]/[0.15] text-[var(--ba-blue)]'
                : 'border-[var(--ba-border)] bg-[var(--ba-bg-secondary)] text-[var(--ba-text-secondary)]',
            ].join(' ')}
          >
            {cap}
          </button>
        ))}
      </div>

      {/* Advanced Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-[var(--ba-bg-secondary)] border border-[var(--ba-border)] rounded-xl overflow-hidden"
          >
            <div className="p-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[14px] font-semibold text-[var(--ba-text-primary)] font-dm-sans">
                  Advanced Filters
                </span>
                <button
                  type="button"
                  aria-label="Close filters"
                  title="Close filters"
                  onClick={() => setShowFilters(false)}
                  className="bg-transparent border-0 cursor-pointer"
                >
                  <X size={16} className="text-[var(--ba-text-muted)]" />
                </button>
              </div>

              <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(200px,1fr))]">
                <div>
                  <label className="text-[12px] text-[var(--ba-text-secondary)] block mb-1.5 font-dm-sans">
                    P/E Ratio (max): {peRange[1]}
                  </label>
                  <input
                    aria-label="P/E ratio maximum"
                    title="P/E ratio maximum"
                    type="range" min={0} max={100} value={peRange[1]}
                    onChange={(e) => setPeRange([peRange[0], +e.target.value])}
                    className="w-full accent-[var(--ba-blue)]"
                  />
                </div>

                <div>
                  <label className="text-[12px] text-[var(--ba-text-secondary)] block mb-1.5 font-dm-sans">
                    Min ROE %: {roeMin}%
                  </label>
                  <input
                    aria-label="Minimum ROE percentage"
                    title="Minimum ROE percentage"
                    type="range" min={0} max={50} value={roeMin}
                    onChange={(e) => setRoeMin(+e.target.value)}
                    className="w-full accent-[var(--ba-blue)]"
                  />
                </div>

                {[
                  { label: 'Market Cap Range (₹ Cr)', placeholder: 'Min – Max' },
                  { label: 'Debt/Equity (max)', placeholder: 'e.g. 0.5' },
                  { label: 'Promoter Holding % (min)', placeholder: 'e.g. 50' },
                  { label: '52W High Proximity %', placeholder: 'e.g. 10' },
                ].map(f => (
                  <div key={f.label}>
                    <label className="text-[12px] text-[var(--ba-text-secondary)] block mb-1.5 font-dm-sans">
                      {f.label}
                    </label>
                    <input
                      placeholder={f.placeholder}
                      className="w-full bg-[var(--ba-bg-tertiary)] border border-[var(--ba-border)] rounded-lg px-2.5 py-1.5 text-[13px] text-[var(--ba-text-primary)] font-dm-sans outline-none"
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-2 mt-3">
                <button type="button" className="bg-[var(--ba-blue)] text-white border-0 rounded-lg px-5 py-2 cursor-pointer text-[13px] font-semibold font-dm-sans">
                  Apply Filters
                </button>
                <button
                  onClick={() => { setPeRange([0, 100]); setRoeMin(0); }}
                  type="button"
                  className="bg-[var(--ba-bg-tertiary)] text-[var(--ba-text-secondary)] border border-[var(--ba-border)] rounded-lg px-5 py-2 cursor-pointer text-[13px] font-dm-sans"
                >
                  Reset
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results count */}
      <div className="text-[13px] text-[var(--ba-text-secondary)] font-dm-sans">
        Showing <strong className="text-[var(--ba-text-primary)]">{filtered.length}</strong> stocks
        {activeCap !== 'All' && ` in ${activeCap}`}
      </div>

      {/* Stock Table - Desktop */}
      <div className="bg-[var(--ba-bg-secondary)] border border-[var(--ba-border)] rounded-2xl overflow-hidden">
        {/* Header row */}
        <div className="hidden md:grid grid-cols-[48px_1fr_150px_110px_60px_80px] px-4 py-2.5 border-b border-[var(--ba-border)] text-[11px] text-[var(--ba-text-muted)] tracking-[0.06em] uppercase font-dm-sans">
          <span>#</span>
          <span>Company</span>
          <span>Price / Change</span>
          <span>Market Cap</span>
          <span className="text-center">Score</span>
          <span className="text-center">Signal</span>
        </div>

        {/* Stock rows */}
        {filtered.map((stock, i) => (
          <motion.div
            key={stock.symbol}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: Math.min(i * 0.03, 0.3) }}
            onClick={() => navigate(`/stock/${stock.symbol}`)}
            className={[
              'cursor-pointer hover:bg-[var(--ba-bg-tertiary)]',
              i < filtered.length - 1 ? 'border-b border-[var(--ba-border)]' : '',
            ].join(' ')}
          >
            {/* Desktop row */}
            <div className="hidden md:grid grid-cols-[48px_1fr_150px_110px_60px_80px] px-4 py-3 items-center">
              {/* Rank + Avatar */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[var(--ba-text-muted)] font-jetbrains">
                  {stock.rank}
                </span>
                <div
                  className={[
                    'w-7 h-7 rounded-[6px] shrink-0 flex items-center justify-center text-[11px] font-bold text-white',
                    STOCK_AVATAR_BG_CLASS[stock.symbol] ?? 'bg-[var(--ba-bg-tertiary)]',
                  ].join(' ')}
                >
                  {stock.symbol[0]}
                </div>
              </div>

              {/* Name */}
              <div>
                <div className="text-[13px] font-semibold text-[var(--ba-text-primary)] font-dm-sans">
                  {stock.name}
                </div>
                <div className="flex gap-1.5 items-center mt-0.5">
                  <span className="text-[11px] text-[var(--ba-text-muted)] font-jetbrains">
                    {stock.symbol}
                  </span>
                  <span className="text-[10px] px-1.5 py-[1px] rounded bg-[var(--ba-bg-tertiary)] text-[var(--ba-text-muted)] font-dm-sans">
                    {stock.sector}
                  </span>
                </div>
              </div>

              {/* Price + Change */}
              <div className="flex flex-col gap-0.5">
                <span className="text-[14px] font-jetbrains text-[var(--ba-text-primary)]">
                  ₹{stock.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
                <ChangeChip change={stock.change} changePct={stock.changePct} />
              </div>

              {/* Market Cap */}
              <div className="text-[13px] text-[var(--ba-text-secondary)] font-jetbrains">
                {formatMCap(stock.marketCap)}
              </div>

              {/* Score */}
              <div className="flex justify-center">
                <ScoreGauge score={stock.bharatAlphaScore} />
              </div>

              {/* Signal */}
              <div className="flex justify-center">
                <SignalBadge signal={stock.signal} />
              </div>
            </div>

            {/* Mobile row */}
            <div className="md:hidden px-4 py-3 flex items-center gap-2.5">
              <span className="text-[11px] text-[var(--ba-text-muted)] w-5 text-center font-jetbrains">
                {stock.rank}
              </span>
              <div
                className={[
                  'w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-[13px] font-bold text-white',
                  STOCK_AVATAR_BG_CLASS[stock.symbol] ?? 'bg-[var(--ba-bg-tertiary)]',
                ].join(' ')}
              >
                {stock.symbol[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-[var(--ba-text-primary)] font-dm-sans truncate">
                  {stock.name}
                </div>
                <div className="text-[11px] text-[var(--ba-text-muted)] font-jetbrains">
                  {stock.symbol}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[13px] font-jetbrains text-[var(--ba-text-primary)]">
                  ₹{stock.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <ChangeChip change={stock.change} changePct={stock.changePct} />
              </div>
              <SignalBadge signal={stock.signal} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="text-[11px] text-[var(--ba-text-muted)] font-dm-sans text-center">
        Data: IIFL TTBlaze • NSE • Past performance not indicative of future results
      </div>
    </div>
  );
}
