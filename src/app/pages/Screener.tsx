import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, X, Download, ChevronDown, Zap, Loader2 } from 'lucide-react';
import { screenerPresets, screenerMetrics, allStocks } from '../data/mockData';
import { SignalBadge } from '../components/common/SignalBadge';
import { ChangeChip } from '../components/common/PriceDisplay';
import { Sparkline } from '../components/common/Sparkline';
import { useBulkQuotes } from '../hooks/useLiveData';

interface ScreenerRow {
  id: string;
  metric: string;
  operator: string;
  value: string;
  logic: 'AND' | 'OR';
}

const OPERATORS = ['>', '<', '=', '≥', '≤', 'between'];

const PRESET_COLOR_CLASS: Record<
  string,
  {
    activeBg: string;
    border: string;
    text: string;
  }
> = {
  '#00C896': {
    activeBg: 'bg-[#00C896]/[0.082]',
    border: 'border-[#00C896]',
    text: 'text-[#00C896]',
  },
  '#3B82F6': {
    activeBg: 'bg-[#3B82F6]/[0.082]',
    border: 'border-[#3B82F6]',
    text: 'text-[#3B82F6]',
  },
  '#F59E0B': {
    activeBg: 'bg-[#F59E0B]/[0.082]',
    border: 'border-[#F59E0B]',
    text: 'text-[#F59E0B]',
  },
  '#8B5CF6': {
    activeBg: 'bg-[#8B5CF6]/[0.082]',
    border: 'border-[#8B5CF6]',
    text: 'text-[#8B5CF6]',
  },
  '#EC4899': {
    activeBg: 'bg-[#EC4899]/[0.082]',
    border: 'border-[#EC4899]',
    text: 'text-[#EC4899]',
  },
  '#06B6D4': {
    activeBg: 'bg-[#06B6D4]/[0.082]',
    border: 'border-[#06B6D4]',
    text: 'text-[#06B6D4]',
  },
};

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

function getScoreClass(score: number) {
  if (score >= 80) return 'text-[var(--ba-green)]';
  if (score >= 60) return 'text-[var(--ba-gold)]';
  return 'text-[var(--ba-red)]';
}

export default function Screener() {
  const navigate = useNavigate();
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [rows, setRows] = useState<ScreenerRow[]>([
    { id: '1', metric: 'P/E Ratio', operator: '<', value: '25', logic: 'AND' },
    { id: '2', metric: 'ROE %', operator: '>', value: '15', logic: 'AND' },
  ]);
  const [showMetricPicker, setShowMetricPicker] = useState(false);
  const [metricPickerIdx, setMetricPickerIdx] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(true);
  const [resultCount] = useState(47);

  const displayedStocks = useMemo(() => allStocks.slice(0, 10), []);
  const symbolsList = useMemo(() => displayedStocks.map(s => s.symbol), [displayedStocks]);
  const { quotes: liveQuotes, loading: loadingQuotes } = useBulkQuotes(symbolsList, 30_000);

  const mergedStocks = useMemo(() => {
    return displayedStocks.map(s => {
      const q = liveQuotes[s.symbol];
      if (!q) return s;
      return { ...s, price: q.last_price, change: q.change, changePct: q.change_percent };
    });
  }, [displayedStocks, liveQuotes]);

  const addRow = () => {
    const newRow: ScreenerRow = {
      id: Date.now().toString(),
      metric: 'Market Cap (₹ Cr)',
      operator: '>',
      value: '10000',
      logic: 'AND',
    };
    setRows([...rows, newRow]);
  };

  const removeRow = (id: string) => setRows(rows.filter(r => r.id !== id));

  const updateRow = (id: string, updates: Partial<ScreenerRow>) => {
    setRows(rows.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const handlePreset = (presetId: string) => {
    setActivePreset(presetId === activePreset ? null : presetId);
    setShowResults(true);
  };

  return (
    <div className="text-[var(--ba-text-primary)] flex flex-col gap-5">

      {/* Header */}
      <div>
        <h1 className="font-dm-serif text-[28px] text-[var(--ba-text-primary)] m-0 mb-1">
          Stock Screener
        </h1>
        <p className="text-[13px] text-[var(--ba-text-secondary)] m-0 font-dm-sans">
          Filter 5,500+ stocks with custom criteria · AI-powered signals
        </p>
      </div>

      {/* ── PRESET STRATEGY CARDS ── */}
      <div>
        <div className="text-[12px] text-[var(--ba-text-muted)] tracking-[0.08em] uppercase mb-2.5 font-dm-sans">
          Preset Strategies
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
          {screenerPresets.map(preset => (
            (() => {
              const colorClasses = PRESET_COLOR_CLASS[preset.color] ?? {
                activeBg: 'bg-[var(--ba-bg-secondary)]',
                border: 'border-[var(--ba-border)]',
                text: 'text-[var(--ba-text-secondary)]',
              };
              const isActive = activePreset === preset.id;
              return (
                <motion.div
                  key={preset.id}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => handlePreset(preset.id)}
                  className={[
                    'shrink-0 w-[180px] border rounded-[14px] px-4 py-[14px] cursor-pointer transition-colors',
                    isActive
                      ? [colorClasses.activeBg, colorClasses.border].join(' ')
                      : 'bg-[var(--ba-bg-secondary)] border-[var(--ba-border)]',
                  ].join(' ')}
                >
                  <div className="text-[20px] mb-1.5">{preset.icon}</div>
                  <div className="text-[14px] font-semibold text-[var(--ba-text-primary)] font-dm-sans mb-0.5">
                    {preset.name}
                  </div>
                  <div className="text-[11px] text-[var(--ba-text-muted)] font-dm-sans mb-2 leading-[1.4]">
                    {preset.description}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={['text-[12px] font-jetbrains font-semibold', colorClasses.text].join(' ')}>
                      {preset.count} stocks
                    </span>
                    <span className="text-[10px] text-[var(--ba-text-muted)] font-dm-sans">
                      {preset.updated}
                    </span>
                  </div>
                </motion.div>
              );
            })()
          ))}
        </div>
      </div>

      {/* ── CUSTOM SCREENER BUILDER ── */}
      <div className="bg-[var(--ba-bg-secondary)] border border-[var(--ba-border)] rounded-2xl p-5">
        <div className="flex justify-between items-center mb-4">
          <div>
            <div className="text-[15px] font-semibold text-[var(--ba-text-primary)] font-dm-sans">
              Custom Screener
            </div>
            <div className="text-[12px] text-[var(--ba-text-muted)] mt-0.5 font-dm-sans">
              Build your own filter with 25+ metrics
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={addRow}
              type="button"
              className="flex items-center gap-1.5 bg-[var(--ba-blue)] text-white border-0 rounded-lg px-3.5 py-2 cursor-pointer text-[13px] font-dm-sans"
            >
              <Plus size={14} /> Add Filter
            </button>
          </div>
        </div>

        {/* Filter rows */}
        <div className="flex flex-col gap-2">
          {rows.map((row, idx) => (
            <motion.div
              key={row.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 bg-[var(--ba-bg-tertiary)] rounded-[10px] px-3 py-[10px] border border-[var(--ba-border)] flex-wrap"
            >
              {/* Logic toggle (not first) */}
              {idx > 0 && (
                <button
                  onClick={() => updateRow(row.id, { logic: row.logic === 'AND' ? 'OR' : 'AND' })}
                  type="button"
                  className={[
                    'px-2.5 py-1 rounded-[6px] border border-[var(--ba-border)] text-[11px] cursor-pointer font-bold font-dm-sans',
                    row.logic === 'AND'
                      ? 'bg-[var(--ba-blue)]/[0.15] text-[var(--ba-blue)]'
                      : 'bg-[var(--ba-gold)]/[0.15] text-[var(--ba-gold)]',
                  ].join(' ')}
                >
                  {row.logic}
                </button>
              )}

              {/* Metric selector */}
              <div className="relative shrink-0">
                <select
                  value={row.metric}
                  onChange={(e) => updateRow(row.id, { metric: e.target.value })}
                  aria-label="Metric"
                  title="Metric"
                  className="appearance-none bg-[var(--ba-bg-secondary)] border border-[var(--ba-border)] rounded-lg pl-2.5 pr-7 py-1.5 text-[13px] text-[var(--ba-text-primary)] font-dm-sans outline-none cursor-pointer"
                >
                  {screenerMetrics.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--ba-text-muted)]" />
              </div>

              {/* Operator */}
              <select
                value={row.operator}
                onChange={(e) => updateRow(row.id, { operator: e.target.value })}
                aria-label="Operator"
                title="Operator"
                className="appearance-none bg-[var(--ba-bg-secondary)] border border-[var(--ba-border)] rounded-lg px-3 py-1.5 text-[13px] text-[var(--ba-gold)] font-jetbrains outline-none cursor-pointer"
              >
                {OPERATORS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>

              {/* Value */}
              <input
                value={row.value}
                onChange={(e) => updateRow(row.id, { value: e.target.value })}
                placeholder="Value"
                className="bg-[var(--ba-bg-secondary)] border border-[var(--ba-border)] rounded-lg px-2.5 py-1.5 text-[13px] text-[var(--ba-text-primary)] font-jetbrains outline-none w-20"
              />

              {/* Remove */}
              <button
                onClick={() => removeRow(row.id)}
                type="button"
                aria-label="Remove filter row"
                title="Remove filter row"
                className="ml-auto p-1 bg-transparent border-0 cursor-pointer"
              >
                <X size={14} className="text-[var(--ba-text-muted)]" />
              </button>
            </motion.div>
          ))}
        </div>

        {/* Run screener */}
        <div className="flex gap-2 mt-4 items-center">
          <button
            onClick={() => setShowResults(true)}
            type="button"
            className="flex items-center gap-1.5 bg-[var(--ba-blue)] text-white border-0 rounded-[10px] px-5 py-2.5 cursor-pointer text-[13px] font-semibold font-dm-sans"
          >
            <Zap size={14} /> Run Screener
          </button>
          <span className="text-[13px] text-[var(--ba-text-secondary)] font-dm-sans">
            {showResults && <><strong className="text-[var(--ba-text-primary)]">{resultCount}</strong> stocks match your criteria</>}
          </span>
          {showResults && (
            <button
              type="button"
              className="ml-auto flex items-center gap-1.5 bg-[var(--ba-bg-tertiary)] border border-[var(--ba-border)] rounded-lg px-3.5 py-2 cursor-pointer text-[13px] text-[var(--ba-text-secondary)] font-dm-sans"
            >
              <Download size={14} /> Export CSV
            </button>
          )}
        </div>
      </div>

      {/* ── RESULTS TABLE ── */}
      <AnimatePresence>
        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-[var(--ba-bg-secondary)] border border-[var(--ba-border)] rounded-2xl overflow-hidden"
          >
            <div className="px-4 py-[14px] border-b border-[var(--ba-border)] flex justify-between items-center">
              <span className="text-[14px] font-semibold text-[var(--ba-text-primary)] font-dm-sans flex items-center gap-2">
                Results — {resultCount} stocks
                {loadingQuotes && <span className="text-[11px] bg-[var(--ba-blue)]/[0.1] text-[var(--ba-blue)] px-2 py-0.5 rounded flex items-center gap-1"><Loader2 size={10} className="animate-spin" /> Live data</span>}
              </span>
              <span className="text-[11px] text-[var(--ba-text-muted)] font-dm-sans">
                Last updated: Just now
              </span>
            </div>

            {/* Table header */}
            <div className="hidden md:grid grid-cols-[48px_1fr_140px_100px_56px_80px] px-4 py-2 border-b border-[var(--ba-border)] text-[11px] text-[var(--ba-text-muted)] tracking-[0.06em] uppercase font-dm-sans">
              <span>#</span>
              <span>Company</span>
              <span>Price / Change</span>
              <span>Market Cap</span>
              <span className="text-center">Score</span>
              <span className="text-center">Signal</span>
            </div>

            {mergedStocks.map((stock, i) => (
              <motion.div
                key={stock.symbol}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => navigate(`/stock/${stock.symbol}`)}
                className={[
                  'cursor-pointer hover:bg-[var(--ba-bg-tertiary)]',
                  i < 9 ? 'border-b border-[var(--ba-border)]' : '',
                ].join(' ')}
              >
                {/* Desktop */}
                <div className="hidden md:grid grid-cols-[48px_1fr_140px_100px_56px_80px] px-4 py-3 items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[var(--ba-text-muted)] font-jetbrains">{i + 1}</span>
                    <div
                      className={[
                        'w-6 h-6 rounded-[6px] flex items-center justify-center text-[10px] font-bold text-white',
                        STOCK_AVATAR_BG_CLASS[stock.symbol] ?? 'bg-[var(--ba-bg-tertiary)]',
                      ].join(' ')}
                    >
                      {stock.symbol[0]}
                    </div>
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold text-[var(--ba-text-primary)] font-dm-sans">{stock.name}</div>
                    <div className="flex gap-1.5 items-center mt-0.5">
                      <span className="text-[11px] text-[var(--ba-text-muted)] font-jetbrains">{stock.symbol}</span>
                      <span className="text-[10px] px-[5px] py-[1px] rounded-[3px] bg-[var(--ba-bg-tertiary)] text-[var(--ba-text-muted)]">
                        {stock.sector}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[13px] font-jetbrains text-[var(--ba-text-primary)]">
                      ₹{stock.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    <ChangeChip change={stock.change} changePct={stock.changePct} />
                  </div>
                  <div className="text-[12px] text-[var(--ba-text-secondary)] font-jetbrains">
                    {stock.marketCap >= 100000 ? `₹${(stock.marketCap / 100000).toFixed(1)}L Cr` : `₹${(stock.marketCap / 1000).toFixed(0)}K Cr`}
                  </div>
                  <div className={['text-center text-[13px] font-jetbrains', getScoreClass(stock.bharatAlphaScore)].join(' ')}>
                    {stock.bharatAlphaScore}
                  </div>
                  <div className="flex justify-center">
                    <SignalBadge signal={stock.signal} />
                  </div>
                </div>

                {/* Mobile */}
                <div className="md:hidden px-4 py-2.5 flex items-center gap-2.5">
                  <span className="w-5 text-center text-[11px] text-[var(--ba-text-muted)]">{i + 1}</span>
                  <div
                    className={[
                      'w-[30px] h-[30px] rounded-[6px] shrink-0 flex items-center justify-center text-[12px] font-bold text-white',
                      STOCK_AVATAR_BG_CLASS[stock.symbol] ?? 'bg-[var(--ba-bg-tertiary)]',
                    ].join(' ')}
                  >
                    {stock.symbol[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-semibold text-[var(--ba-text-primary)] font-dm-sans truncate">
                      {stock.name}
                    </div>
                    <div className="text-[11px] text-[var(--ba-text-muted)]">{stock.symbol}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[12px] font-jetbrains text-[var(--ba-text-primary)]">
                      ₹{stock.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    <ChangeChip change={stock.change} changePct={stock.changePct} />
                  </div>
                  <SignalBadge signal={stock.signal} />
                </div>
              </motion.div>
            ))}

            <div className="px-4 py-3 text-center border-t border-[var(--ba-border)]">
              <button
                type="button"
                onClick={() => navigate('/explore')}
                className="bg-transparent border border-[var(--ba-border)] rounded-lg px-5 py-2 cursor-pointer text-[13px] text-[var(--ba-text-secondary)] font-dm-sans"
              >
                Show all {resultCount} results in Explorer
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Disclaimer */}
      <div className="text-[11px] text-[var(--ba-text-muted)] font-dm-sans">
        SEBI Disclaimer: All screening criteria are for educational purposes only. Not financial advice. Past performance not indicative of future results. • Data: IIFL TTBlaze • NSE
      </div>
    </div>
  );
}
