import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import {
    ChevronRight,
    ChevronLeft,
    AlertCircle,
    TrendingUp,
    Shield,
    Zap,
    CheckCircle2,
    Info,
    ChevronDown,
    ChevronUp,
    Landmark,
    Building2,
    Sparkles,
    Lock,
    CircleDollarSign,
    BadgePercent,
} from 'lucide-react';
import {
    getInvestmentRecommendation,
    type RiskProfile,
    type AllocationSlice,
    type InvestmentRecommendation,
} from '../data/mockData';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function fmtAmt(v: number): string {
    if (v >= 10_000_000) return `₹${(v / 10_000_000).toFixed(2)} Cr`;
    if (v >= 100_000) return `₹${(v / 100_000).toFixed(2)} L`;
    if (v >= 1_000) return `₹${(v / 1_000).toFixed(1)}K`;
    return `₹${v.toLocaleString('en-IN')}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const RISK_PROFILES: { id: RiskProfile; label: string; icon: React.ReactNode; desc: string; returnRange: string; color: string; scorePct: number }[] = [
    {
        id: 'Conservative',
        label: 'Conservative',
        icon: <Shield size={22} />,
        desc: 'Capital preservation. Bonds & FDs anchor the portfolio. Suitable for short horizons or low risk tolerance.',
        returnRange: '8–12% CAGR',
        color: '#10B981',
        scorePct: 24,
    },
    {
        id: 'Moderate',
        label: 'Moderate',
        icon: <TrendingUp size={22} />,
        desc: 'Balanced growth. Mix of equity, bonds, ETFs & commodities. Best for 5–10 year horizons.',
        returnRange: '12–18% CAGR',
        color: '#F59E0B',
        scorePct: 50,
    },
    {
        id: 'Aggressive',
        label: 'Aggressive',
        icon: <Zap size={22} />,
        desc: 'Maximum growth. Heavy equity & ETF exposure with commodity hedges. Ideal for 10+ year horizons.',
        returnRange: '16–26% CAGR',
        color: '#EF4444',
        scorePct: 74,
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// Donut Tooltip
// ─────────────────────────────────────────────────────────────────────────────
function DonutTooltip({ active, payload }: { active?: boolean; payload?: any[] }) {
    if (!active || !payload?.[0]) return null;
    const d = payload[0].payload as AllocationSlice;
    return (
        <div className="bg-[var(--ba-bg-tertiary)] border border-[var(--ba-border)] rounded-xl px-4 py-3 text-[12px] font-dm-sans shadow-2xl">
            <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{d.icon}</span>
                <span className="font-semibold text-[var(--ba-text-primary)]">{d.name}</span>
            </div>
            <div className="flex justify-between gap-6 text-[var(--ba-text-secondary)]">
                <span>Allocation</span>
                <span className="font-jetbrains font-semibold" style={{ color: d.color }}>{d.pct}%</span>
            </div>
            <div className="flex justify-between gap-6 text-[var(--ba-text-secondary)]">
                <span>Amount</span>
                <span className="font-jetbrains text-[var(--ba-text-primary)]">{fmtAmt(d.amount)}</span>
            </div>
            <div className="flex justify-between gap-6 text-[var(--ba-text-secondary)]">
                <span>Return</span>
                <span className="font-jetbrains text-[var(--ba-green)]">{d.expectedReturn}</span>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Asset Card (expandable)
// ─────────────────────────────────────────────────────────────────────────────
function AssetCard({
    slice,
    children,
    defaultOpen = false,
}: {
    slice: AllocationSlice;
    children: React.ReactNode;
    defaultOpen?: boolean;
}) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[var(--ba-bg-secondary)] border border-[var(--ba-border)] rounded-2xl overflow-hidden"
        >
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-[var(--ba-bg-tertiary)] transition-colors cursor-pointer text-left"
            >
                <div className="flex items-center gap-3">
                    <div
                        className="w-9 h-9 rounded-[10px] flex items-center justify-center text-[18px] shrink-0"
                        style={{ background: `${slice.color}22`, border: `1px solid ${slice.color}44` }}
                    >
                        {slice.icon}
                    </div>
                    <div>
                        <div className="text-[14px] font-semibold text-[var(--ba-text-primary)] font-dm-sans">{slice.name}</div>
                        <div className="text-[11px] text-[var(--ba-text-muted)] font-dm-sans">{slice.rationale}</div>
                    </div>
                </div>
                <div className="flex items-center gap-4 shrink-0 ml-4">
                    <div className="text-right hidden sm:block">
                        <div className="text-[11px] text-[var(--ba-text-muted)] font-dm-sans">Expected</div>
                        <div className="text-[13px] font-jetbrains font-semibold text-[var(--ba-green)]">{slice.expectedReturn}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-[11px] text-[var(--ba-text-muted)] font-dm-sans">Allocation</div>
                        <div
                            className="text-[16px] font-jetbrains font-bold"
                            style={{ color: slice.color }}
                        >
                            {slice.pct}%
                        </div>
                    </div>
                    <div className="text-right hidden sm:block">
                        <div className="text-[11px] text-[var(--ba-text-muted)] font-dm-sans">Amount</div>
                        <div className="text-[13px] font-jetbrains text-[var(--ba-text-primary)]">{fmtAmt(slice.amount)}</div>
                    </div>
                    <div className="text-[var(--ba-text-secondary)]">
                        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                </div>
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        className="overflow-hidden"
                    >
                        <div className="border-t border-[var(--ba-border)] px-5 py-4">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 1 — Amount
// ─────────────────────────────────────────────────────────────────────────────
function StepAmount({ amount, setAmount }: { amount: number; setAmount: (v: number) => void }) {
    const presets = [50_000, 1_00_000, 5_00_000, 10_00_000, 25_00_000, 50_00_000];
    return (
        <div className="flex flex-col gap-6">
            <div className="text-center">
                <div className="font-dm-serif text-[32px] md:text-[40px] text-[var(--ba-text-primary)] mb-1">
                    How much do you want to invest?
                </div>
                <div className="text-[13px] text-[var(--ba-text-secondary)] font-dm-sans">
                    Set your lump-sum investment amount
                </div>
            </div>

            {/* Big Amount Display */}
            <div className="bg-[var(--ba-bg-secondary)] border border-[var(--ba-blue)]/[0.3] rounded-2xl px-6 py-8 text-center">
                <div className="text-[48px] md:text-[56px] font-jetbrains font-bold text-[var(--ba-blue)] leading-none mb-2">
                    {fmtAmt(amount)}
                </div>
                <div className="text-[12px] text-[var(--ba-text-muted)] font-dm-sans">
                    ₹{amount.toLocaleString('en-IN')}
                </div>
            </div>

            {/* Slider */}
            <div>
                <input
                    id="amount-slider"
                    type="range"
                    min={10_000}
                    max={1_00_00_000}
                    step={10_000}
                    value={amount}
                    onChange={e => setAmount(Number(e.target.value))}
                    className="w-full accent-[var(--ba-blue)]"
                    aria-label="Investment amount"
                />
                <div className="flex justify-between text-[10px] text-[var(--ba-text-muted)] font-dm-sans mt-1">
                    <span>₹10K</span><span>₹1 Cr</span>
                </div>
            </div>

            {/* Quick Select */}
            <div>
                <div className="text-[11px] text-[var(--ba-text-muted)] font-dm-sans mb-2 tracking-wide uppercase">Quick Select</div>
                <div className="flex flex-wrap gap-2">
                    {presets.map(p => (
                        <button
                            key={p}
                            type="button"
                            onClick={() => setAmount(p)}
                            className={[
                                'px-4 py-2 rounded-full border text-[12px] font-dm-sans cursor-pointer transition-colors',
                                amount === p
                                    ? 'border-[var(--ba-blue)] bg-[var(--ba-blue)]/[0.15] text-[var(--ba-blue)]'
                                    : 'border-[var(--ba-border)] bg-[var(--ba-bg-secondary)] text-[var(--ba-text-secondary)] hover:border-[var(--ba-border-hover)]',
                            ].join(' ')}
                        >
                            {fmtAmt(p)}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 2 — Horizon + Risk
// ─────────────────────────────────────────────────────────────────────────────
function StepHorizonRisk({
    years,
    setYears,
    risk,
    setRisk,
}: {
    years: number;
    setYears: (v: number) => void;
    risk: RiskProfile;
    setRisk: (v: RiskProfile) => void;
}) {
    const yearLabel = years === 1 ? '1 Year' : `${years} Years`;
    const horizonTag = years <= 3 ? 'Short-Term' : years <= 7 ? 'Medium-Term' : 'Long-Term';

    return (
        <div className="flex flex-col gap-8">
            <div className="text-center">
                <div className="font-dm-serif text-[32px] md:text-[40px] text-[var(--ba-text-primary)] mb-1">
                    Your Investment Profile
                </div>
                <div className="text-[13px] text-[var(--ba-text-secondary)] font-dm-sans">
                    Set your time horizon and risk appetite
                </div>
            </div>

            {/* Horizon */}
            <div className="bg-[var(--ba-bg-secondary)] border border-[var(--ba-border)] rounded-2xl px-5 py-5">
                <div className="flex items-center justify-between mb-4">
                    <div className="text-[13px] font-semibold text-[var(--ba-text-primary)] font-dm-sans">Investment Horizon</div>
                    <div className="flex items-center gap-2">
                        <span className="text-[20px] font-jetbrains font-bold text-[var(--ba-gold)]">{yearLabel}</span>
                        <span className="text-[10px] px-2 py-[2px] rounded bg-[var(--ba-gold)]/[0.15] text-[var(--ba-gold)] font-dm-sans border border-[var(--ba-gold)]/[0.3]">
                            {horizonTag}
                        </span>
                    </div>
                </div>
                <input
                    id="horizon-slider"
                    type="range"
                    min={1} max={30} step={1} value={years}
                    onChange={e => setYears(Number(e.target.value))}
                    className="w-full accent-[var(--ba-gold)]"
                    aria-label="Investment horizon"
                />
                <div className="flex justify-between text-[10px] text-[var(--ba-text-muted)] font-dm-sans mt-1">
                    <span>1 yr</span><span>5 yrs</span><span>10 yrs</span><span>20 yrs</span><span>30 yrs</span>
                </div>
            </div>

            {/* Risk Profile */}
            <div>
                <div className="text-[13px] font-semibold text-[var(--ba-text-primary)] font-dm-sans mb-3">
                    Risk Profile
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {RISK_PROFILES.map(p => (
                        <motion.button
                            key={p.id}
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setRisk(p.id)}
                            className={[
                                'flex flex-col items-start gap-2 rounded-2xl border p-4 cursor-pointer text-left transition-all',
                                risk === p.id
                                    ? 'border-current bg-current/[0.08]'
                                    : 'border-[var(--ba-border)] bg-[var(--ba-bg-secondary)] hover:border-[var(--ba-border-hover)]',
                            ].join(' ')}
                            style={risk === p.id ? { borderColor: p.color, color: p.color } as React.CSSProperties : {} as React.CSSProperties}
                        >
                            <div className="flex items-center gap-2 w-full">
                                <div
                                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                                    style={{ background: `${p.color}22` }}
                                >
                                    <span style={{ color: p.color }}>{p.icon}</span>
                                </div>
                                <span
                                    className="font-semibold text-[13px] font-dm-sans"
                                    style={{ color: risk === p.id ? p.color : 'var(--ba-text-primary)' }}
                                >
                                    {p.label}
                                </span>
                                {risk === p.id && (
                                    <CheckCircle2 size={14} className="ml-auto" style={{ color: p.color }} />
                                )}
                            </div>
                            <div className="text-[11px] text-[var(--ba-text-secondary)] font-dm-sans leading-[1.5]">{p.desc}</div>
                            <div
                                className="text-[12px] font-jetbrains font-semibold"
                                style={{ color: p.color }}
                            >
                                {p.returnRange}
                            </div>
                        </motion.button>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 3 — Results
// ─────────────────────────────────────────────────────────────────────────────
function StepResults({ rec }: { rec: InvestmentRecommendation }) {
    const riskMeta = RISK_PROFILES.find(p => p.id === rec.riskProfile)!;
    const stockSlice = rec.allocation.find(a => a.name === 'Direct Stocks')!;
    const mfSlice = rec.allocation.find(a => a.name === 'Mutual Funds')!;
    const govtBondSlice = rec.allocation.find(a => a.name === 'Govt Bonds')!;
    const corpBondSlice = rec.allocation.find(a => a.name === 'Corp Bonds')!;
    const etfSlice = rec.allocation.find(a => a.name === 'ETFs')!;
    const fdSlice = rec.allocation.find(a => a.name === 'Fixed Deposits');
    const goldSlice = rec.allocation.find(a => a.name === 'Gold');
    const silverSlice = rec.allocation.find(a => a.name === 'Silver');

    return (
        <div className="flex flex-col gap-5">
            {/* Header summary */}
            <div
                className="rounded-2xl px-5 py-4 border"
                style={{ background: `${riskMeta.color}11`, borderColor: `${riskMeta.color}33` }}
            >
                <div className="flex items-start gap-3">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-[22px] shrink-0"
                        style={{ background: `${riskMeta.color}22` }}
                    >
                        {riskMeta.icon}
                    </div>
                    <div>
                        <div className="font-dm-serif text-[20px] text-[var(--ba-text-primary)] mb-0.5">
                            Your Personalised Plan
                        </div>
                        <div className="text-[12px] text-[var(--ba-text-secondary)] font-dm-sans leading-[1.6]">
                            {rec.summary}
                        </div>
                    </div>
                </div>

                {/* Key metrics */}
                <div className="grid grid-cols-3 gap-3 mt-4">
                    {[
                        { label: 'Total Investment', value: fmtAmt(rec.amount), color: 'var(--ba-text-primary)' },
                        { label: 'Expected CAGR', value: `${rec.expectedReturnRange.min}–${rec.expectedReturnRange.max}%`, color: '#00C896' },
                        { label: 'Horizon', value: `${rec.horizonYears} Yr${rec.horizonYears > 1 ? 's' : ''}`, color: 'var(--ba-gold)' },
                    ].map(m => (
                        <div key={m.label} className="bg-[var(--ba-bg-tertiary)] rounded-[10px] px-3 py-2.5 text-center border border-[var(--ba-border)]">
                            <div className="text-[10px] text-[var(--ba-text-muted)] font-dm-sans mb-0.5">{m.label}</div>
                            <div className="font-jetbrains font-bold text-[15px]" style={{ color: m.color }}>{m.value}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Donut + legend */}
            <div className="bg-[var(--ba-bg-secondary)] border border-[var(--ba-border)] rounded-2xl px-5 py-5">
                <div className="text-[13px] font-semibold text-[var(--ba-text-primary)] font-dm-sans mb-4">
                    Portfolio Allocation
                </div>
                <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="w-full md:w-[220px] h-[220px] shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={rec.allocation}
                                    dataKey="pct"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={65}
                                    outerRadius={100}
                                    paddingAngle={2}
                                >
                                    {rec.allocation.map((entry, i) => (
                                        <Cell key={i} fill={entry.color} stroke="transparent" />
                                    ))}
                                </Pie>
                                <Tooltip content={<DonutTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex-1 flex flex-col gap-2 w-full">
                        {rec.allocation.map(slice => (
                            <div key={slice.name} className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: slice.color }} />
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        <span className="text-[12px] text-[var(--ba-text-secondary)] font-dm-sans truncate">{slice.icon} {slice.name}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <span className="font-jetbrains text-[11px] text-[var(--ba-text-muted)]">{fmtAmt(slice.amount)}</span>
                                    <span
                                        className="font-jetbrains text-[13px] font-bold w-8 text-right"
                                        style={{ color: slice.color }}
                                    >
                                        {slice.pct}%
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Asset Cards */}
            <div className="flex flex-col gap-3">

                {/* Direct Stocks */}
                {stockSlice && (
                    <AssetCard slice={stockSlice} defaultOpen={rec.riskProfile === 'Aggressive'}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {rec.recommendedStocks.map(s => (
                                <div
                                    key={s.symbol}
                                    className="bg-[var(--ba-bg-tertiary)] rounded-[10px] px-3 py-2.5 border border-[var(--ba-border)] flex items-start gap-2"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-[var(--ba-blue)]/[0.15] border border-[var(--ba-blue)]/[0.25] flex items-center justify-center shrink-0">
                                        <span className="text-[10px] font-bold font-jetbrains text-[var(--ba-blue)]">
                                            {s.symbol.slice(0, 2)}
                                        </span>
                                    </div>
                                    <div>
                                        <div className="text-[12px] font-semibold text-[var(--ba-text-primary)] font-dm-sans">{s.symbol}</div>
                                        <div className="text-[10px] text-[var(--ba-text-muted)] font-dm-sans">{s.sector}</div>
                                        <div className="text-[10px] text-[var(--ba-green)] font-jetbrains">BA: {s.bharatAlphaScore}</div>
                                    </div>
                                    <div className={[
                                        'ml-auto text-[9px] px-1.5 py-0.5 rounded font-dm-sans font-semibold',
                                        s.signal === 'BUY' ? 'bg-[var(--ba-green)]/[0.15] text-[var(--ba-green)]' :
                                            s.signal === 'SELL' ? 'bg-[var(--ba-red)]/[0.15] text-[var(--ba-red)]' :
                                                'bg-[var(--ba-gold)]/[0.15] text-[var(--ba-gold)]',
                                    ].join(' ')}>{s.signal}</div>
                                </div>
                            ))}
                        </div>
                    </AssetCard>
                )}

                {/* Mutual Funds */}
                {mfSlice && (
                    <AssetCard slice={mfSlice}>
                        <div className="flex flex-col gap-2">
                            {rec.recommendedMFs.map(f => (
                                <div
                                    key={f.id}
                                    className="bg-[var(--ba-bg-tertiary)] rounded-[10px] px-3 py-2.5 border border-[var(--ba-border)] flex items-center gap-3"
                                >
                                    <div
                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 font-dm-serif"
                                        style={{ background: `${f.color}22`, color: f.color, border: `1px solid ${f.color}44` }}
                                    >
                                        {f.amc[0]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[12px] font-semibold text-[var(--ba-text-primary)] font-dm-sans truncate">{f.name}</div>
                                        <div className="text-[10px] text-[var(--ba-text-muted)] font-dm-sans">{f.category} · {f.riskLevel}</div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="text-[10px] text-[var(--ba-text-muted)] font-dm-sans">5Y CAGR</div>
                                        <div className="text-[13px] font-jetbrains font-bold text-[var(--ba-green)]">{f.returns5Y}%</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </AssetCard>
                )}

                {/* Govt Bonds */}
                {govtBondSlice && (
                    <AssetCard slice={govtBondSlice}>
                        <div className="flex flex-col gap-2">
                            {rec.recommendedGovtBonds.map(b => (
                                <div
                                    key={b.id}
                                    className="bg-[var(--ba-bg-tertiary)] rounded-[10px] px-3 py-2.5 border border-[var(--ba-border)] flex items-center gap-3"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-[#06B6D4]/[0.15] border border-[#06B6D4]/[0.25] flex items-center justify-center shrink-0">
                                        <Landmark size={14} className="text-[#06B6D4]" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[12px] font-semibold text-[var(--ba-text-primary)] font-dm-sans truncate">{b.name}</div>
                                        <div className="text-[10px] text-[var(--ba-text-muted)] font-dm-sans">{b.issuer} · {b.type} · Min ₹{b.minInvestment.toLocaleString('en-IN')}</div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="text-[10px] text-[var(--ba-text-muted)] font-dm-sans">YTM</div>
                                        <div className="text-[13px] font-jetbrains font-bold text-[#06B6D4]">{b.yieldToMaturity}%</div>
                                    </div>
                                    <div className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--ba-green)]/[0.1] text-[var(--ba-green)] font-dm-sans shrink-0">
                                        {b.creditRating}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </AssetCard>
                )}

                {/* Corp Bonds */}
                {corpBondSlice && (
                    <AssetCard slice={corpBondSlice}>
                        <div className="flex flex-col gap-2">
                            {rec.recommendedCorpBonds.map(b => (
                                <div
                                    key={b.id}
                                    className="bg-[var(--ba-bg-tertiary)] rounded-[10px] px-3 py-2.5 border border-[var(--ba-border)] flex items-center gap-3"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-[#8B5CF6]/[0.15] border border-[#8B5CF6]/[0.25] flex items-center justify-center shrink-0">
                                        <Building2 size={14} className="text-[#8B5CF6]" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[12px] font-semibold text-[var(--ba-text-primary)] font-dm-sans truncate">{b.name}</div>
                                        <div className="text-[10px] text-[var(--ba-text-muted)] font-dm-sans">{b.issuer} · {b.sector}</div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="text-[10px] text-[var(--ba-text-muted)] font-dm-sans">YTM</div>
                                        <div className="text-[13px] font-jetbrains font-bold text-[#8B5CF6]">{b.yieldToMaturity}%</div>
                                    </div>
                                    <div className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--ba-green)]/[0.1] text-[var(--ba-green)] font-dm-sans shrink-0">
                                        {b.creditRating}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </AssetCard>
                )}

                {/* ETFs */}
                {etfSlice && (
                    <AssetCard slice={etfSlice}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {rec.recommendedETFs.map(e => (
                                <div
                                    key={e.id}
                                    className="bg-[var(--ba-bg-tertiary)] rounded-[10px] px-3 py-2.5 border border-[var(--ba-border)] flex items-center gap-3"
                                >
                                    <div
                                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-bold font-jetbrains"
                                        style={{ background: `${e.color}22`, color: e.color, border: `1px solid ${e.color}44` }}
                                    >
                                        {e.symbol.slice(0, 3)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[12px] font-semibold text-[var(--ba-text-primary)] font-dm-sans truncate">{e.name}</div>
                                        <div className="text-[10px] text-[var(--ba-text-muted)] font-dm-sans">{e.category} · ER {e.expenseRatio}%</div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="text-[10px] text-[var(--ba-text-muted)] font-dm-sans">1Y</div>
                                        <div className="text-[13px] font-jetbrains font-bold text-[var(--ba-green)]">{e.returns1Y}%</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </AssetCard>
                )}

                {/* Fixed Deposits */}
                {fdSlice && rec.recommendedFDs.length > 0 && (
                    <AssetCard slice={fdSlice}>
                        <div className="flex flex-col gap-2">
                            {rec.recommendedFDs.map(fd => {
                                const best = fd.tenureOptions.reduce((a, b) => a.rate > b.rate ? a : b);
                                return (
                                    <div
                                        key={fd.id}
                                        className="bg-[var(--ba-bg-tertiary)] rounded-[10px] px-3 py-2.5 border border-[var(--ba-border)] flex items-center gap-3"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-[#10B981]/[0.15] border border-[#10B981]/[0.25] flex items-center justify-center shrink-0">
                                            <Lock size={13} className="text-[#10B981]" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[12px] font-semibold text-[var(--ba-text-primary)] font-dm-sans">{fd.bankName}</div>
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <span className={[
                                                    'text-[9px] px-1.5 py-0.5 rounded font-dm-sans',
                                                    fd.bankType === 'Public Sector' ? 'bg-[var(--ba-blue)]/[0.1] text-[var(--ba-blue)]' :
                                                        fd.bankType === 'Private Sector' ? 'bg-[var(--ba-green)]/[0.1] text-[var(--ba-green)]' :
                                                            fd.bankType === 'Small Finance' ? 'bg-[var(--ba-gold)]/[0.1] text-[var(--ba-gold)]' :
                                                                'bg-[#8B5CF6]/[0.1] text-[#8B5CF6]',
                                                ].join(' ')}>{fd.bankType}</span>
                                                {fd.insuranceCover > 0 && (
                                                    <span className="text-[9px] text-[var(--ba-text-muted)] font-dm-sans">DICGC ₹5L</span>
                                                )}
                                                {fd.creditRating && (
                                                    <span className="text-[9px] text-[var(--ba-green)] font-dm-sans">{fd.creditRating}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <div className="text-[10px] text-[var(--ba-text-muted)] font-dm-sans">Best Rate</div>
                                            <div className="text-[13px] font-jetbrains font-bold text-[#10B981]">{best.rate}% p.a.</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="mt-3 text-[10px] text-[var(--ba-text-muted)] font-dm-sans flex items-center gap-1.5">
                            <Info size={10} />
                            Senior citizens get 0.25–0.50% additional interest. Rates subject to change.
                        </div>
                    </AssetCard>
                )}

                {/* Gold */}
                {goldSlice && goldSlice.amount > 0 && (
                    <AssetCard slice={{ ...goldSlice, color: '#F59E0B' }}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {[
                                { name: 'Sovereign Gold Bond (SGB)', issuer: 'RBI', rate: '2.5% p.a. + price appreciation', note: 'Tax-free on maturity if held 8 yrs', color: '#F59E0B' },
                                { name: 'Gold ETF (HDFCMFGETF)', issuer: 'HDFC MF', rate: '99.5% pure gold', note: 'High liquidity, demat form', color: '#F59E0B' },
                            ].map(g => (
                                <div key={g.name} className="bg-[var(--ba-bg-tertiary)] rounded-[10px] px-3 py-2.5 border border-[#F59E0B]/[0.3]">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[16px]">🪙</span>
                                        <div>
                                            <div className="text-[12px] font-semibold text-[var(--ba-text-primary)] font-dm-sans">{g.name}</div>
                                            <div className="text-[10px] text-[var(--ba-text-muted)] font-dm-sans">{g.issuer}</div>
                                        </div>
                                    </div>
                                    <div className="text-[11px] text-[#F59E0B] font-jetbrains">{g.rate}</div>
                                    <div className="text-[10px] text-[var(--ba-text-muted)] font-dm-sans mt-0.5">{g.note}</div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-3 bg-[#F59E0B]/[0.08] rounded-[8px] px-3 py-2 text-[11px] text-[var(--ba-text-secondary)] font-dm-sans">
                            Recommended Gold Allocation: <span className="font-jetbrains text-[#F59E0B] font-bold">{fmtAmt(rec.goldAmount)}</span> · ~{goldSlice.pct}% of portfolio
                        </div>
                    </AssetCard>
                )}

                {/* Silver */}
                {silverSlice && silverSlice.amount > 0 && (
                    <AssetCard slice={{ ...silverSlice, color: '#94A3B8' }}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {[
                                { name: 'Mirae Asset Silver ETF', symbol: 'SILVERETF', note: 'Tracks domestic silver price', expenseRatio: '0.50%' },
                                { name: 'ICICI Pru Silver ETF', symbol: 'SILVERIETF', note: 'Physical silver backed', expenseRatio: '0.40%' },
                            ].map(s => (
                                <div key={s.name} className="bg-[var(--ba-bg-tertiary)] rounded-[10px] px-3 py-2.5 border border-[#94A3B8]/[0.3]">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[16px]">🥈</span>
                                        <div>
                                            <div className="text-[12px] font-semibold text-[var(--ba-text-primary)] font-dm-sans">{s.name}</div>
                                            <div className="text-[10px] text-[94A3B8] font-jetbrains">{s.symbol}</div>
                                        </div>
                                    </div>
                                    <div className="text-[10px] text-[var(--ba-text-muted)] font-dm-sans">{s.note}</div>
                                    <div className="text-[10px] text-[#94A3B8] font-dm-sans mt-0.5">Expense Ratio: {s.expenseRatio}</div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-3 bg-[#94A3B8]/[0.08] rounded-[8px] px-3 py-2 text-[11px] text-[var(--ba-text-secondary)] font-dm-sans">
                            Recommended Silver Allocation: <span className="font-jetbrains text-[#94A3B8] font-bold">{fmtAmt(rec.silverAmount)}</span> · ~{silverSlice.pct}% of portfolio
                        </div>
                    </AssetCard>
                )}
            </div>

            {/* SEBI Disclaimer */}
            <div className="bg-[var(--ba-gold)]/[0.08] border border-[var(--ba-gold)]/[0.2] rounded-[10px] px-4 py-[10px] flex items-start gap-2">
                <AlertCircle size={13} className="shrink-0 mt-[1px] text-[var(--ba-gold)]" />
                <div className="text-[10px] text-[var(--ba-text-secondary)] font-dm-sans leading-[1.6]">
                    This recommendation is for educational purposes only and is not financial advice. Past performance is not indicative of future results.
                    Always consult a SEBI-registered investment advisor before investing. Mutual fund investments are subject to market risks.
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
const STEPS = ['Amount', 'Profile', 'Your Plan'] as const;

export default function InvestmentAdvisor() {
    const [step, setStep] = useState(0);
    const [amount, setAmount] = useState(5_00_000);
    const [years, setYears] = useState(7);
    const [risk, setRisk] = useState<RiskProfile>('Moderate');

    const recommendation = useMemo(() => {
        if (step < 2) return null;
        return getInvestmentRecommendation(amount, years, risk);
    }, [step, amount, years, risk]);

    const handleNext = useCallback(() => {
        setStep(s => Math.min(s + 1, 2));
    }, []);

    const handleBack = useCallback(() => {
        setStep(s => Math.max(s - 1, 0));
    }, []);

    const handleReset = useCallback(() => {
        setStep(0);
        setAmount(5_00_000);
        setYears(7);
        setRisk('Moderate');
    }, []);

    const riskMeta = RISK_PROFILES.find(p => p.id === risk)!;

    return (
        <div className="text-[var(--ba-text-primary)] flex flex-col gap-5 max-w-4xl mx-auto">

            {/* Page Header */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="font-dm-serif text-[28px] text-[var(--ba-text-primary)] m-0 mb-0.5 flex items-center gap-2">
                        <Sparkles size={24} className="text-[var(--ba-gold)]" />
                        Investment Advisor
                    </h1>
                    <p className="text-[13px] text-[var(--ba-text-secondary)] m-0 font-dm-sans">
                        AI-powered portfolio recommendations across all asset classes
                    </p>
                </div>

                {step === 2 && (
                    <button
                        type="button"
                        onClick={handleReset}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--ba-border)] text-[12px] font-dm-sans text-[var(--ba-text-secondary)] hover:border-[var(--ba-border-hover)] hover:text-[var(--ba-text-primary)] transition-colors cursor-pointer bg-[var(--ba-bg-secondary)]"
                    >
                        <ChevronLeft size={14} />
                        Start Over
                    </button>
                )}
            </div>

            {/* Step Indicator */}
            <div className="flex items-center gap-0">
                {STEPS.map((label, i) => (
                    <React.Fragment key={label}>
                        <div className="flex items-center gap-2">
                            <div
                                className={[
                                    'w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold font-jetbrains transition-all',
                                    i < step ? 'bg-[var(--ba-green)] text-white' :
                                        i === step ? 'bg-[var(--ba-blue)] text-white' :
                                            'bg-[var(--ba-bg-tertiary)] text-[var(--ba-text-muted)] border border-[var(--ba-border)]',
                                ].join(' ')}
                            >
                                {i < step ? <CheckCircle2 size={14} /> : i + 1}
                            </div>
                            <span
                                className={[
                                    'text-[12px] font-dm-sans hidden sm:block',
                                    i === step ? 'text-[var(--ba-text-primary)] font-semibold' : 'text-[var(--ba-text-muted)]',
                                ].join(' ')}
                            >
                                {label}
                            </span>
                        </div>
                        {i < STEPS.length - 1 && (
                            <div className={['flex-1 h-[1px] mx-2', i < step ? 'bg-[var(--ba-green)]' : 'bg-[var(--ba-border)]'].join(' ')} />
                        )}
                    </React.Fragment>
                ))}
            </div>

            {/* Step Content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                >
                    {step === 0 && <StepAmount amount={amount} setAmount={setAmount} />}
                    {step === 1 && <StepHorizonRisk years={years} setYears={setYears} risk={risk} setRisk={setRisk} />}
                    {step === 2 && recommendation && <StepResults rec={recommendation} />}
                </motion.div>
            </AnimatePresence>

            {/* Navigation Buttons */}
            {step < 2 && (
                <div className="flex justify-between items-center">
                    <button
                        type="button"
                        onClick={handleBack}
                        disabled={step === 0}
                        className={[
                            'flex items-center gap-2 px-5 py-2.5 rounded-xl border text-[13px] font-dm-sans font-semibold transition-colors',
                            step === 0
                                ? 'opacity-30 cursor-not-allowed border-[var(--ba-border)] text-[var(--ba-text-muted)]'
                                : 'border-[var(--ba-border)] text-[var(--ba-text-secondary)] hover:border-[var(--ba-border-hover)] cursor-pointer bg-[var(--ba-bg-secondary)]',
                        ].join(' ')}
                    >
                        <ChevronLeft size={16} />
                        Back
                    </button>

                    <div className="flex items-center gap-4">
                        {step === 1 && (
                            <div className="text-[12px] text-[var(--ba-text-muted)] font-dm-sans hidden sm:flex items-center gap-1.5">
                                <span className="text-[16px]">{riskMeta.icon}</span>
                                <span style={{ color: riskMeta.color }}>{risk}</span>
                                · {years} yr{years > 1 ? 's' : ''} · {fmtAmt(amount)}
                            </div>
                        )}
                        <motion.button
                            type="button"
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={handleNext}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[var(--ba-blue)] text-white border-0 text-[13px] font-dm-sans font-semibold cursor-pointer shadow-lg shadow-[var(--ba-blue)]/[0.3]"
                        >
                            {step === 0 ? 'Next: Profile' : 'Get My Plan'}
                            {step === 1 ? <Sparkles size={15} /> : <ChevronRight size={16} />}
                        </motion.button>
                    </div>
                </div>
            )}
        </div>
    );
}
