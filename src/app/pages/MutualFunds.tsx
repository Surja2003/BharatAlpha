import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { TrendingUp, AlertCircle } from 'lucide-react';
import { C, mutualFunds } from '../data/mockData';

const CATEGORIES = ['All', 'Equity', 'Debt', 'Hybrid', 'ELSS', 'Index'];

const RISK_BG_CLASS: Record<string, string> = {
  Low: 'bg-[var(--ba-green)]',
  Moderate: 'bg-[var(--ba-gold)]',
  High: 'bg-[var(--ba-red)]',
  'Very High': 'bg-[#EF4444]',
};

const RISK_TEXT_CLASS: Record<string, string> = {
  Low: 'text-[var(--ba-green)]',
  Moderate: 'text-[var(--ba-gold)]',
  High: 'text-[var(--ba-red)]',
  'Very High': 'text-[#EF4444]',
};

const FUND_BADGE_CLASS: Record<
  string,
  {
    bg: string;
    border: string;
    text: string;
  }
> = {
  '#3B82F6': {
    bg: 'bg-[#3B82F6]/[0.125]',
    border: 'border-[#3B82F6]/[0.25]',
    text: 'text-[#3B82F6]',
  },
  '#00C896': {
    bg: 'bg-[#00C896]/[0.125]',
    border: 'border-[#00C896]/[0.25]',
    text: 'text-[#00C896]',
  },
  '#F59E0B': {
    bg: 'bg-[#F59E0B]/[0.125]',
    border: 'border-[#F59E0B]/[0.25]',
    text: 'text-[#F59E0B]',
  },
  '#8B5CF6': {
    bg: 'bg-[#8B5CF6]/[0.125]',
    border: 'border-[#8B5CF6]/[0.25]',
    text: 'text-[#8B5CF6]',
  },
  '#06B6D4': {
    bg: 'bg-[#06B6D4]/[0.125]',
    border: 'border-[#06B6D4]/[0.25]',
    text: 'text-[#06B6D4]',
  },
  '#10B981': {
    bg: 'bg-[#10B981]/[0.125]',
    border: 'border-[#10B981]/[0.25]',
    text: 'text-[#10B981]',
  },
  '#EF4444': {
    bg: 'bg-[#EF4444]/[0.125]',
    border: 'border-[#EF4444]/[0.25]',
    text: 'text-[#EF4444]',
  },
  '#F97316': {
    bg: 'bg-[#F97316]/[0.125]',
    border: 'border-[#F97316]/[0.25]',
    text: 'text-[#F97316]',
  },
};

function FundBadge({ amc, color }: { amc: string; color: string }) {
  const classes = FUND_BADGE_CLASS[color];
  return (
    <div
      className={[
        'w-10 h-10 rounded-[10px] shrink-0 border flex items-center justify-center',
        'text-[14px] font-extrabold font-dm-serif',
        classes?.bg ?? 'bg-[var(--ba-bg-tertiary)]',
        classes?.border ?? 'border-[var(--ba-border)]',
        classes?.text ?? 'text-[var(--ba-text-secondary)]',
      ].join(' ')}
    >
      {amc[0]}
    </div>
  );
}

function SipTooltip({
  active,
  payload,
  fmt,
}: {
  active?: boolean;
  payload?: Array<{ value?: number; name?: string } | undefined>;
  fmt: (v: number) => string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  const rows = payload
    .filter((p): p is { value?: number; name?: string } => Boolean(p))
    .map((p) => ({
      name: p.name === 'corpus' ? 'Corpus' : 'Invested',
      value: typeof p.value === 'number' ? p.value : undefined,
    }))
    .filter((r) => typeof r.value === 'number');

  if (rows.length === 0) return null;

  return (
    <div className="bg-[var(--ba-bg-tertiary)] border border-[var(--ba-border)] rounded-lg text-[12px] font-dm-sans px-3 py-2">
      {rows.map((r) => (
        <div key={r.name} className="flex items-center justify-between gap-6 whitespace-nowrap">
          <span className="text-[var(--ba-text-secondary)]">{r.name}</span>
          <span className="font-jetbrains text-[var(--ba-text-primary)]">{fmt(r.value)}</span>
        </div>
      ))}
    </div>
  );
}

function SIPCalculator() {
  const [monthly, setMonthly] = useState(5000);
  const [years, setYears] = useState(10);
  const [rate, setRate] = useState(12);

  const data = useMemo(() => {
    const points = [];
    let invested = 0;
    let corpus = 0;
    const monthlyRate = rate / 100 / 12;

    for (let m = 1; m <= years * 12; m++) {
      corpus = (corpus + monthly) * (1 + monthlyRate);
      invested += monthly;
      if (m % 12 === 0) {
        points.push({
          year: `Yr ${m / 12}`,
          invested: Math.round(invested),
          corpus: Math.round(corpus),
        });
      }
    }
    return points;
  }, [monthly, years, rate]);

  const totalInvested = monthly * years * 12;
  const finalCorpus = data.length > 0 ? data[data.length - 1].corpus : 0;
  const wealthGain = finalCorpus - totalInvested;

  const fmt = (v: number) => {
    if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)} Cr`;
    if (v >= 100000) return `₹${(v / 100000).toFixed(2)} L`;
    if (v >= 1000) return `₹${(v / 1000).toFixed(1)}K`;
    return `₹${v.toLocaleString('en-IN')}`;
  };

  return (
    <div className="bg-[var(--ba-bg-secondary)] border border-[var(--ba-border)] rounded-2xl p-5">
      <div className="text-[15px] font-semibold text-[var(--ba-text-primary)] mb-4 font-dm-sans">
        SIP Calculator
      </div>

      <div className="flex gap-6 flex-wrap mb-4">
        {/* Sliders */}
        <div className="flex-1 min-w-[220px] flex flex-col gap-3.5">
          <div>
            <div className="flex justify-between mb-1.5">
              <label htmlFor="sip-monthly" className="text-[12px] text-[var(--ba-text-secondary)] font-dm-sans">
                Monthly SIP
              </label>
              <span className="text-[14px] text-[var(--ba-blue)] font-jetbrains font-semibold">
                ₹{monthly.toLocaleString('en-IN')}
              </span>
            </div>
            <input
              id="sip-monthly"
              type="range" min={500} max={100000} step={500} value={monthly}
              onChange={(e) => setMonthly(+e.target.value)}
              aria-label="Monthly SIP amount"
              title="Monthly SIP amount"
              className="w-full accent-[var(--ba-blue)]"
            />
            <div className="flex justify-between text-[10px] text-[var(--ba-text-muted)]">
              <span>₹500</span><span>₹1L</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1.5">
              <label htmlFor="sip-years" className="text-[12px] text-[var(--ba-text-secondary)] font-dm-sans">
                Duration
              </label>
              <span className="text-[14px] text-[var(--ba-gold)] font-jetbrains font-semibold">
                {years} years
              </span>
            </div>
            <input
              id="sip-years"
              type="range" min={1} max={30} step={1} value={years}
              onChange={(e) => setYears(+e.target.value)}
              aria-label="SIP duration in years"
              title="SIP duration in years"
              className="w-full accent-[var(--ba-gold)]"
            />
            <div className="flex justify-between text-[10px] text-[var(--ba-text-muted)]">
              <span>1 yr</span><span>30 yrs</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1.5">
              <label htmlFor="sip-return" className="text-[12px] text-[var(--ba-text-secondary)] font-dm-sans">
                Expected Return
              </label>
              <span className="text-[14px] text-[var(--ba-green)] font-jetbrains font-semibold">
                {rate}% p.a.
              </span>
            </div>
            <input
              id="sip-return"
              type="range" min={8} max={18} step={0.5} value={rate}
              onChange={(e) => setRate(+e.target.value)}
              aria-label="Expected annual return percentage"
              title="Expected annual return percentage"
              className="w-full accent-[var(--ba-green)]"
            />
            <div className="flex justify-between text-[10px] text-[var(--ba-text-muted)]">
              <span>8%</span><span>18%</span>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 min-w-[200px]">
          <div className="flex flex-col gap-2.5 mb-3">
            <div className="bg-[var(--ba-bg-tertiary)] rounded-[10px] px-[14px] py-3 border border-[var(--ba-border)]">
              <div className="text-[11px] text-[var(--ba-text-muted)] font-dm-sans">You Invest</div>
              <div className="text-[18px] text-[var(--ba-text-primary)] font-jetbrains font-semibold">{fmt(totalInvested)}</div>
            </div>
            <div className="bg-[var(--ba-green)]/[0.1] rounded-[10px] px-[14px] py-3 border border-[var(--ba-green)]/[0.2]">
              <div className="text-[11px] text-[var(--ba-text-muted)] font-dm-sans">You Receive</div>
              <div className="text-[20px] text-[var(--ba-green)] font-jetbrains font-bold">{fmt(finalCorpus)}</div>
            </div>
            <div className="bg-[var(--ba-blue)]/[0.1] rounded-[10px] px-[14px] py-3 border border-[var(--ba-blue)]/[0.2]">
              <div className="text-[11px] text-[var(--ba-text-muted)] font-dm-sans">Wealth Gain</div>
              <div className="text-[18px] text-[var(--ba-blue)] font-jetbrains font-bold">{fmt(wealthGain)}</div>
            </div>
          </div>
          <div className="text-[10px] text-[var(--ba-text-muted)] font-dm-sans">
            Past performance not indicative of future results
          </div>
        </div>
      </div>

      {/* Growth Chart */}
      <div className="w-full h-40">
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 4 }}>
            <defs>
              <linearGradient id="corpusGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={C.green} stopOpacity={0.3} />
                <stop offset="95%" stopColor={C.green} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="investedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={C.blue} stopOpacity={0.2} />
                <stop offset="95%" stopColor={C.blue} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="year" tick={{ fill: C.textMuted, fontSize: 10 }} />
            <YAxis tickFormatter={v => fmt(v)} tick={{ fill: C.textMuted, fontSize: 9 }} width={60} />
            <Tooltip
              content={({ active, payload }) => <SipTooltip active={active} payload={payload} fmt={fmt} />}
            />
            <Area type="monotone" dataKey="invested" stroke={C.blue} strokeWidth={1.5} fill="url(#investedGrad)" dot={false} strokeDasharray="4 2" />
            <Area type="monotone" dataKey="corpus" stroke={C.green} strokeWidth={2} fill="url(#corpusGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function RiskOmeter({ level }: { level: string }) {
  const levels = ['Low', 'Moderate', 'High', 'Very High'];
  const idx = levels.indexOf(level);
  const activeBg = RISK_BG_CLASS[level] ?? 'bg-[var(--ba-text-muted)]';
  const textClass = RISK_TEXT_CLASS[level] ?? 'text-[var(--ba-text-muted)]';
  return (
    <div className="flex items-center gap-1">
      {levels.map((l, i) => (
        <div
          key={l}
          title={l}
          className={[
            'w-3.5 h-3.5 rounded-full transition-colors',
            i <= idx ? activeBg : 'bg-[var(--ba-border)]',
          ].join(' ')}
        />
      ))}
      <span className={['text-[11px] font-dm-sans ml-1', textClass].join(' ')}>{level}</span>
    </div>
  );
}

export default function MutualFunds() {
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered = useMemo(() => {
    if (activeCategory === 'All') return mutualFunds;
    return mutualFunds.filter(f => f.category === activeCategory || (activeCategory === 'Equity' && ['Equity', 'ELSS'].includes(f.category)));
  }, [activeCategory]);

  return (
    <div className="text-[var(--ba-text-primary)] flex flex-col gap-5">

      {/* Header */}
      <div>
        <h1 className="font-dm-serif text-[28px] text-[var(--ba-text-primary)] m-0 mb-1">
          Mutual Funds
        </h1>
        <p className="text-[13px] text-[var(--ba-text-secondary)] m-0 font-dm-sans">
          3,000+ funds · AMFI data · SIP from ₹10/month
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            type="button"
            className={[
              'px-4 py-[7px] rounded-full border text-[13px] cursor-pointer font-dm-sans transition-colors',
              activeCategory === cat
                ? 'border-[var(--ba-blue)] bg-[var(--ba-blue)]/[0.15] text-[var(--ba-blue)]'
                : 'border-[var(--ba-border)] bg-[var(--ba-bg-secondary)] text-[var(--ba-text-secondary)]',
            ].join(' ')}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* SIP Calculator */}
      <SIPCalculator />

      {/* Fund List */}
      <div>
        <div className="text-[12px] text-[var(--ba-text-muted)] tracking-[0.08em] uppercase mb-3 font-dm-sans">
          {filtered.length} Funds · Sorted by BharatAlpha Score
        </div>
        <div className="flex flex-col gap-3">
          {filtered.map((fund, i) => (
            <motion.div
              key={fund.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ scale: 1.005, boxShadow: '0 10px 40px rgba(0,0,0,0.4)' }}
              className="bg-[var(--ba-bg-secondary)] border border-[var(--ba-border)] hover:border-[var(--ba-border-hover)] rounded-2xl px-5 py-4 transition-colors"
            >
              <div className="flex justify-between items-start flex-wrap gap-3">

                {/* Fund Info */}
                <div className="flex gap-3 items-start">
                  <FundBadge amc={fund.amc} color={fund.color} />
                  <div>
                    <div className="text-[14px] font-semibold text-[var(--ba-text-primary)] font-dm-sans mb-0.5">
                      {fund.name}
                    </div>
                    <div className="text-[12px] text-[var(--ba-text-secondary)] font-dm-sans mb-1.5">
                      {fund.amc}
                    </div>
                    <div className="flex gap-2 items-center flex-wrap">
                      <span className="text-[10px] px-2 py-[2px] rounded bg-[var(--ba-bg-tertiary)] text-[var(--ba-text-secondary)] font-dm-sans">
                        {fund.category}
                      </span>
                      <RiskOmeter level={fund.riskLevel} />
                    </div>
                  </div>
                </div>

                {/* Returns */}
                <div className="flex gap-4 flex-wrap">
                  {[
                    { label: '1Y', value: fund.returns1Y },
                    { label: '3Y', value: fund.returns3Y },
                    { label: '5Y', value: fund.returns5Y },
                  ].map(r => (
                    <div key={r.label} className="text-center">
                      <div className="text-[10px] text-[var(--ba-text-muted)] font-dm-sans">{r.label} CAGR</div>
                      <div
                        className={[
                          'text-[16px] font-jetbrains font-semibold',
                          r.value >= 15
                            ? 'text-[var(--ba-green)]'
                            : r.value >= 10
                              ? 'text-[var(--ba-gold)]'
                              : 'text-[var(--ba-red)]',
                        ].join(' ')}
                      >
                        {r.value}%
                      </div>
                    </div>
                  ))}
                </div>

                {/* Meta + CTA */}
                <div className="flex flex-col items-end gap-2">
                  <div className="flex gap-4">
                    <div className="text-right">
                      <div className="text-[10px] text-[var(--ba-text-muted)]">AUM</div>
                      <div className="text-[13px] text-[var(--ba-text-secondary)] font-jetbrains">
                        ₹{fund.aum.toLocaleString('en-IN')} Cr
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-[var(--ba-text-muted)]">Expense</div>
                      <div className="text-[13px] text-[var(--ba-text-secondary)] font-jetbrains">
                        {fund.expenseRatio}%
                      </div>
                    </div>
                  </div>

                  {/* BharatAlpha Score */}
                  <div className="flex items-center gap-1.5">
                    <TrendingUp
                      size={11}
                      className={fund.bharatAlphaScore >= 85 ? 'text-[var(--ba-green)]' : 'text-[var(--ba-gold)]'}
                    />
                    <span className="text-[12px] text-[var(--ba-text-secondary)] font-dm-sans">
                      BA Score:
                    </span>
                    <span
                      className={[
                        'text-[13px] font-jetbrains font-bold',
                        fund.bharatAlphaScore >= 85 ? 'text-[var(--ba-green)]' : 'text-[var(--ba-gold)]',
                      ].join(' ')}
                    >
                      {fund.bharatAlphaScore}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="bg-[var(--ba-blue)] text-white border-0 rounded-[10px] px-5 py-2 cursor-pointer text-[13px] font-semibold font-dm-sans"
                  >
                    Start SIP ₹{fund.minSip.toLocaleString('en-IN')}/mo
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-[var(--ba-gold)]/[0.08] border border-[var(--ba-gold)]/[0.2] rounded-[10px] px-4 py-[10px] flex items-start gap-2">
        <AlertCircle size={14} className="shrink-0 mt-[1px] text-[var(--ba-gold)]" />
        <div className="text-[11px] text-[var(--ba-text-secondary)] font-dm-sans leading-[1.6]">
          Mutual fund investments are subject to market risks. Read all scheme-related documents carefully before investing.
          Past performance is not indicative of future results. BharatAlpha scores are for educational reference only. • Data: AMFI
        </div>
      </div>
    </div>
  );
}