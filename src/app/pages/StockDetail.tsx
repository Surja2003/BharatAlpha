import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AlertCircle, ArrowLeft, ArrowRight, Star } from 'lucide-react';
import { C, allStocks, generateOHLCV, stockDetail } from '../data/mockData';
import { ChangeChip } from '../components/common/PriceDisplay';
import { useStore } from '../store/useStore';

const TF_TABS = ['1D', '1W', '1M', '3M', '6M', '1Y', '5Y'] as const;
const FUND_TABS = ['Overview', 'Financials', 'Shareholding', 'Peers'] as const;

const RANGE_POS: Record<number, { fill: string; marker: string }> = {
  0: { fill: 'right-[100%]', marker: 'left-[0%]' },
  1: { fill: 'right-[99%]', marker: 'left-[1%]' },
  2: { fill: 'right-[98%]', marker: 'left-[2%]' },
  3: { fill: 'right-[97%]', marker: 'left-[3%]' },
  4: { fill: 'right-[96%]', marker: 'left-[4%]' },
  5: { fill: 'right-[95%]', marker: 'left-[5%]' },
  6: { fill: 'right-[94%]', marker: 'left-[6%]' },
  7: { fill: 'right-[93%]', marker: 'left-[7%]' },
  8: { fill: 'right-[92%]', marker: 'left-[8%]' },
  9: { fill: 'right-[91%]', marker: 'left-[9%]' },
  10: { fill: 'right-[90%]', marker: 'left-[10%]' },
  11: { fill: 'right-[89%]', marker: 'left-[11%]' },
  12: { fill: 'right-[88%]', marker: 'left-[12%]' },
  13: { fill: 'right-[87%]', marker: 'left-[13%]' },
  14: { fill: 'right-[86%]', marker: 'left-[14%]' },
  15: { fill: 'right-[85%]', marker: 'left-[15%]' },
  16: { fill: 'right-[84%]', marker: 'left-[16%]' },
  17: { fill: 'right-[83%]', marker: 'left-[17%]' },
  18: { fill: 'right-[82%]', marker: 'left-[18%]' },
  19: { fill: 'right-[81%]', marker: 'left-[19%]' },
  20: { fill: 'right-[80%]', marker: 'left-[20%]' },
  21: { fill: 'right-[79%]', marker: 'left-[21%]' },
  22: { fill: 'right-[78%]', marker: 'left-[22%]' },
  23: { fill: 'right-[77%]', marker: 'left-[23%]' },
  24: { fill: 'right-[76%]', marker: 'left-[24%]' },
  25: { fill: 'right-[75%]', marker: 'left-[25%]' },
  26: { fill: 'right-[74%]', marker: 'left-[26%]' },
  27: { fill: 'right-[73%]', marker: 'left-[27%]' },
  28: { fill: 'right-[72%]', marker: 'left-[28%]' },
  29: { fill: 'right-[71%]', marker: 'left-[29%]' },
  30: { fill: 'right-[70%]', marker: 'left-[30%]' },
  31: { fill: 'right-[69%]', marker: 'left-[31%]' },
  32: { fill: 'right-[68%]', marker: 'left-[32%]' },
  33: { fill: 'right-[67%]', marker: 'left-[33%]' },
  34: { fill: 'right-[66%]', marker: 'left-[34%]' },
  35: { fill: 'right-[65%]', marker: 'left-[35%]' },
  36: { fill: 'right-[64%]', marker: 'left-[36%]' },
  37: { fill: 'right-[63%]', marker: 'left-[37%]' },
  38: { fill: 'right-[62%]', marker: 'left-[38%]' },
  39: { fill: 'right-[61%]', marker: 'left-[39%]' },
  40: { fill: 'right-[60%]', marker: 'left-[40%]' },
  41: { fill: 'right-[59%]', marker: 'left-[41%]' },
  42: { fill: 'right-[58%]', marker: 'left-[42%]' },
  43: { fill: 'right-[57%]', marker: 'left-[43%]' },
  44: { fill: 'right-[56%]', marker: 'left-[44%]' },
  45: { fill: 'right-[55%]', marker: 'left-[45%]' },
  46: { fill: 'right-[54%]', marker: 'left-[46%]' },
  47: { fill: 'right-[53%]', marker: 'left-[47%]' },
  48: { fill: 'right-[52%]', marker: 'left-[48%]' },
  49: { fill: 'right-[51%]', marker: 'left-[49%]' },
  50: { fill: 'right-[50%]', marker: 'left-[50%]' },
  51: { fill: 'right-[49%]', marker: 'left-[51%]' },
  52: { fill: 'right-[48%]', marker: 'left-[52%]' },
  53: { fill: 'right-[47%]', marker: 'left-[53%]' },
  54: { fill: 'right-[46%]', marker: 'left-[54%]' },
  55: { fill: 'right-[45%]', marker: 'left-[55%]' },
  56: { fill: 'right-[44%]', marker: 'left-[56%]' },
  57: { fill: 'right-[43%]', marker: 'left-[57%]' },
  58: { fill: 'right-[42%]', marker: 'left-[58%]' },
  59: { fill: 'right-[41%]', marker: 'left-[59%]' },
  60: { fill: 'right-[40%]', marker: 'left-[60%]' },
  61: { fill: 'right-[39%]', marker: 'left-[61%]' },
  62: { fill: 'right-[38%]', marker: 'left-[62%]' },
  63: { fill: 'right-[37%]', marker: 'left-[63%]' },
  64: { fill: 'right-[36%]', marker: 'left-[64%]' },
  65: { fill: 'right-[35%]', marker: 'left-[65%]' },
  66: { fill: 'right-[34%]', marker: 'left-[66%]' },
  67: { fill: 'right-[33%]', marker: 'left-[67%]' },
  68: { fill: 'right-[32%]', marker: 'left-[68%]' },
  69: { fill: 'right-[31%]', marker: 'left-[69%]' },
  70: { fill: 'right-[30%]', marker: 'left-[70%]' },
  71: { fill: 'right-[29%]', marker: 'left-[71%]' },
  72: { fill: 'right-[28%]', marker: 'left-[72%]' },
  73: { fill: 'right-[27%]', marker: 'left-[73%]' },
  74: { fill: 'right-[26%]', marker: 'left-[74%]' },
  75: { fill: 'right-[25%]', marker: 'left-[75%]' },
  76: { fill: 'right-[24%]', marker: 'left-[76%]' },
  77: { fill: 'right-[23%]', marker: 'left-[77%]' },
  78: { fill: 'right-[22%]', marker: 'left-[78%]' },
  79: { fill: 'right-[21%]', marker: 'left-[79%]' },
  80: { fill: 'right-[20%]', marker: 'left-[80%]' },
  81: { fill: 'right-[19%]', marker: 'left-[81%]' },
  82: { fill: 'right-[18%]', marker: 'left-[82%]' },
  83: { fill: 'right-[17%]', marker: 'left-[83%]' },
  84: { fill: 'right-[16%]', marker: 'left-[84%]' },
  85: { fill: 'right-[15%]', marker: 'left-[85%]' },
  86: { fill: 'right-[14%]', marker: 'left-[86%]' },
  87: { fill: 'right-[13%]', marker: 'left-[87%]' },
  88: { fill: 'right-[12%]', marker: 'left-[88%]' },
  89: { fill: 'right-[11%]', marker: 'left-[89%]' },
  90: { fill: 'right-[10%]', marker: 'left-[90%]' },
  91: { fill: 'right-[9%]', marker: 'left-[91%]' },
  92: { fill: 'right-[8%]', marker: 'left-[92%]' },
  93: { fill: 'right-[7%]', marker: 'left-[93%]' },
  94: { fill: 'right-[6%]', marker: 'left-[94%]' },
  95: { fill: 'right-[5%]', marker: 'left-[95%]' },
  96: { fill: 'right-[4%]', marker: 'left-[96%]' },
  97: { fill: 'right-[3%]', marker: 'left-[97%]' },
  98: { fill: 'right-[2%]', marker: 'left-[98%]' },
  99: { fill: 'right-[1%]', marker: 'left-[99%]' },
  100: { fill: 'right-[0%]', marker: 'left-[100%]' },
} as const;

function RechartsTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-lg border border-[var(--ba-border)] bg-[var(--ba-bg-tertiary)] px-3 py-2 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
      {label != null && (
        <div className="mb-1 font-dm-sans text-[11px] text-[var(--ba-text-muted)]">{String(label)}</div>
      )}
      <div className="flex flex-col gap-1">
        {payload.map((p: any, idx: number) => {
          const name = p.name ?? p.dataKey ?? 'Value';
          const rawVal = p.value;
          const val = typeof rawVal === 'number' ? rawVal.toLocaleString('en-IN') : String(rawVal);
          return (
            <div key={idx} className="flex items-center justify-between gap-6">
              <div className="font-dm-sans text-[12px] text-[var(--ba-text-secondary)]">{String(name)}</div>
              <div className="font-jetbrains text-[12px] text-[var(--ba-text-primary)]">{val}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RangeBar({ low, high, current }: { low: number; high: number; current: number }) {
  const denom = high - low;
  const pct = denom === 0 ? 0 : ((current - low) / denom) * 100;
  const pctKey = Math.min(100, Math.max(0, Math.round(Number.isFinite(pct) ? pct : 0)));
  const pos = RANGE_POS[pctKey];

  return (
    <div className="flex items-center gap-2">
      <span className="w-[55px] font-jetbrains text-[11px] text-[var(--ba-text-muted)]">
        ₹{low.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
      </span>
      <div className="relative h-1 flex-1 rounded bg-[var(--ba-border)]">
        <div
          className={
            `absolute inset-y-0 left-0 rounded bg-gradient-to-r from-[var(--ba-red)] to-[var(--ba-green)] ${pos.fill}`
          }
        />
        <div
          className={
            `absolute -top-[3px] h-[10px] w-[10px] -translate-x-1/2 rounded-full border-2 border-[var(--ba-blue)] bg-white ${pos.marker}`
          }
        />
      </div>
      <span className="w-[55px] text-right font-jetbrains text-[11px] text-[var(--ba-text-muted)]">
        ₹{high.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
      </span>
    </div>
  );
}

function MetricCard({
  label,
  value,
  sectorValue,
  good,
}: {
  label: string;
  value: string | number;
  sectorValue?: string | number;
  good?: boolean;
}) {
  return (
    <div className="rounded-[10px] border border-[var(--ba-border)] bg-[var(--ba-bg-tertiary)] px-[14px] py-3">
      <div className="mb-1 font-dm-sans text-[11px] text-[var(--ba-text-muted)]">{label}</div>
      <div className="font-jetbrains text-[16px] font-semibold text-[var(--ba-text-primary)]">{value}</div>
      {sectorValue !== undefined && (
        <div
          className={
            `mt-0.5 font-dm-sans text-[10px] ` +
            (good ? 'text-[var(--ba-green)]' : 'text-[var(--ba-text-muted)]')
          }
        >
          vs Sector: {sectorValue} {good ? '✓ Better' : ''}
        </div>
      )}
    </div>
  );
}

function StockChart({ symbol, timeframe }: { symbol: string; timeframe: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let chart: any;
    let series: any;

    const initChart = async () => {
      try {
        const { createChart, CandlestickSeries } = await import('lightweight-charts');
        const el = containerRef.current!;

        if (chartRef.current) {
          chartRef.current.remove();
        }

        chart = createChart(el, {
          width: el.clientWidth,
          height: 340,
          layout: {
            background: { color: C.bgSecondary },
            textColor: C.textSecondary,
          },
          grid: {
            vertLines: { color: C.border },
            horzLines: { color: C.border },
          },
          crosshair: { mode: 1 },
          rightPriceScale: { borderColor: C.border },
          timeScale: { borderColor: C.border, timeVisible: true },
        });

        chartRef.current = chart;

        series = chart.addSeries(CandlestickSeries, {
          upColor: C.green,
          downColor: C.red,
          borderUpColor: C.green,
          borderDownColor: C.red,
          wickUpColor: C.green,
          wickDownColor: C.red,
        });

        const days =
          timeframe === '1D'
            ? 1
            : timeframe === '1W'
              ? 7
              : timeframe === '1M'
                ? 30
                : timeframe === '3M'
                  ? 90
                  : timeframe === '6M'
                    ? 180
                    : timeframe === '1Y'
                      ? 365
                      : 1825;
        const data = generateOHLCV(stockDetail.price, Math.min(days, 120));

        if (data.length > 0) {
          series.setData(data);
          chart.timeScale().fitContent();
        }

        const ro = new ResizeObserver(() => {
          if (chart && el) {
            chart.applyOptions({ width: el.clientWidth });
          }
        });
        ro.observe(el);

        return () => ro.disconnect();
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Chart init error:', err);
      }
    };

    initChart();

    return () => {
      if (chartRef.current) {
        try {
          chartRef.current.remove();
        } catch {
          // ignore
        }
        chartRef.current = null;
      }
    };
  }, [symbol, timeframe]);

  return <div ref={containerRef} className="h-[340px] w-full overflow-hidden rounded-lg" />;
}

export default function StockDetail() {
  const { symbol = 'RELIANCE' } = useParams();
  const navigate = useNavigate();
  const { watchlist, toggleWatchlist } = useStore();
  const [activeTimeframe, setActiveTimeframe] = useState<(typeof TF_TABS)[number]>('3M');
  const [activeFundTab, setActiveFundTab] = useState<(typeof FUND_TABS)[number]>('Overview');
  const [aiHorizon, setAiHorizon] = useState<'shortTerm' | 'mediumTerm' | 'longTerm'>('shortTerm');
  const [investAmount, setInvestAmount] = useState('');
  const isWatchlisted = watchlist.includes(symbol);

  const stock =
    allStocks.find((s) => s.symbol === symbol) ?? {
      ...allStocks[0],
      symbol,
      name: symbol,
    };

  const sd = stockDetail;
  const horizonData = sd.aiSignal.targets[aiHorizon];

  const SHAREHOLDING_DATA = [
    { name: 'Promoter', value: sd.shareholding.promoter, color: C.blue, swatchClass: 'bg-[var(--ba-blue)]' },
    { name: 'FII', value: sd.shareholding.fii, color: C.green, swatchClass: 'bg-[var(--ba-green)]' },
    { name: 'DII', value: sd.shareholding.dii, color: C.gold, swatchClass: 'bg-[var(--ba-gold)]' },
    { name: 'Public', value: sd.shareholding.public, color: '#8B5CF6', swatchClass: 'bg-[var(--ba-purple)]' },
  ] as const;

  const sharesEstimate = investAmount
    ? Math.floor(+investAmount.replace(/[^0-9]/g, '') / sd.price)
    : 0;

  return (
    <div className="flex flex-col gap-5 pb-20 text-[var(--ba-text-primary)]">
      {/* Desktop sticky in-page header */}
      <div className="sticky top-14 z-[80] -mx-4 hidden items-center gap-3 border-b border-[var(--ba-border)] bg-[var(--ba-bg-primary)] px-4 py-[10px] lg:flex md:-mx-6 md:px-6">
        <button
          type="button"
          onClick={() => navigate('/explore')}
          className="flex items-center gap-1 rounded-lg border border-[var(--ba-border)] bg-[var(--ba-bg-tertiary)] px-[10px] py-[6px] font-dm-sans text-[12px] text-[var(--ba-text-secondary)]"
          aria-label="Back to stock explorer"
        >
          <ArrowLeft size={14} />
          Back
        </button>
        <span className="font-dm-sans text-[16px] font-semibold text-[var(--ba-text-primary)]">{sd.name}</span>
        <span className="font-jetbrains text-[12px] text-[var(--ba-text-muted)]">{sd.symbol}</span>
        <span className="font-jetbrains text-[18px] text-[var(--ba-text-primary)]">
          ₹{sd.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
        <ChangeChip change={sd.change} changePct={sd.changePct} />
        <button
          type="button"
          onClick={() => toggleWatchlist(symbol)}
          className={
            `ml-auto flex items-center gap-1 rounded-lg px-3 py-[6px] font-dm-sans text-[12px] ` +
            (isWatchlisted
              ? 'border border-[var(--ba-gold)] bg-[rgba(245,158,11,0.15)] text-[var(--ba-gold)]'
              : 'border border-[var(--ba-border)] bg-[var(--ba-bg-tertiary)] text-[var(--ba-text-secondary)]')
          }
          aria-label={isWatchlisted ? 'Remove from watchlist' : 'Add to watchlist'}
        >
          <Star size={14} fill={isWatchlisted ? 'currentColor' : 'none'} />
          {isWatchlisted ? 'Watchlisted' : 'Watchlist'}
        </button>
      </div>

      {/* Mobile back */}
      <div className="flex items-center gap-2 lg:hidden">
        <button
          type="button"
          onClick={() => navigate('/explore')}
          className="flex items-center gap-1 bg-transparent p-0 font-dm-sans text-[13px] text-[var(--ba-text-secondary)]"
          aria-label="Back to stock explorer"
        >
          <ArrowLeft size={14} />
          Back
        </button>
      </div>

      {/* Hero */}
      <div className="rounded-2xl border border-[var(--ba-border)] bg-[var(--ba-bg-secondary)] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="m-0 mb-1 font-dm-serif text-[28px] text-[var(--ba-text-primary)]">{sd.name}</h1>
            <div className="mb-3 font-dm-sans text-[12px] text-[var(--ba-text-secondary)]">
              {sd.sector} › {sd.industry} · {sd.exchange}
            </div>
            <div className="font-jetbrains text-[36px] font-bold leading-none text-[var(--ba-text-primary)]">
              ₹{sd.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <ChangeChip change={sd.change} changePct={sd.changePct} />
              <span className="font-dm-sans text-[11px] text-[var(--ba-text-muted)]">today</span>
            </div>
          </div>

          <div className="flex min-w-[200px] flex-col gap-3">
            <div>
              <div className="mb-1 flex justify-between">
                <span className="font-dm-sans text-[11px] text-[var(--ba-text-muted)]">Day Range</span>
                <span className="font-jetbrains text-[11px] text-[var(--ba-text-secondary)]">₹{sd.open.toFixed(2)} open</span>
              </div>
              <RangeBar low={sd.low} high={sd.high} current={sd.price} />
            </div>
            <div>
              <div className="mb-1">
                <span className="font-dm-sans text-[11px] text-[var(--ba-text-muted)]">52W Range</span>
              </div>
              <RangeBar low={sd.low52w} high={sd.high52w} current={sd.price} />
            </div>
            <div className="flex gap-3">
              <div>
                <div className="text-[10px] text-[var(--ba-text-muted)]">Volume</div>
                <div className="font-jetbrains text-[13px] text-[var(--ba-text-primary)]">
                  {(sd.volume / 1e6).toFixed(2)}M
                </div>
              </div>
              <div>
                <div className="text-[10px] text-[var(--ba-text-muted)]">Avg Vol</div>
                <div className="font-jetbrains text-[13px] text-[var(--ba-text-secondary)]">
                  {(sd.avgVolume / 1e6).toFixed(2)}M
                </div>
              </div>
              <div>
                <div className="text-[10px] text-[var(--ba-text-muted)]">Mkt Cap</div>
                <div className="font-jetbrains text-[13px] text-[var(--ba-text-primary)]">
                  ₹{(sd.marketCap / 100000).toFixed(1)}L Cr
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-2xl border border-[var(--ba-border)] bg-[var(--ba-bg-secondary)] p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-1">
            {TF_TABS.map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setActiveTimeframe(tf)}
                className={
                  `rounded-md px-[10px] py-1 font-dm-sans text-[12px] ` +
                  (activeTimeframe === tf
                    ? 'bg-[var(--ba-blue)] text-white'
                    : 'bg-[var(--ba-bg-tertiary)] text-[var(--ba-text-secondary)]')
                }
              >
                {tf}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5">
            {['MA', 'EMA', 'BB', 'VWAP', 'RSI'].map((o) => (
              <button
                key={o}
                type="button"
                className="rounded border border-[var(--ba-border)] bg-transparent px-2 py-[3px] font-dm-sans text-[11px] text-[var(--ba-text-muted)]"
              >
                {o}
              </button>
            ))}
          </div>
        </div>
        <StockChart symbol={symbol} timeframe={activeTimeframe} />
        <div className="mt-2 flex gap-4 font-dm-sans text-[11px]">
          <span className="text-[var(--ba-gold)]">── MA20</span>
          <span className="text-[var(--ba-blue)]">── MA50</span>
          <span className="text-[#A78BFA]">── MA200</span>
        </div>
      </div>

      {/* AI analysis */}
      <div className="rounded-2xl border border-[rgba(0,200,150,0.2)] bg-[linear-gradient(135deg,#111827_0%,#1C2537_100%)] p-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="mb-1 font-dm-sans text-[11px] uppercase tracking-[0.1em] text-[var(--ba-text-muted)]">
              BharatAlpha Intelligence
            </div>
            <div className="flex items-center gap-3">
              <span className="font-dm-serif text-[28px] font-extrabold text-[var(--ba-green)]">BUY</span>
              <div>
                <div className="text-[11px] text-[var(--ba-text-muted)]">Confidence</div>
                <div className="font-jetbrains text-[20px] font-bold text-[var(--ba-green)]">{sd.aiSignal.confidence}%</div>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="mb-1 text-[11px] text-[var(--ba-text-muted)]">Risk Level</div>
            <span className="inline-flex rounded-md border border-[rgba(245,158,11,0.3)] bg-[rgba(245,158,11,0.15)] px-3 py-1 font-dm-sans text-[13px] font-semibold text-[var(--ba-gold)]">
              {sd.aiSignal.riskLevel}
            </span>
          </div>
        </div>

        {/* Causal chain */}
        <div className="mb-4">
          <div className="mb-2 font-dm-sans text-[12px] text-[var(--ba-text-muted)]">Causal Chain</div>
          <div className="flex flex-wrap items-center gap-1.5">
            {sd.aiSignal.reasoningChain.map((step, i) => (
              <React.Fragment key={i}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="rounded-lg border border-[var(--ba-border)] bg-[var(--ba-bg-tertiary)] px-[10px] py-1 font-dm-sans text-[12px] text-[var(--ba-text-primary)]"
                >
                  {step}
                </motion.div>
                {i < sd.aiSignal.reasoningChain.length - 1 && (
                  <ArrowRight size={12} className="text-[var(--ba-green)]" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Horizon tabs */}
        <div className="mb-3 flex gap-1.5">
          {([
            ['shortTerm', 'Short Term'],
            ['mediumTerm', 'Medium Term'],
            ['longTerm', 'Long Term'],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setAiHorizon(key)}
              className={
                `rounded-lg px-3.5 py-1.5 font-dm-sans text-[12px] font-medium ` +
                (aiHorizon === key
                  ? 'bg-[var(--ba-green)] text-black'
                  : 'bg-[var(--ba-bg-tertiary)] text-[var(--ba-text-secondary)]')
              }
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex gap-4">
          <div className="flex-1 rounded-[10px] border border-[rgba(0,200,150,0.2)] bg-[rgba(0,200,150,0.1)] px-[14px] py-2.5">
            <div className="text-[11px] text-[var(--ba-text-muted)]">Target Price</div>
            <div className="font-jetbrains text-[18px] font-bold text-[var(--ba-green)]">
              ₹{horizonData.target.toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-[var(--ba-text-muted)]">{horizonData.horizon}</div>
          </div>
          <div className="flex-1 rounded-[10px] border border-[rgba(255,77,106,0.2)] bg-[rgba(255,77,106,0.1)] px-[14px] py-2.5">
            <div className="text-[11px] text-[var(--ba-text-muted)]">Stop Loss</div>
            <div className="font-jetbrains text-[18px] font-bold text-[var(--ba-red)]">
              ₹{horizonData.stopLoss.toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-[var(--ba-text-muted)]">Risk limit</div>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-1 font-dm-sans text-[10px] text-[var(--ba-text-muted)]">
          <AlertCircle size={10} />
          Not financial advice. For educational purposes only. Confidence never 100%. Consult SEBI registered advisor.
        </div>
      </div>

      {/* Fundamentals */}
      <div className="rounded-2xl border border-[var(--ba-border)] bg-[var(--ba-bg-secondary)] p-5">
        <div className="mb-4 flex flex-wrap gap-1">
          {FUND_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveFundTab(tab)}
              className={
                `rounded-lg px-4 py-1.5 font-dm-sans text-[13px] ` +
                (activeFundTab === tab
                  ? 'bg-[var(--ba-blue)] text-white'
                  : 'bg-[var(--ba-bg-tertiary)] text-[var(--ba-text-secondary)]')
              }
            >
              {tab}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeFundTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeFundTab === 'Overview' && (
              <div className="grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(140px,1fr))]">
                <MetricCard
                  label="P/E Ratio"
                  value={sd.fundamentals.pe}
                  sectorValue={sd.fundamentals.sectorPe}
                  good={sd.fundamentals.pe < sd.fundamentals.sectorPe}
                />
                <MetricCard label="P/B Ratio" value={sd.fundamentals.pb} sectorValue={sd.fundamentals.sectorPb} />
                <MetricCard label="EV/EBITDA" value={sd.fundamentals.evEbitda} />
                <MetricCard label="Market Cap" value={`₹${(sd.marketCap / 100000).toFixed(1)}L Cr`} />
                <MetricCard
                  label="ROE %"
                  value={`${sd.fundamentals.roe}%`}
                  sectorValue={`${sd.fundamentals.sectorRoe}%`}
                  good={sd.fundamentals.roe > sd.fundamentals.sectorRoe}
                />
                <MetricCard label="ROCE %" value={`${sd.fundamentals.roce}%`} />
                <MetricCard label="Debt/Equity" value={sd.fundamentals.debtEquity} good={sd.fundamentals.debtEquity < 0.5} />
                <MetricCard label="Current Ratio" value={sd.fundamentals.currentRatio} good={sd.fundamentals.currentRatio > 1.2} />
              </div>
            )}

            {activeFundTab === 'Financials' && (
              <div className="flex flex-col gap-4">
                <div>
                  <div className="mb-2 font-dm-sans text-[13px] text-[var(--ba-text-secondary)]">Revenue Trend (₹ Crores)</div>
                  <div className="h-40 w-full">
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={sd.financials.quarterly}>
                        <XAxis dataKey="quarter" tick={{ fill: C.textMuted, fontSize: 10 }} />
                        <YAxis tick={{ fill: C.textMuted, fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                        <Tooltip content={<RechartsTooltip />} />
                        <Bar dataKey="revenue" fill={C.blue} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div>
                  <div className="mb-2 font-dm-sans text-[13px] text-[var(--ba-text-secondary)]">Net Profit Trend (₹ Crores)</div>
                  <div className="h-[140px] w-full">
                    <ResponsiveContainer width="100%" height={140}>
                      <LineChart data={sd.financials.quarterly}>
                        <XAxis dataKey="quarter" tick={{ fill: C.textMuted, fontSize: 10 }} />
                        <YAxis tick={{ fill: C.textMuted, fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                        <Tooltip content={<RechartsTooltip />} />
                        <Line type="monotone" dataKey="profit" stroke={C.green} strokeWidth={2} dot={{ fill: C.green, r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div>
                  <div className="mb-2 font-dm-sans text-[13px] text-[var(--ba-text-secondary)]">Net Margin %</div>
                  <div className="h-[100px] w-full">
                    <ResponsiveContainer width="100%" height={100}>
                      <BarChart data={sd.financials.quarterly}>
                        <XAxis dataKey="quarter" tick={{ fill: C.textMuted, fontSize: 10 }} />
                        <YAxis tick={{ fill: C.textMuted, fontSize: 10 }} unit="%" />
                        <Tooltip content={<RechartsTooltip />} />
                        <Bar dataKey="margin" fill={C.gold} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {activeFundTab === 'Shareholding' && (
              <div className="flex flex-wrap items-center gap-6">
                <div className="h-[200px] w-[200px] shrink-0">
                  <ResponsiveContainer width={200} height={200}>
                    <PieChart>
                      <Pie data={SHAREHOLDING_DATA} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={2}>
                        {SHAREHOLDING_DATA.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<RechartsTooltip />} formatter={(v: number) => [`${v}%`]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex flex-1 flex-col gap-2.5">
                  {SHAREHOLDING_DATA.map((d) => (
                    <div key={d.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`h-[10px] w-[10px] rounded-sm ${d.swatchClass}`} />
                        <span className="font-dm-sans text-[13px] text-[var(--ba-text-secondary)]">{d.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-jetbrains text-[14px] text-[var(--ba-text-primary)]">{d.value}%</span>
                        <span className="ml-1.5 text-[11px] text-[var(--ba-text-muted)]">QoQ</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeFundTab === 'Peers' && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--ba-border)]">
                      {['Company', 'Price', 'Change', 'P/E', 'P/B', 'ROE', 'Mkt Cap'].map((h) => (
                        <th
                          key={h}
                          className="px-3 py-2 text-left font-dm-sans text-[11px] uppercase tracking-[0.06em] text-[var(--ba-text-muted)]"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-[var(--ba-border)] bg-[rgba(59,130,246,0.08)]">
                      {[
                        `${sd.name} ★`,
                        `₹${sd.price.toFixed(2)}`,
                        `${sd.changePct > 0 ? '+' : ''}${sd.changePct.toFixed(2)}%`,
                        sd.fundamentals.pe,
                        sd.fundamentals.pb,
                        `${sd.fundamentals.roe}%`,
                        `₹${(sd.marketCap / 100000).toFixed(1)}L Cr`,
                      ].map((v, i) => (
                        <td
                          key={i}
                          className={
                            `px-3 py-2.5 text-[13px] ` +
                            (i >= 1 ? 'font-jetbrains' : 'font-dm-sans') +
                            (i === 2 ? ` ${sd.changePct > 0 ? 'text-[var(--ba-green)]' : 'text-[var(--ba-red)]'}` : ' text-[var(--ba-text-primary)]')
                          }
                        >
                          {v as any}
                        </td>
                      ))}
                    </tr>
                    {sd.peers.map((peer) => (
                      <tr key={peer.symbol} className="border-b border-[var(--ba-border)] hover:bg-[var(--ba-bg-tertiary)]">
                        {[
                          peer.name,
                          `₹${peer.price.toFixed(2)}`,
                          `${peer.changePct > 0 ? '+' : ''}${peer.changePct.toFixed(2)}%`,
                          peer.pe,
                          peer.pb,
                          `${peer.roe}%`,
                          `₹${(peer.marketCap / 100000).toFixed(1)}L Cr`,
                        ].map((v, i) => (
                          <td
                            key={i}
                            className={
                              `px-3 py-2.5 text-[13px] ` +
                              (i >= 1 ? 'font-jetbrains' : 'font-dm-sans') +
                              (i === 2
                                ? ` ${peer.changePct > 0 ? 'text-[var(--ba-green)]' : 'text-[var(--ba-red)]'}`
                                : ' text-[var(--ba-text-secondary)]')
                            }
                          >
                            {v as any}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* F&O */}
      <div className="rounded-2xl border border-[var(--ba-border)] bg-[var(--ba-bg-secondary)] p-5">
        <div className="mb-3 font-dm-sans text-[15px] font-semibold text-[var(--ba-text-primary)]">F&O Overview</div>

        <div className="mb-4 flex flex-wrap gap-3">
          <div className="rounded-[10px] border border-[var(--ba-border)] bg-[var(--ba-bg-tertiary)] px-4 py-2.5">
            <div className="text-[11px] text-[var(--ba-text-muted)]">PCR Ratio</div>
            <div
              className={
                `font-jetbrains text-[18px] font-semibold ` +
                (sd.optionChain.pcr >= 1 ? 'text-[var(--ba-green)]' : 'text-[var(--ba-red)]')
              }
            >
              {sd.optionChain.pcr}
            </div>
            <div className="text-[10px] text-[var(--ba-text-muted)]">{sd.optionChain.pcr >= 1 ? 'Bullish' : 'Bearish'}</div>
          </div>

          <div className="rounded-[10px] border border-[var(--ba-border)] bg-[var(--ba-bg-tertiary)] px-4 py-2.5">
            <div className="text-[11px] text-[var(--ba-text-muted)]">Max Pain</div>
            <div className="font-jetbrains text-[18px] font-semibold text-[var(--ba-text-primary)]">₹{sd.optionChain.maxPain}</div>
          </div>

          <div className="rounded-[10px] border border-[var(--ba-border)] bg-[var(--ba-bg-tertiary)] px-4 py-2.5">
            <div className="text-[11px] text-[var(--ba-text-muted)]">IV Percentile</div>
            <div className="font-jetbrains text-[18px] font-semibold text-[var(--ba-gold)]">{sd.optionChain.ivPercentile}%</div>
            <div className="text-[10px] text-[var(--ba-text-muted)]">Low volatility</div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[var(--ba-border)]">
                <th className="px-3 py-1.5 text-right font-dm-sans text-[11px] text-[var(--ba-green)]">CE OI</th>
                <th className="px-3 py-1.5 text-center font-dm-sans text-[11px] text-[var(--ba-text-muted)]">STRIKE</th>
                <th className="px-3 py-1.5 text-left font-dm-sans text-[11px] text-[var(--ba-red)]">PE OI</th>
              </tr>
            </thead>
            <tbody>
              {sd.optionChain.strikes.map((row) => {
                const isMaxPain = row.strike === sd.optionChain.maxPain;
                return (
                  <tr
                    key={row.strike}
                    className={
                      `border-b border-[var(--ba-border)] ` +
                      (isMaxPain ? 'bg-[rgba(245,158,11,0.1)]' : 'bg-transparent')
                    }
                  >
                    <td className="px-3 py-2 text-right font-jetbrains text-[12px] text-[var(--ba-green)]">
                      {row.ceOI.toLocaleString('en-IN')}
                    </td>
                    <td className="px-3 py-2 text-center font-jetbrains text-[13px] font-semibold text-[var(--ba-text-primary)]">
                      {row.strike}
                      {isMaxPain && <span className="ml-1 text-[9px] text-[var(--ba-gold)]">MAX PAIN</span>}
                    </td>
                    <td className="px-3 py-2 text-left font-jetbrains text-[12px] text-[var(--ba-red)]">
                      {row.peOI.toLocaleString('en-IN')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invest now - mobile sticky */}
      <div className="fixed bottom-16 left-0 right-0 z-[90] border-t border-[var(--ba-border)] bg-[var(--ba-bg-secondary)] px-4 py-3 md:hidden">
        <div className="mb-1.5 font-dm-sans text-[12px] text-[var(--ba-text-secondary)]">I want to invest</div>
        <div className="flex gap-2">
          <input
            value={investAmount}
            onChange={(e) => setInvestAmount(e.target.value)}
            placeholder="₹ Enter amount"
            className="h-11 flex-1 rounded-[10px] border border-[var(--ba-border)] bg-[var(--ba-bg-tertiary)] px-[14px] font-jetbrains text-[16px] text-[var(--ba-text-primary)] outline-none"
            aria-label="Investment amount"
          />
          <button
            type="button"
            className="h-11 rounded-[10px] bg-[var(--ba-blue)] px-4 font-dm-sans text-[13px] font-semibold text-white"
          >
            Get Plan
          </button>
        </div>
        {investAmount && (
          <div className="mt-1.5 font-dm-sans text-[12px] text-[var(--ba-text-secondary)]">
            ≈ {sharesEstimate} shares @ ₹{sd.price.toFixed(2)}
          </div>
        )}
      </div>

      {/* Invest now - desktop */}
      <div className="hidden rounded-2xl border border-[var(--ba-border)] bg-[var(--ba-bg-secondary)] p-5 md:block">
        <div className="mb-3 font-dm-sans text-[15px] font-semibold text-[var(--ba-text-primary)]">Invest Now</div>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <div className="mb-1.5 font-dm-sans text-[12px] text-[var(--ba-text-secondary)]">I want to invest</div>
            <input
              value={investAmount}
              onChange={(e) => setInvestAmount(e.target.value)}
              placeholder="₹ Enter amount"
              className="h-12 w-full rounded-[10px] border border-[var(--ba-border)] bg-[var(--ba-bg-tertiary)] px-[14px] font-jetbrains text-[18px] text-[var(--ba-text-primary)] outline-none"
              aria-label="Investment amount"
            />
            {investAmount && (
              <div className="mt-1 font-dm-sans text-[12px] text-[var(--ba-text-secondary)]">
                ≈ {sharesEstimate} shares @ ₹{sd.price.toFixed(2)} each
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => toggleWatchlist(symbol)}
            className={
              `h-12 rounded-[10px] px-4 font-dm-sans text-[13px] ` +
              (isWatchlisted
                ? 'border border-[var(--ba-gold)] bg-[rgba(245,158,11,0.15)] text-[var(--ba-gold)]'
                : 'border border-[var(--ba-border)] bg-[var(--ba-bg-tertiary)] text-[var(--ba-text-secondary)]')
            }
          >
            {isWatchlisted ? '★ Watchlisted' : '☆ Watchlist'}
          </button>
          <button type="button" className="h-12 rounded-[10px] bg-[var(--ba-blue)] px-5 font-dm-sans text-[13px] font-semibold text-white">
            Get Full Plan
          </button>
        </div>
      </div>

      <div className="font-dm-sans text-[11px] text-[var(--ba-text-muted)]">
        SEBI Disclaimer: All signals are for educational purposes. Not financial advice. Confidence never 100%. Past performance not indicative of future results.
      </div>
    </div>
  );
}
