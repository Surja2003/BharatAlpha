import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { ChevronRight, Landmark, Search, Shield, TrendingUp } from 'lucide-react';
import { governmentBonds, type GovernmentBond } from '../data/mockData';

const BOND_TYPES = ['All', 'G-Sec', 'T-Bill', 'SDL', 'Savings Bond', 'SGB'];
const TYPE_COLORS: Record<string, string> = {
    'G-Sec': '#3B82F6', 'T-Bill': '#06B6D4', 'SDL': '#8B5CF6',
    'Savings Bond': '#10B981', 'SGB': '#F59E0B',
};
function getTypeColor(t: string) { return TYPE_COLORS[t] ?? '#3B82F6'; }

function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
    return (
        <button type="button" onClick={onClick}
            className={['px-3 py-1.5 rounded-full text-[11px] font-semibold font-dm-sans border transition-all cursor-pointer whitespace-nowrap',
                active ? 'bg-[var(--ba-blue)] border-[var(--ba-blue)] text-white'
                    : 'bg-[var(--ba-bg-secondary)] border-[var(--ba-border)] text-[var(--ba-text-secondary)] hover:border-[var(--ba-border-hover)]'].join(' ')}
        >{label}</button>
    );
}

function BondCard({ bond }: { bond: GovernmentBond }) {
    const color = getTypeColor(bond.type);
    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-[var(--ba-bg-secondary)] border border-[var(--ba-border)] rounded-2xl p-5 flex flex-col gap-4 hover:border-[var(--ba-border-hover)] transition-colors">
            <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${color}20`, border: `1px solid ${color}40` }}>
                    <Landmark size={18} style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-[var(--ba-text-primary)] font-dm-sans leading-[1.3] mb-0.5">{bond.name}</div>
                    <div className="text-[10px] text-[var(--ba-text-muted)] font-dm-sans">{bond.issuer}</div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                    <div className="text-[10px] px-2 py-0.5 rounded-full font-dm-sans font-semibold" style={{ background: `${color}18`, color }}>{bond.type}</div>
                    <div className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--ba-green)]/[0.1] text-[var(--ba-green)] font-dm-sans">{bond.creditRating}</div>
                </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
                {[
                    { label: 'YTM', value: `${bond.yieldToMaturity}%`, color: '#00C896' },
                    { label: 'Coupon', value: bond.couponRate > 0 ? `${bond.couponRate}%` : 'Zero', color: 'var(--ba-text-primary)' },
                    { label: 'Min Invest', value: `₹${bond.minInvestment.toLocaleString('en-IN')}`, color: 'var(--ba-text-primary)' },
                ].map(s => (
                    <div key={s.label} className="bg-[var(--ba-bg-tertiary)] rounded-[10px] px-2.5 py-2 text-center border border-[var(--ba-border)]">
                        <div className="text-[9px] text-[var(--ba-text-muted)] font-dm-sans mb-0.5">{s.label}</div>
                        <div className="text-[12px] font-jetbrains font-bold" style={{ color: s.color }}>{s.value}</div>
                    </div>
                ))}
            </div>
            {bond.taxBenefit && (
                <div className="text-[10px] bg-[var(--ba-green)]/[0.1] text-[var(--ba-green)] px-2 py-0.5 rounded-full w-fit font-dm-sans">{bond.taxBenefit}</div>
            )}
            <div className="border-t border-[var(--ba-border)] pt-3 flex items-center justify-between">
                <div className="text-[10px] text-[var(--ba-text-muted)] font-dm-sans">
                    Interest: <span className="text-[var(--ba-text-secondary)]">{bond.interestFrequency ?? 'At maturity'}</span>
                </div>
                <a href="https://rbi.org.in" target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[10px] text-[var(--ba-blue)] font-dm-sans hover:underline">
                    RBI Portal <ChevronRight size={10} />
                </a>
            </div>
        </motion.div>
    );
}

export default function GovernmentBonds() {
    const [search, setSearch] = useState('');
    const [bondType, setBondType] = useState('All');
    const [sort, setSort] = useState<'ytm' | 'coupon' | 'minInvestment'>('ytm');

    const filtered = useMemo(() => governmentBonds
        .filter(b => {
            const q = search.toLowerCase();
            return (!q || b.name.toLowerCase().includes(q) || b.issuer.toLowerCase().includes(q)) &&
                (bondType === 'All' || b.type === bondType);
        })
        .sort((a, b) => sort === 'coupon' ? b.couponRate - a.couponRate
            : sort === 'minInvestment' ? a.minInvestment - b.minInvestment
                : b.yieldToMaturity - a.yieldToMaturity),
        [search, bondType, sort]);

    const avgYTM = (governmentBonds.reduce((s, b) => s + b.yieldToMaturity, 0) / governmentBonds.length).toFixed(2);

    return (
        <div className="flex flex-col gap-5 max-w-5xl mx-auto">
            <div>
                <h1 className="font-dm-serif text-[28px] text-[var(--ba-text-primary)] m-0 mb-0.5 flex items-center gap-2">
                    <Landmark size={22} className="text-[#06B6D4]" /> Government Bonds
                </h1>
                <p className="text-[13px] text-[var(--ba-text-secondary)] m-0 font-dm-sans">Sovereign-backed, zero credit risk — the safest investments in India</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: 'Bonds Listed', value: governmentBonds.length, color: '#06B6D4', icon: <Landmark size={16} /> },
                    { label: 'Avg YTM', value: `${avgYTM}%`, color: '#00C896', icon: <TrendingUp size={16} /> },
                    { label: 'Credit Risk', value: 'Zero', color: '#10B981', icon: <Shield size={16} /> },
                    { label: 'Bond Types', value: BOND_TYPES.length - 1, color: '#8B5CF6', icon: <Landmark size={16} /> },
                ].map(c => (
                    <div key={c.label} className="bg-[var(--ba-bg-secondary)] border border-[var(--ba-border)] rounded-2xl p-4 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${c.color}20`, color: c.color }}>{c.icon}</div>
                        <div>
                            <div className="text-[10px] text-[var(--ba-text-muted)] font-dm-sans">{c.label}</div>
                            <div className="text-[18px] font-jetbrains font-bold" style={{ color: c.color }}>{c.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-[#06B6D4]/[0.07] border border-[#06B6D4]/[0.2] rounded-2xl px-5 py-4">
                    <div className="text-[13px] font-semibold text-[#06B6D4] font-dm-sans mb-2">📘 What are Government Bonds?</div>
                    <div className="text-[12px] text-[var(--ba-text-secondary)] font-dm-sans leading-[1.7]">
                        Government of India borrows from the public by issuing bonds. You receive a <strong className="text-[var(--ba-text-primary)]">fixed coupon</strong> periodically and your full principal at maturity. Backed by the sovereign — <strong className="text-[var(--ba-text-primary)]">zero default risk</strong>.
                    </div>
                </div>
                <div className="bg-[var(--ba-green)]/[0.07] border border-[var(--ba-green)]/[0.2] rounded-2xl px-5 py-4">
                    <div className="text-[13px] font-semibold text-[var(--ba-green)] font-dm-sans mb-2">🏦 How to Buy?</div>
                    <ul className="text-[12px] text-[var(--ba-text-secondary)] font-dm-sans space-y-1 leading-[1.6]">
                        <li>• <strong className="text-[var(--ba-text-primary)]">RBI Retail Direct</strong> — direct.rbi.org.in (zero commission)</li>
                        <li>• <strong className="text-[var(--ba-text-primary)]">Stock Broker</strong> — buy G-Sec/SDL on NSE like a stock</li>
                        <li>• <strong className="text-[var(--ba-text-primary)]">Your demat account</strong> — IIFL, Zerodha, Groww etc.</li>
                        <li>• <strong className="text-[var(--ba-text-primary)]">Gilt Mutual Funds</strong> — SIP route for small investors</li>
                    </ul>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ba-text-muted)]" />
                    <input type="text" placeholder="Search bonds…" value={search} onChange={e => setSearch(e.target.value)}
                        className="w-full bg-[var(--ba-bg-secondary)] border border-[var(--ba-border)] rounded-xl pl-9 pr-4 py-2.5 text-[12px] font-dm-sans text-[var(--ba-text-primary)] placeholder:text-[var(--ba-text-muted)] outline-none focus:border-[var(--ba-blue)]" />
                </div>
                <select value={sort} onChange={e => setSort(e.target.value as typeof sort)}
                    className="bg-[var(--ba-bg-secondary)] border border-[var(--ba-border)] rounded-xl px-4 py-2.5 text-[12px] font-dm-sans text-[var(--ba-text-secondary)] outline-none cursor-pointer">
                    <option value="ytm">Sort: Highest YTM</option>
                    <option value="coupon">Sort: Highest Coupon</option>
                    <option value="minInvestment">Sort: Min Investment</option>
                </select>
            </div>
            <div className="flex gap-2 flex-wrap">
                {BOND_TYPES.map(t => <Pill key={t} label={t} active={bondType === t} onClick={() => setBondType(t)} />)}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map(b => <BondCard key={b.id} bond={b} />)}
                {filtered.length === 0 && (
                    <div className="col-span-3 text-center py-16 text-[var(--ba-text-muted)] font-dm-sans text-[13px]">No bonds match your search.</div>
                )}
            </div>

            <div className="text-[10px] text-[var(--ba-text-muted)] font-dm-sans text-center pb-2">
                YTM and coupon rates are indicative. Bonds are subject to interest rate risk. Consult an advisor before investing.
            </div>
        </div>
    );
}
