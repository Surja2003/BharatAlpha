import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { AlertCircle, ChevronRight } from 'lucide-react';
import { getPortfolioAllocation } from '../data/mockData';
import { SignalBadge } from '../components/common/SignalBadge';

const HORIZONS = ['Short Term', 'Medium Term', 'Long Term', 'SIP'] as const;
const RISKS = ['Conservative', 'Moderate', 'Aggressive'] as const;

const AVATAR_BG_BY_LETTER: Record<string, string> = {
  A: 'bg-[hsl(245_45%_32%)]',
  B: 'bg-[hsl(282_45%_32%)]',
  C: 'bg-[hsl(319_45%_32%)]',
  D: 'bg-[hsl(356_45%_32%)]',
  E: 'bg-[hsl(33_45%_32%)]',
  F: 'bg-[hsl(70_45%_32%)]',
  G: 'bg-[hsl(107_45%_32%)]',
  H: 'bg-[hsl(144_45%_32%)]',
  I: 'bg-[hsl(181_45%_32%)]',
  J: 'bg-[hsl(218_45%_32%)]',
  K: 'bg-[hsl(255_45%_32%)]',
  L: 'bg-[hsl(292_45%_32%)]',
  M: 'bg-[hsl(329_45%_32%)]',
  N: 'bg-[hsl(6_45%_32%)]',
  O: 'bg-[hsl(43_45%_32%)]',
  P: 'bg-[hsl(80_45%_32%)]',
  Q: 'bg-[hsl(117_45%_32%)]',
  R: 'bg-[hsl(154_45%_32%)]',
  S: 'bg-[hsl(191_45%_32%)]',
  T: 'bg-[hsl(228_45%_32%)]',
  U: 'bg-[hsl(265_45%_32%)]',
  V: 'bg-[hsl(302_45%_32%)]',
  W: 'bg-[hsl(339_45%_32%)]',
  X: 'bg-[hsl(16_45%_32%)]',
  Y: 'bg-[hsl(53_45%_32%)]',
  Z: 'bg-[hsl(90_45%_32%)]',
};

const COLOR_BADGE_STYLE: Record<string, { bg: string; border: string; text: string }> = {
  '#00C896': {
    bg: 'bg-[rgba(0,200,150,0.125)]',
    border: 'border-[rgba(0,200,150,0.25)]',
    text: 'text-[var(--ba-green)]',
  },
  '#3B82F6': {
    bg: 'bg-[rgba(59,130,246,0.125)]',
    border: 'border-[rgba(59,130,246,0.25)]',
    text: 'text-[var(--ba-blue)]',
  },
  '#F59E0B': {
    bg: 'bg-[rgba(245,158,11,0.125)]',
    border: 'border-[rgba(245,158,11,0.25)]',
    text: 'text-[var(--ba-gold)]',
  },
  '#94A3B8': {
    bg: 'bg-[rgba(148,163,184,0.14)]',
    border: 'border-[rgba(148,163,184,0.3)]',
    text: 'text-[var(--ba-text-secondary)]',
  },
};

const RISK_ACTIVE_STYLE: Record<string, { border: string; bg: string; text: string }> = {
  Conservative: {
    border: 'border-[var(--ba-green)]',
    bg: 'bg-[rgba(0,200,150,0.125)]',
    text: 'text-[var(--ba-green)]',
  },
  Moderate: {
    border: 'border-[var(--ba-gold)]',
    bg: 'bg-[rgba(245,158,11,0.125)]',
    text: 'text-[var(--ba-gold)]',
  },
  Aggressive: {
    border: 'border-[var(--ba-red)]',
    bg: 'bg-[rgba(255,77,106,0.125)]',
    text: 'text-[var(--ba-red)]',
  },
};

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-[var(--ba-border)] bg-[var(--ba-bg-secondary)] p-5 ${className}`}>
      {children}
    </div>
  );
}

function AllocationTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value;
  const name = payload[0]?.payload?.name;
  if (typeof value !== 'number') return null;
  return (
    <div className="rounded-lg border border-[var(--ba-border)] bg-[var(--ba-bg-tertiary)] px-3 py-2 text-[12px]">
      <div className="font-dm-sans text-[11px] text-[var(--ba-text-secondary)]">{name}</div>
      <div className="font-jetbrains text-[13px] text-[var(--ba-text-primary)]">{value}%</div>
    </div>
  );
}

function RiskMeter({ score }: { score: number }) {
  const riskKey = score <= 35 ? 'Low' : score <= 65 ? 'Moderate' : 'High';
  const stroke = riskKey === 'Low' ? 'var(--ba-green)' : riskKey === 'Moderate' ? 'var(--ba-gold)' : 'var(--ba-red)';
  const labelClass = riskKey === 'Low' ? 'text-[var(--ba-green)]' : riskKey === 'Moderate' ? 'text-[var(--ba-gold)]' : 'text-[var(--ba-red)]';

  return (
    <div className="text-center">
      <svg width="160" height="100" viewBox="0 0 160 100">
        <path
          d="M 20 90 A 60 60 0 0 1 140 90"
          fill="none"
          stroke="var(--ba-border)"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <path
          d="M 20 90 A 60 60 0 0 1 140 90"
          fill="none"
          stroke={stroke}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${(score / 100) * 188} 188`}
        />
        <text x="20" y="105" fontSize="9" fill="var(--ba-green)">Low</text>
        <text x="70" y="28" fontSize="9" fill="var(--ba-gold)" textAnchor="middle">Moderate</text>
        <text x="135" y="105" fontSize="9" fill="var(--ba-red)" textAnchor="end">High</text>
        <text
          x="80"
          y="80"
          fontSize="22"
          fontWeight="700"
          fill={stroke}
          textAnchor="middle"
          fontFamily="'JetBrains Mono', monospace"
        >
          {score}
        </text>
        <text
          x="80"
          y="96"
          fontSize="10"
          fill="var(--ba-text-muted)"
          textAnchor="middle"
          fontFamily="'DM Sans', sans-serif"
        >
          / 100
        </text>
      </svg>
      <div className={`mt-1 font-dm-sans text-[12px] font-semibold ${labelClass}`}>
        {riskKey} Risk
      </div>
    </div>
  );
}

export default function Portfolio() {
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [horizon, setHorizon] = useState('Medium Term');
  const [risk, setRisk] = useState('Moderate');
  const [results, setResults] = useState<ReturnType<typeof getPortfolioAllocation> | null>(null);
  const [loading, setLoading] = useState(false);

  const handleBuild = () => {
    if (!amount) return;
    setLoading(true);
    setTimeout(() => {
      const numAmount = parseInt(amount.replace(/[^0-9]/g, ''), 10) || 100000;
      setResults(getPortfolioAllocation(numAmount, risk));
      setLoading(false);
    }, 1200);
  };

  const formatAmount = (v: number) => `₹${v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  return (
    <div className="flex flex-col gap-5 text-[var(--ba-text-primary)]">

      {/* Header */}
      <div>
        <h1 className="mb-1 font-dm-serif text-[28px] text-[var(--ba-text-primary)]">
          My Portfolio
        </h1>
        <p className="m-0 font-dm-sans text-[13px] text-[var(--ba-text-secondary)]">
          Build a personalised investment plan · AI-powered allocation
        </p>
      </div>

      {/* ── INVESTMENT INPUT HERO ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[20px] border border-[var(--ba-border)] bg-[linear-gradient(135deg,_#111827_0%,_#1C2537_100%)] p-6"
      >
        {/* Grid texture */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.04] bg-[linear-gradient(#94A3B8_1px,_transparent_1px),linear-gradient(90deg,_#94A3B8_1px,_transparent_1px)] bg-[size:20px_20px]" />

        <div className="relative">
          <h2 className="mb-5 font-dm-serif text-[24px] font-normal text-[var(--ba-text-primary)]">
            How much do you want to invest?
          </h2>

          {/* Amount Input */}
          <div className="mb-5 flex items-center gap-2 rounded-[14px] border-2 border-[var(--ba-blue)] bg-[var(--ba-bg-primary)] px-4 py-1">
            <span className="font-jetbrains text-[24px] text-[var(--ba-text-muted)]">₹</span>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="1,00,000"
              inputMode="numeric"
              aria-label="Investment amount"
              className="flex-1 bg-transparent font-jetbrains text-[28px] font-semibold text-[var(--ba-text-primary)] outline-none placeholder:text-[var(--ba-text-muted)]"
            />
          </div>

          {/* Quick amounts */}
          <div className="mb-5 flex flex-wrap gap-2">
            {['10,000', '25,000', '50,000', '1,00,000', '5,00,000'].map(v => (
              <button
                key={v}
                onClick={() => setAmount(v.replace(/,/g, ''))}
                type="button"
                className={`rounded-full border px-[14px] py-[6px] font-jetbrains text-[13px] ${amount === v.replace(/,/g, '') ? 'border-[var(--ba-blue)] bg-[rgba(59,130,246,0.15)] text-[var(--ba-blue)]' : 'border-[var(--ba-border)] bg-[var(--ba-bg-tertiary)] text-[var(--ba-text-secondary)]'}`}
              >
                ₹{v}
              </button>
            ))}
          </div>

          {/* Horizon */}
          <div className="mb-4">
            <div className="mb-2 font-dm-sans text-[12px] text-[var(--ba-text-muted)]">
              Investment Horizon
            </div>
            <div className="flex flex-wrap gap-2">
              {HORIZONS.map(h => (
                <button
                  key={h}
                  onClick={() => setHorizon(h)}
                  type="button"
                  className={`rounded-[10px] px-4 py-2 font-dm-sans text-[13px] font-medium ${horizon === h ? 'bg-[var(--ba-blue)] text-white' : 'bg-[var(--ba-bg-tertiary)] text-[var(--ba-text-secondary)]'}`}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>

          {/* Risk Appetite */}
          <div className="mb-6">
            <div className="mb-2 font-dm-sans text-[12px] text-[var(--ba-text-muted)]">
              Risk Appetite
            </div>
            <div className="flex gap-2">
              {RISKS.map((r) => {
                const activeStyle = RISK_ACTIVE_STYLE[r];
                return (
                  <button
                    key={r}
                    onClick={() => setRisk(r)}
                    type="button"
                    className={`flex-1 rounded-[10px] border px-2 py-2.5 font-dm-sans text-[13px] font-medium ${risk === r ? `${activeStyle.border} ${activeStyle.bg} ${activeStyle.text}` : 'border-[var(--ba-border)] bg-[var(--ba-bg-tertiary)] text-[var(--ba-text-secondary)]'}`}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={handleBuild}
            disabled={!amount || loading}
            type="button"
            className={`h-[52px] w-full rounded-[14px] font-dm-sans text-[15px] font-semibold transition-colors duration-200 ${amount ? 'bg-[var(--ba-blue)] text-white' : 'bg-[var(--ba-bg-tertiary)] text-[var(--ba-text-muted)]'} ${amount ? 'cursor-pointer' : 'cursor-not-allowed'} disabled:opacity-70`}
          >
            {loading ? '⏳ Building your portfolio...' : '🚀 Build My Portfolio'}
          </button>
        </div>
      </motion.div>

      {/* ── RESULTS SECTION ── */}
      <AnimatePresence>
        {results && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col gap-4"
          >
            {/* Allocation Donut */}
            <Card>
              <div className="mb-4 font-dm-sans text-[15px] font-semibold text-[var(--ba-text-primary)]">
                Portfolio Allocation
              </div>
              <div className="flex flex-wrap items-center gap-5">
                <div className="h-[200px] w-[200px] shrink-0">
                  <ResponsiveContainer width={200} height={200}>
                    <PieChart>
                      <Pie data={results.allocation} cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="pct" paddingAngle={2}>
                        {results.allocation.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={<AllocationTooltip />}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-1 flex-col gap-2.5">
                  {results.allocation.map(a => (
                    <div key={a.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`h-2.5 w-2.5 rounded-[2px] ${COLOR_BADGE_STYLE[a.color]?.bg ?? 'bg-[var(--ba-bg-tertiary)]'}`} />
                        <span className="font-dm-sans text-[13px] text-[var(--ba-text-secondary)]">{a.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-jetbrains text-[14px] text-[var(--ba-text-primary)]">
                          {a.pct}%
                        </span>
                        <span className="ml-2 font-jetbrains text-[11px] text-[var(--ba-text-muted)]">
                          ₹{(a.amount / 1000).toFixed(0)}K
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between rounded-[10px] bg-[var(--ba-bg-tertiary)] px-[14px] py-[10px]">
                <div>
                  <div className="text-[11px] text-[var(--ba-text-muted)]">Expected Returns</div>
                  <div className="font-jetbrains text-[16px] font-semibold text-[var(--ba-green)]">
                    {results.expectedReturnRange.min}–{results.expectedReturnRange.max}% CAGR
                  </div>
                </div>
                <div className="max-w-[180px] text-right font-dm-sans text-[10px] text-[var(--ba-text-muted)]">
                  Past performance not indicative of future results
                </div>
              </div>
            </Card>

            {/* Recommended Stocks */}
            <Card>
              <div className="mb-3 font-dm-sans text-[15px] font-semibold text-[var(--ba-text-primary)]">
                Recommended Stocks (Equity Portion)
              </div>
              <div className="flex flex-col gap-2.5">
                {results.stocks.map((stock) => (
                  <div
                    key={stock.symbol}
                    onClick={() => navigate(`/stock/${stock.symbol}`)}
                    className="flex cursor-pointer flex-wrap items-center justify-between gap-2.5 rounded-xl border border-[var(--ba-border)] bg-[var(--ba-bg-tertiary)] px-4 py-3 hover:border-[rgba(59,130,246,0.4)]"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-lg text-[14px] font-bold text-white ${AVATAR_BG_BY_LETTER[stock.symbol[0]] ?? AVATAR_BG_BY_LETTER.S}`}
                      >
                        {stock.symbol[0]}
                      </div>
                      <div>
                        <div className="font-dm-sans text-[14px] font-semibold text-[var(--ba-text-primary)]">
                          {stock.name}
                        </div>
                        <div className="mt-[2px] flex items-center gap-1.5">
                          <span className="font-jetbrains text-[11px] text-[var(--ba-text-muted)]">
                            {stock.symbol}
                          </span>
                          <SignalBadge signal={stock.signal} />
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-4">
                      <div className="text-center">
                        <div className="text-[10px] text-[var(--ba-text-muted)]">Invest</div>
                        <div className="font-jetbrains text-[13px] text-[var(--ba-blue)]">
                          {formatAmount(stock.amount)}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-[10px] text-[var(--ba-text-muted)]">Qty</div>
                        <div className="font-jetbrains text-[13px] text-[var(--ba-text-primary)]">
                          {stock.quantity} shares
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-[10px] text-[var(--ba-text-muted)]">Target</div>
                        <div className="font-jetbrains text-[13px] text-[var(--ba-green)]">
                          {stock.expectedReturn}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-[10px] text-[var(--ba-text-muted)]">Stop Loss</div>
                        <div className="font-jetbrains text-[13px] text-[var(--ba-red)]">
                          ₹{stock.stopLoss}
                        </div>
                      </div>
                    </div>
                    <div className="text-[var(--ba-text-muted)]">
                      <ChevronRight size={14} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Recommended MFs */}
            <Card>
              <div className="mb-3 font-dm-sans text-[15px] font-semibold text-[var(--ba-text-primary)]">
                Recommended Mutual Funds (SIP Portion)
              </div>
              <div className="flex flex-col gap-2.5">
                {results.mfs.map((mf) => (
                  <div
                    key={mf.id}
                    className="flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-[var(--ba-border)] bg-[var(--ba-bg-tertiary)] px-4 py-3"
                  >
                    <div className="flex items-center gap-2.5">
                      {(() => {
                        const cs = COLOR_BADGE_STYLE[mf.color] ?? COLOR_BADGE_STYLE['#3B82F6'];
                        return (
                          <div className={`flex h-9 w-9 items-center justify-center rounded-lg border text-[12px] font-bold ${cs.bg} ${cs.border} ${cs.text}`}>
                        {mf.amc[0]}
                          </div>
                        );
                      })()}
                      <div>
                        <div className="font-dm-sans text-[13px] font-semibold text-[var(--ba-text-primary)]">
                          {mf.name}
                        </div>
                        <div className="font-dm-sans text-[11px] text-[var(--ba-text-secondary)]">
                          {mf.amc} · {mf.category}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <div className="text-center">
                        <div className="text-[10px] text-[var(--ba-text-muted)]">3Y CAGR</div>
                        <div className="font-jetbrains text-[13px] text-[var(--ba-green)]">{mf.returns3Y}%</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[10px] text-[var(--ba-text-muted)]">5Y CAGR</div>
                        <div className="font-jetbrains text-[13px] text-[var(--ba-green)]">{mf.returns5Y}%</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[10px] text-[var(--ba-text-muted)]">Min SIP</div>
                        <div className="font-jetbrains text-[13px] text-[var(--ba-blue)]">₹{mf.minSip}/mo</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Portfolio Risk Score */}
            <Card className="flex flex-col items-center gap-2">
              <div className="font-dm-sans text-[15px] font-semibold text-[var(--ba-text-primary)]">
                Portfolio Risk Score
              </div>
              <RiskMeter score={results.riskScore} />
              <div className="font-dm-sans text-[13px] text-[var(--ba-text-secondary)]">
                Your portfolio risk: {results.riskScore <= 35 ? 'Low' : results.riskScore <= 65 ? 'Moderate' : 'High'} ({results.riskScore}/100)
              </div>
            </Card>

            {/* Disclaimer Strip */}
            <div className="flex items-start gap-2 rounded-[10px] border border-[rgba(245,158,11,0.2)] bg-[rgba(245,158,11,0.08)] px-4 py-2.5">
              <div className="mt-[1px] shrink-0 text-[var(--ba-gold)]">
                <AlertCircle size={14} />
              </div>
              <div className="font-dm-sans text-[11px] leading-[1.6] text-[var(--ba-text-secondary)]">
                <strong className="text-[var(--ba-gold)]">Disclaimer:</strong> BharatAlpha analysis is for educational purposes.
                Always consult a SEBI registered advisor before investing. Past performance is not indicative of future results.
                All recommendations carry market risk. Read all scheme-related documents carefully.
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}