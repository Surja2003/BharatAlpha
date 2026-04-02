import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { BarChart2, ChevronRight, Filter, Search, TrendingDown, TrendingUp, Zap } from 'lucide-react';
import { etfs, type ETF } from '../data/mockData';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const CATEGORIES = ['All', 'Equity', 'Gold', 'Silver', 'Sectoral', 'Debt', 'International'];

const CATEGORY_COLORS: Record<string, string> = {
    Equity: '#3B82F6',
    Gold: '#F59E0B',
    Silver: '#94A3B8',
    Sectoral: '#8B5CF6',
    Debt: '#10B981',
    International: '#06B6D4',
};

function getBadgeColor(cat: string) {
    return CATEGORY_COLORS[cat] ?? '#3B82F6';
}

function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={[
                'px-3 py-1.5 rounded-full text-[11px] font-semibold font-dm-sans border transition-all cursor-pointer whitespace-nowrap',
                active
                    ? 'bg-[var(--ba-blue)] border-[var(--ba-blue)] text-white'
                    : 'bg-[var(--ba-bg-secondary)] border-[var(--ba-border)] text-[var(--ba-text-secondary)] hover:border-[var(--ba-border-hover)]',
            ].join(' ')}
        >
            {label}
        </button>
    );
}

function ETFCard({ etf }: { etf: ETF }) {
    const color = getBadgeColor(etf.category);
    const ret1Y = etf.returns1Y ?? 0;
    const isPos = ret1Y >= 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[var(--ba-bg-secondary)] border border-[var(--ba-border)] rounded-2xl p-5 flex flex-col gap-4 hover:border-[var(--ba-border-hover)] transition-colors"
        >
            {/* Header */}
            <div className="flex items-start gap-3">
                <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-[11px] font-bold font-jetbrains shrink-0"
                    style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}
                >
                    {etf.symbol.slice(0, 3)}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-[var(--ba-text-primary)] font-dm-sans leading-[1.3] mb-0.5">{etf.name}</div>
                    <div className="text-[10px] font-jetbrains text-[var(--ba-text-muted)]">{etf.symbol}</div>
                </div>
                <div
                    className="text-[10px] px-2 py-0.5 rounded-full font-dm-sans font-semibold shrink-0"
                    style={{ background: `${color}18`, color }}
                >
                    {etf.category}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-2">
                {[
                    { label: '1Y Return', value: `${ret1Y > 0 ? '+' : ''}${ret1Y}%`, positive: isPos },
                    { label: 'Expense Ratio', value: `${etf.expenseRatio}%`, positive: null },
                    { label: 'AUM', value: etf.aum ? `₹${(etf.aum / 100).toFixed(0)}Cr` : '—', positive: null },
                ].map(s => (
                    <div key={s.label} className="bg-[var(--ba-bg-tertiary)] rounded-[10px] px-2.5 py-2 text-center border border-[var(--ba-border)]">
                        <div className="text-[9px] text-[var(--ba-text-muted)] font-dm-sans mb-0.5">{s.label}</div>
                        <div
                            className="text-[13px] font-jetbrains font-bold"
                            style={{
                                color: s.positive === null ? 'var(--ba-text-primary)' : s.positive ? 'var(--ba-green)' : 'var(--ba-red)',
                            }}
                        >
                            {s.value}
                        </div>
                    </div>
                ))}
            </div>

            {/* Bottom row */}
            <div className="flex items-center justify-between border-t border-[var(--ba-border)] pt-3">
                <div className="flex items-center gap-3 flex-wrap">
                    {etf.niftyCorrelation != null && (
                        <div className="text-[10px] text-[var(--ba-text-muted)] font-dm-sans">
                            Nifty corr: <span className="text-[var(--ba-text-secondary)] font-semibold">{etf.niftyCorrelation}</span>
                        </div>
                    )}
                    {etf.trackingError != null && (
                        <div className="text-[10px] text-[var(--ba-text-muted)] font-dm-sans">
                            Track error: <span className="text-[var(--ba-text-secondary)] font-semibold">{etf.trackingError}%</span>
                        </div>
                    )}
                </div>
                {etf.nse && (
                    <a
                        href={`https://www.nseindia.com/get-quotes/equity?symbol=${etf.symbol}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[10px] text-[var(--ba-blue)] font-dm-sans hover:underline"
                    >
                        NSE <ChevronRight size={10} />
                    </a>
                )}
            </div>
        </motion.div>
    );
}

export default function ETFs() {
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('All');
    const [sort, setSort] = useState<'returns1Y' | 'expenseRatio' | 'aum'>('returns1Y');

    const filtered = useMemo(() => {
        return etfs
            .filter(e => {
                const q = search.toLowerCase();
                const matchSearch = !q || e.name.toLowerCase().includes(q) || e.symbol.toLowerCase().includes(q) || e.category.toLowerCase().includes(q);
                const matchCat = category === 'All' || e.category === category;
                return matchSearch && matchCat;
            })
            .sort((a, b) => {
                if (sort === 'expenseRatio') return (a.expenseRatio ?? 99) - (b.expenseRatio ?? 99);
                if (sort === 'aum') return (b.aum ?? 0) - (a.aum ?? 0);
                return (b.returns1Y ?? 0) - (a.returns1Y ?? 0);
            });
    }, [search, category, sort]);

    const topETF = [...etfs].sort((a, b) => (b.returns1Y ?? 0) - (a.returns1Y ?? 0))[0];

    return (
        <div className="flex flex-col gap-5 max-w-5xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="font-dm-serif text-[28px] text-[var(--ba-text-primary)] m-0 mb-0.5 flex items-center gap-2">
                    <Zap size={22} className="text-[var(--ba-gold)]" />
                    ETF Explorer
                </h1>
                <p className="text-[13px] text-[var(--ba-text-secondary)] m-0 font-dm-sans">
                    Exchange-Traded Funds — trade like stocks, diversify like mutual funds
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: 'Total ETFs', value: etfs.length, icon: <BarChart2 size={16} />, color: '#3B82F6' },
                    { label: 'Best 1Y Return', value: `+${topETF?.returns1Y}%`, icon: <TrendingUp size={16} />, color: '#00C896' },
                    { label: 'Lowest Expense', value: `${Math.min(...etfs.map(e => e.expenseRatio))}%`, icon: <Filter size={16} />, color: '#F59E0B' },
                    { label: 'Categories', value: CATEGORIES.length - 1, icon: <Zap size={16} />, color: '#8B5CF6' },
                ].map(c => (
                    <div key={c.label} className="bg-[var(--ba-bg-secondary)] border border-[var(--ba-border)] rounded-2xl p-4 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${c.color}20`, color: c.color }}>
                            {c.icon}
                        </div>
                        <div>
                            <div className="text-[10px] text-[var(--ba-text-muted)] font-dm-sans">{c.label}</div>
                            <div className="text-[18px] font-jetbrains font-bold" style={{ color: c.color }}>{c.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* What is an ETF — beginner callout */}
            <div className="bg-[var(--ba-blue)]/[0.08] border border-[var(--ba-blue)]/[0.2] rounded-2xl px-5 py-4">
                <div className="text-[13px] font-semibold text-[var(--ba-blue)] font-dm-sans mb-1">💡 New to ETFs?</div>
                <div className="text-[12px] text-[var(--ba-text-secondary)] font-dm-sans leading-[1.7]">
                    An <strong className="text-[var(--ba-text-primary)]">ETF (Exchange-Traded Fund)</strong> is a basket of securities (stocks, bonds, or commodities) that trades on the stock exchange like a single share.
                    You get <strong className="text-[var(--ba-text-primary)]">instant diversification</strong> with very low expense ratios, perfect for long-term passive investing.
                    You can start with as little as the price of 1 unit (often ₹10–₹200).
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ba-text-muted)]" />
                    <input
                        type="text"
                        placeholder="Search ETFs by name or symbol…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full bg-[var(--ba-bg-secondary)] border border-[var(--ba-border)] rounded-xl pl-9 pr-4 py-2.5 text-[12px] font-dm-sans text-[var(--ba-text-primary)] placeholder:text-[var(--ba-text-muted)] outline-none focus:border-[var(--ba-blue)]"
                    />
                </div>
                <select
                    value={sort}
                    onChange={e => setSort(e.target.value as typeof sort)}
                    className="bg-[var(--ba-bg-secondary)] border border-[var(--ba-border)] rounded-xl px-4 py-2.5 text-[12px] font-dm-sans text-[var(--ba-text-secondary)] outline-none cursor-pointer"
                >
                    <option value="returns1Y">Sort: Best 1Y Return</option>
                    <option value="expenseRatio">Sort: Lowest Expense</option>
                    <option value="aum">Sort: Largest AUM</option>
                </select>
            </div>

            {/* Category Pills */}
            <div className="flex gap-2 flex-wrap">
                {CATEGORIES.map(c => (
                    <Pill key={c} label={c} active={category === c} onClick={() => setCategory(c)} />
                ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map(etf => (
                    <ETFCard key={etf.id} etf={etf} />
                ))}
                {filtered.length === 0 && (
                    <div className="col-span-3 text-center py-16 text-[var(--ba-text-muted)] font-dm-sans text-[13px]">
                        No ETFs match your search.
                    </div>
                )}
            </div>

            {/* Disclaimer */}
            <div className="text-[10px] text-[var(--ba-text-muted)] font-dm-sans text-center pb-2">
                Returns shown are indicative and for educational purposes only. ETF investments are subject to market risks. Past performance is not a guarantee of future results.
            </div>
        </div>
    );
}
