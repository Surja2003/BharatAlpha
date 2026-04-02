import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArrowUpRight, ChevronRight, Loader2, Newspaper, Plus } from 'lucide-react';
import {
  aiSignalCards,
  gainers as mockGainers,
  indices as mockIndices,
  losers as mockLosers,
  mostActive as mockMostActive,
  high52w as mockHigh52w,
  newsItems as mockNewsItems,
  portfolioSparkline,
  sectors,
} from '../data/mockData';
import { useLiveIndices, useBulkQuotes, useLiveNews } from '../hooks/useLiveData';
import { NIFTY50_SYMBOLS } from '../services/api';
import { ChangeChip } from '../components/common/PriceDisplay';
import { Sparkline } from '../components/common/Sparkline';

const TABS = ['Gainers', 'Losers', 'Most Active', '52W High/Low'] as const;

const AVATAR_BG_BY_LETTER: Record<string, string> = {
  A: 'bg-[hsl(245_50%_35%)]',
  B: 'bg-[hsl(282_50%_35%)]',
  C: 'bg-[hsl(319_50%_35%)]',
  D: 'bg-[hsl(356_50%_35%)]',
  E: 'bg-[hsl(33_50%_35%)]',
  F: 'bg-[hsl(70_50%_35%)]',
  G: 'bg-[hsl(107_50%_35%)]',
  H: 'bg-[hsl(144_50%_35%)]',
  I: 'bg-[hsl(181_50%_35%)]',
  J: 'bg-[hsl(218_50%_35%)]',
  K: 'bg-[hsl(255_50%_35%)]',
  L: 'bg-[hsl(292_50%_35%)]',
  M: 'bg-[hsl(329_50%_35%)]',
  N: 'bg-[hsl(6_50%_35%)]',
  O: 'bg-[hsl(43_50%_35%)]',
  P: 'bg-[hsl(80_50%_35%)]',
  Q: 'bg-[hsl(117_50%_35%)]',
  R: 'bg-[hsl(154_50%_35%)]',
  S: 'bg-[hsl(191_50%_35%)]',
  T: 'bg-[hsl(228_50%_35%)]',
  U: 'bg-[hsl(265_50%_35%)]',
  V: 'bg-[hsl(302_50%_35%)]',
  W: 'bg-[hsl(339_50%_35%)]',
  X: 'bg-[hsl(16_50%_35%)]',
  Y: 'bg-[hsl(53_50%_35%)]',
  Z: 'bg-[hsl(90_50%_35%)]',
};

const SIGNAL_COLOR_STYLE: Record<
  string,
  { border: string; chipBg: string; chipBorder: string; text: string }
> = {
  '#00C896': {
    border: 'border-[rgba(0,200,150,0.2)]',
    chipBg: 'bg-[rgba(0,200,150,0.125)]',
    chipBorder: 'border-[rgba(0,200,150,0.25)]',
    text: 'text-[var(--ba-green)]',
  },
  '#FF4D6A': {
    border: 'border-[rgba(255,77,106,0.2)]',
    chipBg: 'bg-[rgba(255,77,106,0.125)]',
    chipBorder: 'border-[rgba(255,77,106,0.25)]',
    text: 'text-[var(--ba-red)]',
  },
  '#F59E0B': {
    border: 'border-[rgba(245,158,11,0.2)]',
    chipBg: 'bg-[rgba(245,158,11,0.125)]',
    chipBorder: 'border-[rgba(245,158,11,0.25)]',
    text: 'text-[var(--ba-gold)]',
  },
  '#3B82F6': {
    border: 'border-[rgba(59,130,246,0.2)]',
    chipBg: 'bg-[rgba(59,130,246,0.125)]',
    chipBorder: 'border-[rgba(59,130,246,0.25)]',
    text: 'text-[var(--ba-blue)]',
  },
};

const SECTOR_HEATMAP_CLASS: Record<string, string> = {
  IT: 'bg-[rgba(0,200,150,0.316000)] border-[rgba(0,200,150,0.416000)]',
  Banking: 'bg-[rgba(255,77,106,0.138857)] border-[rgba(255,77,106,0.238857)]',
  Pharma: 'bg-[rgba(0,200,150,0.265714)] border-[rgba(0,200,150,0.365714)]',
  Auto: 'bg-[rgba(0,200,150,0.176571)] border-[rgba(0,200,150,0.276571)]',
  FMCG: 'bg-[rgba(0,200,150,0.159429)] border-[rgba(0,200,150,0.259429)]',
  Metal: 'bg-[rgba(0,200,150,0.342286)] border-[rgba(0,200,150,0.442286)]',
  Energy: 'bg-[rgba(255,77,106,0.199429)] border-[rgba(255,77,106,0.299429)]',
  Realty: 'bg-[rgba(0,200,150,0.470286)] border-[rgba(0,200,150,0.570286)]',
};

const SENTIMENT_BADGE_CLASS: Record<string, string> = {
  POSITIVE: 'bg-[rgba(0,200,150,0.12)] text-[var(--ba-green)]',
  NEGATIVE: 'bg-[rgba(255,77,106,0.12)] text-[var(--ba-red)]',
  NEUTRAL: 'bg-[rgba(148,163,184,0.12)] text-[var(--ba-text-secondary)]',
};

function Card({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.005 }}
      transition={{ duration: 0.2 }}
      className={`rounded-2xl border border-[var(--ba-border)] bg-[var(--ba-bg-secondary)] p-4 ${className}`}
    >
      {children}
    </motion.div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 font-dm-sans text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--ba-text-muted)]">
      {children}
    </div>
  );
}

function PortfolioTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value;
  if (typeof value !== 'number') return null;

  return (
    <div className="rounded-lg border border-[var(--ba-border)] bg-[var(--ba-bg-tertiary)] px-3 py-2 text-[12px]">
      <div className="font-dm-sans text-[11px] text-[var(--ba-text-secondary)]">
        {label}
      </div>
      <div className="font-jetbrains text-[13px] text-[var(--ba-green)]">
        ₹{value.toLocaleString('en-IN')}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeGainerTab, setActiveGainerTab] = useState(0);

  // ── Live data from backend ─────────────────────────────────────────────
  const { indices: liveIndices, loading: loadingIndices, secsAgo } = useLiveIndices(15_000);
  const { quotes: liveQuotes, loading: loadingQuotes } = useBulkQuotes(NIFTY50_SYMBOLS, 20_000);
  const { news: liveNews, loading: loadingNews } = useLiveNews('India stock market BSE NSE Nifty Sensex', 12);

  // ── Merge live prices into mock stock lists ───────────────────────────
  const withLivePrice = (stocks: typeof mockGainers) =>
    stocks.map(s => {
      const lq = liveQuotes[s.symbol];
      if (!lq) return s;
      return { ...s, price: lq.last_price, change: lq.change, changePct: lq.change_percent };
    });

  const gainers = useMemo(() => withLivePrice(mockGainers).sort((a, b) => b.changePct - a.changePct), [liveQuotes]);
  const losers = useMemo(() => withLivePrice(mockLosers).sort((a, b) => a.changePct - b.changePct), [liveQuotes]);
  const mostActive = useMemo(() => withLivePrice(mockMostActive), [liveQuotes]);
  const high52w = useMemo(() => withLivePrice(mockHigh52w), [liveQuotes]);

  // ── Index display: prefer live, fall back to mock ─────────────────────
  const displayIndices = liveIndices.length > 0 ? liveIndices : mockIndices.map(i => ({
    symbol: i.symbol, name: i.name, value: i.value, change: i.change, changePct: i.changePct,
  }));

  // ── News: prefer live, fall back to mock ─────────────────────────────
  const newsItems = liveNews.length > 0
    ? liveNews.map((n, idx) => ({
      id: String(idx), source: n.source, timeAgo: n.published_at
        ? new Date(n.published_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
        : 'Recent',
      headline: n.title,
      ticker: n.symbols?.[0] ?? 'NSE',
      sentiment: 'NEUTRAL' as const,
      url: n.url,
    }))
    : mockNewsItems;

  const tabData = [gainers, losers, mostActive, high52w][activeGainerTab];

  return (
    <div className="flex flex-col gap-5 text-[var(--ba-text-primary)]">

      {/* ── MARKET PULSE STRIP ── */}
      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        {loadingIndices && displayIndices.length === 0 ? (
          <div className="flex items-center gap-2 text-[var(--ba-text-muted)] font-dm-sans text-[12px]">
            <Loader2 size={12} className="animate-spin" /> Loading live indices…
          </div>
        ) : displayIndices.map((idx) => {
          const isPos = idx.changePct >= 0;
          return (
            <motion.div
              key={idx.symbol}
              className={`shrink-0 rounded-[10px] border bg-[var(--ba-bg-secondary)] px-[14px] py-[6px] ${isPos ? 'border-[rgba(0,200,150,0.3)]' : 'border-[rgba(255,77,106,0.3)]'}`}
            >
              <span className="whitespace-nowrap font-dm-sans text-[11px] text-[var(--ba-text-muted)]">
                {idx.name}
              </span>
              <div className="mt-[2px] flex items-center gap-2">
                <span className="font-jetbrains text-[14px] text-[var(--ba-text-primary)]">
                  {idx.value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className={`font-jetbrains text-[11px] ${isPos ? 'text-[var(--ba-green)]' : 'text-[var(--ba-red)]'}`}>
                  {isPos ? '▲' : '▼'} {Math.abs(idx.changePct).toFixed(2)}%
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── LAST UPDATED ── */}
      <div className="-mt-3 font-dm-sans text-[11px] text-[var(--ba-text-muted)] flex items-center gap-1.5">
        {liveIndices.length > 0
          ? <><span className="w-1.5 h-1.5 rounded-full bg-[var(--ba-green)] inline-block" /> Live • {secsAgo <= 1 ? 'just now' : `${secsAgo}s ago`} • Data: IIFL TTBlaze • NSE</>
          : 'Data: NSE • AMFI • BSE (mock fallback)'}
      </div>

      {/* ── PORTFOLIO SNAPSHOT ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-2xl border border-[var(--ba-border)] bg-[linear-gradient(135deg,_#111827_0%,_#1C2537_100%)] p-5"
      >
        {/* Grid texture */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.04] bg-[linear-gradient(#94A3B8_1px,_transparent_1px),linear-gradient(90deg,_#94A3B8_1px,_transparent_1px)] bg-[size:20px_20px]" />

        <div className="relative flex flex-wrap items-start gap-4">
          <div className="min-w-[200px] flex-1">
            <div className="mb-1 font-dm-sans text-[12px] text-[var(--ba-text-secondary)]">
              Your Portfolio Today
            </div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="font-dm-serif text-[38px] leading-[1.1] tracking-[-1px] text-[var(--ba-text-primary)]"
            >
              ₹1,24,580
            </motion.div>
            <div className="mt-[6px] flex items-center gap-[6px] text-[var(--ba-green)]">
              <ArrowUpRight size={14} />
              <span className="font-jetbrains text-[13px]">
                ₹2,340 • +1.91% today
              </span>
            </div>
            <div className="mt-1 font-dm-sans text-[11px] text-[var(--ba-text-muted)]">
              Past performance not indicative of future results
            </div>
          </div>

          <div className="min-w-[200px] flex-1">
            <div className="h-20 w-full">
              <ResponsiveContainer width="100%" height={80}>
                <AreaChart data={portfolioSparkline} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
                  <defs>
                    <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--ba-green)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--ba-green)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" hide />
                  <YAxis domain={['auto', 'auto']} hide />
                  <Tooltip
                    content={<PortfolioTooltip />}
                  />
                  <Area type="monotone" dataKey="value" stroke="var(--ba-green)" strokeWidth={2} fill="url(#portfolioGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex w-full gap-2">
            <button
              onClick={() => navigate('/portfolio')}
              type="button"
              className="flex items-center gap-1.5 rounded-[10px] bg-[var(--ba-blue)] px-5 py-2.5 font-dm-sans text-[13px] font-semibold text-white"
            >
              <Plus size={14} /> Add Money
            </button>
            <button
              onClick={() => navigate('/portfolio')}
              type="button"
              className="rounded-[10px] border border-[rgba(59,130,246,0.3)] bg-[rgba(59,130,246,0.15)] px-5 py-2.5 font-dm-sans text-[13px] font-semibold text-[var(--ba-blue)]"
            >
              View Details
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── AI SIGNAL CARDS ── */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <SectionLabel>AI Signals</SectionLabel>
          <button
            onClick={() => navigate('/screener')}
            type="button"
            className="flex items-center gap-1 font-dm-sans text-[12px] text-[var(--ba-blue)]"
          >
            See All <ChevronRight size={12} />
          </button>
        </div>
        <div className="no-scrollbar grid gap-3 overflow-x-auto [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
          {aiSignalCards.map((card) => (
            <motion.div
              key={card.symbol}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
              className={`cursor-pointer rounded-2xl border bg-[var(--ba-bg-secondary)] p-4 transition-shadow hover:shadow-[0_10px_40px_rgba(0,0,0,0.5)] ${(SIGNAL_COLOR_STYLE[card.color]?.border ?? 'border-[var(--ba-border)]')}`}
              onClick={() => card.type !== 'SIP' && navigate(`/stock/${card.symbol}`)}
            >
              <div className="mb-2 flex items-start justify-between">
                <div>
                  <div className="font-dm-sans text-[15px] font-semibold text-[var(--ba-text-primary)]">
                    {card.symbol}
                  </div>
                  <div className="text-[11px] text-[var(--ba-text-secondary)]">{card.name}</div>
                </div>
                {(() => {
                  const cs = SIGNAL_COLOR_STYLE[card.color] ?? SIGNAL_COLOR_STYLE['#3B82F6'];
                  return (
                    <span className={`rounded-md border px-2 py-[2px] font-dm-sans text-[11px] font-semibold ${cs.chipBg} ${cs.chipBorder} ${cs.text}`}>
                      {card.signalLabel}
                    </span>
                  );
                })()}
              </div>

              <div className="mb-2 font-dm-sans text-[11px] text-[var(--ba-text-secondary)]">
                {card.sector}
              </div>

              <div className="mb-2 rounded-lg bg-[var(--ba-bg-tertiary)] px-[10px] py-[6px] font-dm-sans text-[12px] text-[var(--ba-text-secondary)]">
                "{card.reason}"
              </div>

              <div className="flex items-center justify-between">
                <div className="flex gap-3">
                  {card.target > 0 && (
                    <div>
                      <div className="text-[10px] text-[var(--ba-text-muted)]">Target</div>
                      <div className="font-jetbrains text-[12px] text-[var(--ba-green)]">
                        ₹{card.target}
                      </div>
                    </div>
                  )}
                  {card.stopLoss > 0 && card.type !== 'SIP' && (
                    <div>
                      <div className="text-[10px] text-[var(--ba-text-muted)]">Stop Loss</div>
                      <div className="font-jetbrains text-[12px] text-[var(--ba-red)]">
                        ₹{card.stopLoss}
                      </div>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-[var(--ba-text-muted)]">Confidence</div>
                  <div className={`font-jetbrains text-[13px] font-semibold ${(SIGNAL_COLOR_STYLE[card.color]?.text ?? 'text-[var(--ba-blue)]')}`}>
                    {card.confidence}%
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── MARKET REGIME BANNER ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-2.5 rounded-[10px] border border-[rgba(0,200,150,0.3)] bg-[rgba(0,200,150,0.1)] px-4 py-2.5"
      >
        <span className="text-[16px]">🟢</span>
        <div>
          <span className="font-dm-sans text-[13px] font-semibold text-[var(--ba-green)]">
            BULL MARKET
          </span>
          <span className="font-dm-sans text-[13px] text-[var(--ba-text-secondary)]">
            {' '}— Market Regime: Bull Run · Momentum strategies active
          </span>
        </div>
      </motion.div>

      {/* ── GAINERS / LOSERS TABS ── */}
      <Card>
        <div className="mb-4 flex flex-wrap gap-1">
          {TABS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveGainerTab(i)}
              type="button"
              className={`rounded-lg px-[14px] py-[6px] font-dm-sans text-[13px] font-medium transition-colors duration-200 ${activeGainerTab === i ? 'bg-[var(--ba-blue)] text-white' : 'bg-[var(--ba-bg-tertiary)] text-[var(--ba-text-secondary)]'}`}
            >
              {tab}
            </button>
          ))}
          <button
            onClick={() => navigate('/explore')}
            type="button"
            className="ml-auto flex items-center gap-1 font-dm-sans text-[12px] text-[var(--ba-blue)]"
          >
            See All <ChevronRight size={12} />
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {tabData.map((stock, i) => (
            <motion.div
              key={stock.symbol}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => navigate(`/stock/${stock.symbol}`)}
              className={`flex cursor-pointer items-center gap-3 py-2 ${i < tabData.length - 1 ? 'border-b border-[var(--ba-border)]' : ''}`}
            >
              {/* Rank */}
              <span className="w-5 text-center font-jetbrains text-[12px] text-[var(--ba-text-muted)]">
                {i + 1}
              </span>

              {/* Avatar */}
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-dm-sans text-[13px] font-bold text-white ${AVATAR_BG_BY_LETTER[stock.symbol[0]] ?? AVATAR_BG_BY_LETTER.S}`}
              >
                {stock.symbol[0]}
              </div>

              {/* Name */}
              <div className="min-w-0 flex-1">
                <div className="truncate font-dm-sans text-[13px] font-semibold text-[var(--ba-text-primary)]">
                  {stock.name}
                </div>
                <div className="text-[11px] text-[var(--ba-text-muted)]">{stock.symbol}</div>
              </div>

              {/* Price */}
              <div className="shrink-0 text-right">
                <div className="font-jetbrains text-[13px] text-[var(--ba-text-primary)]">
                  ₹{stock.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <ChangeChip change={stock.change} changePct={stock.changePct} />
              </div>

              {/* Sparkline */}
              <div className="hidden sm:block">
                <Sparkline data={stock.sparkline} width={50} height={24} />
              </div>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* ── SECTORAL HEATMAP ── */}
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <SectionLabel>Sectoral Heatmap</SectionLabel>
          <span className="font-dm-sans text-[11px] text-[var(--ba-text-muted)]">
            Today's Performance
          </span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {sectors.map((sector) => {
            const heatClass = SECTOR_HEATMAP_CLASS[sector.name] ?? 'bg-[var(--ba-bg-tertiary)] border-[var(--ba-border)]';

            return (
              <motion.div
                key={sector.name}
                whileHover={{ scale: 1.03 }}
                onClick={() => navigate('/explore')}
                className={`cursor-pointer rounded-[10px] border px-2 py-2.5 text-center ${heatClass}`}
              >
                <div className="font-dm-sans text-[13px] font-semibold text-[var(--ba-text-primary)]">
                  {sector.name}
                </div>
                <div className={`mt-[2px] font-jetbrains text-[13px] ${sector.changePct > 0 ? 'text-[var(--ba-green)]' : 'text-[var(--ba-red)]'}`}>
                  {sector.changePct > 0 ? '+' : ''}{sector.changePct.toFixed(2)}%
                </div>
                <div className="mt-[2px] text-[10px] text-[var(--ba-text-muted)]">
                  {sector.stocks} stocks
                </div>
              </motion.div>
            );
          })}
        </div>
      </Card>

      {/* ── RECENT NEWS ── */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <SectionLabel>Market News</SectionLabel>
          <button type="button" className="flex items-center gap-1 font-dm-sans text-[12px] text-[var(--ba-blue)]">
            More <ChevronRight size={12} />
          </button>
        </div>
        <div className="flex flex-col gap-2.5">
          {newsItems.map((item) => (
            <motion.div
              key={item.id}
              whileHover={{ scale: 1.005 }}
              className="cursor-pointer rounded-xl border border-[var(--ba-border)] bg-[var(--ba-bg-secondary)] px-4 py-3"
            >
              <div className="mb-1.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded bg-[var(--ba-bg-tertiary)] text-[var(--ba-text-secondary)]">
                    <Newspaper size={10} />
                  </div>
                  <span className="font-dm-sans text-[11px] text-[var(--ba-text-secondary)]">
                    {item.source}
                  </span>
                  <span className="text-[11px] text-[var(--ba-text-muted)]">•</span>
                  <span className="font-dm-sans text-[11px] text-[var(--ba-text-muted)]">
                    {item.timeAgo}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`rounded px-1.5 py-[2px] font-dm-sans text-[10px] font-semibold ${SENTIMENT_BADGE_CLASS[item.sentiment] ?? SENTIMENT_BADGE_CLASS.NEUTRAL}`}>
                    {item.sentiment}
                  </span>
                  <span className="rounded bg-[var(--ba-bg-tertiary)] px-1.5 py-[2px] font-jetbrains text-[10px] text-[var(--ba-text-secondary)]">
                    {item.ticker}
                  </span>
                </div>
              </div>
              <div className="line-clamp-2 font-dm-sans text-[13px] leading-[1.5] text-[var(--ba-text-primary)]">
                {item.headline}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── SEBI DISCLAIMER ── */}
      <div className="rounded-[10px] border border-[var(--ba-border)] bg-[var(--ba-bg-secondary)] px-4 py-2.5 font-dm-sans text-[11px] leading-[1.6] text-[var(--ba-text-muted)]">
        <strong className="text-[var(--ba-text-secondary)]">SEBI Disclaimer:</strong> BharatAlpha is for educational purposes only and is not a SEBI registered investment advisor. All signals and recommendations are based on algorithmic analysis and should not be construed as financial advice. Always consult a SEBI registered advisor before investing. Past performance is not indicative of future results.
      </div>

      {/* ── MOBILE BOTTOM CTA ── */}
      <div className="fixed bottom-16 left-0 right-0 z-[90] px-4 pb-2 md:hidden">
        <button
          onClick={() => navigate('/portfolio')}
          type="button"
          className="w-full rounded-xl bg-[var(--ba-blue)] py-[14px] font-dm-sans text-[14px] font-semibold text-white shadow-[0_4px_20px_rgba(59,130,246,0.4)]"
        >
          Analyse My Portfolio
        </button>
      </div>
    </div>
  );
}