import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    AlertCircle, BookOpen, CheckCircle2, ChevronDown, ChevronRight, ChevronUp,
    FileText, HelpCircle, Info, Lightbulb, Shield,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface FAQItem { q: string; a: string }
interface Step { num: number; title: string; desc: string; tips: string[] }

// ─── Data ─────────────────────────────────────────────────────────────────────
const ITR_FORMS: { form: string; who: string; income: string; color: string }[] = [
    { form: 'ITR-1 (SAHAJ)', who: 'Salaried individuals & pensioners', income: 'Salary, 1 house property, other sources up to ₹50L', color: '#10B981' },
    { form: 'ITR-2', who: 'Individuals & HUFs (no business income)', income: 'Capital gains, multiple properties, foreign income', color: '#3B82F6' },
    { form: 'ITR-3', who: 'Individuals with business/profession income', income: 'Business/profession + any other income', color: '#F59E0B' },
    { form: 'ITR-4 (SUGAM)', who: 'Small businesses under presumptive scheme', income: 'Presumptive income u/s 44AD/44ADA/44AE', color: '#8B5CF6' },
];

const KEY_DATES: { event: string; date: string; note: string }[] = [
    { event: 'Income Tax Return Filing (Non-Audit)', date: '31 July 2025', note: 'For individuals not requiring audit (AY 2025-26)' },
    { event: 'Income Tax Return Filing (Audit cases)', date: '31 Oct 2025', note: 'For those requiring CA audit' },
    { event: 'Belated/Revised Return', date: '31 Dec 2025', note: 'With late fee u/s 234F (up to ₹5,000)' },
    { event: 'Form 16 from employer', date: '15 June 2025', note: 'Employer must issue this by this date' },
    { event: 'Advance Tax Q1', date: '15 June 2025', note: '15% of advance tax liability' },
    { event: 'Advance Tax Q4 (Final)', date: '15 March 2026', note: '100% of total liability' },
];

const DEDUCTIONS: { section: string; desc: string; limit: string; color: string }[] = [
    { section: '80C', desc: 'PPF, ELSS, LIC, EPF, NSC, Home Loan Principal, Tuition Fees', limit: '₹1,50,000', color: '#3B82F6' },
    { section: '80CCD(1B)', desc: 'National Pension System (NPS) — additional benefit', limit: '₹50,000', color: '#10B981' },
    { section: '80D', desc: 'Health insurance premiums (self + parents)', limit: '₹25,000 + ₹50,000', color: '#F59E0B' },
    { section: '80E', desc: 'Interest on education loan (unlimited, 8 years)', limit: 'No limit', color: '#8B5CF6' },
    { section: '80TTA/TTB', desc: 'Savings bank interest (80TTA for <60 yrs, 80TTB for seniors)', limit: '₹10,000 / ₹50,000', color: '#06B6D4' },
    { section: '24(b)', desc: 'Home loan interest deduction for self-occupied property', limit: '₹2,00,000', color: '#EF4444' },
    { section: 'HRA', desc: 'House Rent Allowance exemption for salaried employees', limit: 'Calculated formula', color: '#F59E0B' },
];

const STEPS: Step[] = [
    {
        num: 1, title: 'Collect All Documents',
        desc: 'Gather every document before you start. Incomplete info is the #1 cause of mistakes.',
        tips: ['Form 16 from your employer (salary + TDS)', 'Form 26AS / Annual Information Statement (AIS) — download from incometax.gov.in', 'Bank statements for interest income', 'Demat account statement for capital gains', 'Premium receipts (LIC, health insurance) for deductions', 'Home loan statement for interest & principal'],
    },
    {
        num: 2, title: 'Check Form 26AS & AIS',
        desc: 'These are your tax credit statements. Every income source & TDS deducted is reflected here.',
        tips: ['Log in to incometax.gov.in → View Form 26AS', 'Cross-check TDS with Form 16 — mismatch causes notices', 'AIS shows all high-value transactions including FDs, MF redemptions, property sales', 'If any entry is wrong, submit feedback on the AIS portal'],
    },
    {
        num: 3, title: 'Choose the Right ITR Form',
        desc: 'Filing the wrong form can make your return defective.',
        tips: ['Salaried with salary + FD interest only → ITR-1', 'Capital gains from stocks/MFs → ITR-2', 'Freelancer/consultant with professional income → ITR-3 or ITR-4', 'When in doubt, ITR-2 is safer than ITR-1 for investors'],
    },
    {
        num: 4, title: 'Select Tax Regime',
        desc: 'India has two regimes since FY 2023-24. New regime is default but you can opt out.',
        tips: ['New Regime: Lower slab rates, no deductions (80C/80D etc.) — best if deductions < ₹3.75L', 'Old Regime: Higher rates but all deductions available — better for those with heavy 80C/HRA/home loan', 'Use a tax calculator to compare before filing', 'Salaried employees can switch each year'],
    },
    {
        num: 5, title: 'File Online & e-Verify',
        desc: 'Visit incometax.gov.in → e-File → Income Tax Returns. Complete within 30 days of filing.',
        tips: ['Pre-fill option auto-fills salary & TDS from Form 16', 'e-Verify via Aadhaar OTP (fastest) or net banking', 'Without e-verification, return is treated as not filed', 'Keep the acknowledgment (ITR-V) for your records'],
    },
];

const FAQS: FAQItem[] = [
    { q: 'Do I need to file ITR if my income is below ₹2.5 lakh?', a: 'Not mandatory, but you should file if you want to claim TDS refund, carry forward losses, apply for loans, or travel visa.' },
    { q: 'How do I report capital gains from stocks/MFs?', a: 'Short-term gains (held < 1 year for equity) taxed at 15% flat. Long-term gains (> 1 year) taxed at 10% above ₹1 lakh. Report in Schedule CG of ITR-2.' },
    { q: 'What is LTCG exemption for equity?', a: 'Long-term capital gains up to ₹1 lakh per year from equity shares/equity MFs are completely tax-free. Above ₹1 lakh is taxed at 10% without indexation.' },
    { q: 'Can I file ITR after the deadline?', a: 'Yes — as a belated return by 31 Dec with a late fee of ₹5,000 (₹1,000 if income < ₹5L). However, you cannot carry forward certain losses.' },
    { q: 'Is dividend income taxable?', a: 'Yes. Since FY 2020-21, dividends are taxable at your slab rate. You will receive Form 26AS entries for dividends received.' },
    { q: 'What documents do I need for ELSS/MF investments under 80C?', a: 'Account statement from your MF house or AMC showing the investment amount during April-March of the financial year. Accessible via CAMS/KFin online.' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────
function FAQAccordion({ items }: { items: FAQItem[] }) {
    const [open, setOpen] = useState<number | null>(null);
    return (
        <div className="flex flex-col gap-2">
            {items.map((item, i) => (
                <div key={i} className="bg-[var(--ba-bg-secondary)] border border-[var(--ba-border)] rounded-xl overflow-hidden">
                    <button type="button" onClick={() => setOpen(open === i ? null : i)}
                        className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-[var(--ba-bg-tertiary)] transition-colors cursor-pointer">
                        <span className="text-[13px] font-semibold text-[var(--ba-text-primary)] font-dm-sans pr-4">{item.q}</span>
                        {open === i ? <ChevronUp size={15} className="text-[var(--ba-text-muted)] shrink-0" /> : <ChevronDown size={15} className="text-[var(--ba-text-muted)] shrink-0" />}
                    </button>
                    <AnimatePresence>
                        {open === i && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                                className="overflow-hidden">
                                <div className="px-5 pb-4 text-[12px] text-[var(--ba-text-secondary)] font-dm-sans leading-[1.7] border-t border-[var(--ba-border)] pt-3">
                                    {item.a}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            ))}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ITRFiling() {
    const [activeStep, setActiveStep] = useState<number | null>(null);

    return (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="font-dm-serif text-[28px] text-[var(--ba-text-primary)] m-0 mb-0.5 flex items-center gap-2">
                    <FileText size={22} className="text-[var(--ba-blue)]" />
                    ITR Filing Guide
                </h1>
                <p className="text-[13px] text-[var(--ba-text-secondary)] m-0 font-dm-sans">
                    Complete beginner's guide to Income Tax Returns — step by step for Indian investors
                </p>
            </div>

            {/* Beginner Banner */}
            <div className="bg-[var(--ba-blue)]/[0.08] border border-[var(--ba-blue)]/[0.25] rounded-2xl px-5 py-4 flex gap-3">
                <Lightbulb size={18} className="text-[var(--ba-blue)] shrink-0 mt-0.5" />
                <div>
                    <div className="text-[13px] font-semibold text-[var(--ba-blue)] font-dm-sans mb-1">New to filing taxes?</div>
                    <div className="text-[12px] text-[var(--ba-text-secondary)] font-dm-sans leading-[1.7]">
                        ITR (Income Tax Return) is a form you submit to the Income Tax Department declaring your income, deductions, and taxes paid for the year.
                        It's <strong className="text-[var(--ba-text-primary)]">mandatory if your income exceeds ₹2.5 lakh/year</strong> (₹3L under new regime).
                        Filing correctly helps you <strong className="text-[var(--ba-text-primary)]">claim refunds, carry forward losses, and build a financial record</strong> for loans or visas.
                    </div>
                </div>
            </div>

            {/* Key Dates */}
            <div>
                <div className="text-[14px] font-semibold text-[var(--ba-text-primary)] font-dm-sans mb-3">📅 Key Dates (AY 2025-26)</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {KEY_DATES.map(d => (
                        <div key={d.event} className="bg-[var(--ba-bg-secondary)] border border-[var(--ba-border)] rounded-xl px-4 py-3">
                            <div className="text-[11px] font-bold font-jetbrains text-[var(--ba-gold)] mb-1">{d.date}</div>
                            <div className="text-[12px] font-semibold text-[var(--ba-text-primary)] font-dm-sans mb-0.5">{d.event}</div>
                            <div className="text-[10px] text-[var(--ba-text-muted)] font-dm-sans leading-[1.5]">{d.note}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Which ITR Form? */}
            <div>
                <div className="text-[14px] font-semibold text-[var(--ba-text-primary)] font-dm-sans mb-3">📋 Which ITR Form Do I Use?</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {ITR_FORMS.map(f => (
                        <div key={f.form} className="bg-[var(--ba-bg-secondary)] border border-[var(--ba-border)] rounded-xl px-4 py-3.5 flex gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-[10px] font-bold font-jetbrains"
                                style={{ background: `${f.color}20`, color: f.color, border: `1px solid ${f.color}40` }}>
                                ITR
                            </div>
                            <div>
                                <div className="text-[12px] font-semibold font-dm-sans mb-0.5" style={{ color: f.color }}>{f.form}</div>
                                <div className="text-[11px] text-[var(--ba-text-primary)] font-dm-sans mb-0.5">{f.who}</div>
                                <div className="text-[10px] text-[var(--ba-text-muted)] font-dm-sans leading-[1.5]">{f.income}</div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-2 text-[10px] text-[var(--ba-text-muted)] font-dm-sans flex items-center gap-1.5">
                    <Info size={10} /> If you have capital gains from stocks or mutual funds, you need ITR-2 or higher — not ITR-1.
                </div>
            </div>

            {/* Step-by-Step */}
            <div>
                <div className="text-[14px] font-semibold text-[var(--ba-text-primary)] font-dm-sans mb-3">🗂️ Step-by-Step Filing Guide</div>
                <div className="flex flex-col gap-2">
                    {STEPS.map(step => (
                        <div key={step.num} className="bg-[var(--ba-bg-secondary)] border border-[var(--ba-border)] rounded-xl overflow-hidden">
                            <button type="button" onClick={() => setActiveStep(activeStep === step.num ? null : step.num)}
                                className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-[var(--ba-bg-tertiary)] transition-colors cursor-pointer">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold font-jetbrains shrink-0 bg-[var(--ba-blue)] text-white">
                                    {step.num}
                                </div>
                                <div className="flex-1">
                                    <div className="text-[13px] font-semibold text-[var(--ba-text-primary)] font-dm-sans">{step.title}</div>
                                    <div className="text-[11px] text-[var(--ba-text-muted)] font-dm-sans">{step.desc}</div>
                                </div>
                                {activeStep === step.num
                                    ? <ChevronUp size={15} className="text-[var(--ba-text-muted)] shrink-0" />
                                    : <ChevronDown size={15} className="text-[var(--ba-text-muted)] shrink-0" />}
                            </button>
                            <AnimatePresence>
                                {activeStep === step.num && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                                        <div className="border-t border-[var(--ba-border)] px-5 py-4">
                                            <ul className="flex flex-col gap-2">
                                                {step.tips.map((tip, i) => (
                                                    <li key={i} className="flex items-start gap-2.5">
                                                        <CheckCircle2 size={13} className="text-[var(--ba-green)] shrink-0 mt-[1px]" />
                                                        <span className="text-[12px] text-[var(--ba-text-secondary)] font-dm-sans leading-[1.6]">{tip}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            </div>

            {/* Deductions */}
            <div>
                <div className="text-[14px] font-semibold text-[var(--ba-text-primary)] font-dm-sans mb-3">💰 Key Deductions to Claim</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {DEDUCTIONS.map(d => (
                        <div key={d.section} className="bg-[var(--ba-bg-secondary)] border border-[var(--ba-border)] rounded-xl px-4 py-3 flex gap-3">
                            <div className="px-2.5 py-1 rounded-lg text-[10px] font-bold font-jetbrains shrink-0 h-fit mt-0.5"
                                style={{ background: `${d.color}20`, color: d.color, border: `1px solid ${d.color}40` }}>
                                {d.section}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-[11px] text-[var(--ba-text-primary)] font-dm-sans mb-0.5 leading-[1.5]">{d.desc}</div>
                                <div className="text-[10px] font-jetbrains font-semibold" style={{ color: d.color }}>Limit: {d.limit}</div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-3 bg-[var(--ba-green)]/[0.07] border border-[var(--ba-green)]/[0.2] rounded-xl px-4 py-3">
                    <div className="text-[12px] text-[var(--ba-text-secondary)] font-dm-sans leading-[1.7]">
                        <strong className="text-[var(--ba-text-primary)]">💡 Max tax saving under old regime:</strong> Invest ₹1.5L in 80C + ₹50K in NPS (80CCD1B) + ₹25K health insurance (80D) = <strong className="text-[var(--ba-green)]">₹2.25 lakh deductions</strong> saving up to ₹67,500 in taxes (at 30% slab).
                    </div>
                </div>
            </div>

            {/* Old vs New Regime */}
            <div className="bg-[var(--ba-bg-secondary)] border border-[var(--ba-border)] rounded-2xl p-5">
                <div className="text-[14px] font-semibold text-[var(--ba-text-primary)] font-dm-sans mb-4">⚖️ Old vs New Tax Regime (FY 2024-25)</div>
                <div className="overflow-x-auto">
                    <table className="w-full text-[11px] font-dm-sans">
                        <thead>
                            <tr className="text-[var(--ba-text-muted)] border-b border-[var(--ba-border)]">
                                <th className="text-left pb-2 font-semibold">Income Slab</th>
                                <th className="text-right pb-2 font-semibold text-[var(--ba-gold)]">Old Regime</th>
                                <th className="text-right pb-2 font-semibold text-[#10B981]">New Regime (Default)</th>
                            </tr>
                        </thead>
                        <tbody className="text-[var(--ba-text-secondary)]">
                            {[
                                ['Up to ₹3,00,000', 'Nil', 'Nil'],
                                ['₹3L – ₹6L', '5%', '5%'],
                                ['₹6L – ₹9L', '20%', '10%'],
                                ['₹9L – ₹12L', '20%', '15%'],
                                ['₹12L – ₹15L', '30%', '20%'],
                                ['Above ₹15L', '30%', '30%'],
                            ].map(([slab, old, newR]) => (
                                <tr key={slab} className="border-b border-[var(--ba-border)]/[0.5]">
                                    <td className="py-2">{slab}</td>
                                    <td className="text-right py-2 font-jetbrains" style={{ color: old === 'Nil' ? 'var(--ba-green)' : 'var(--ba-gold)' }}>{old}</td>
                                    <td className="text-right py-2 font-jetbrains" style={{ color: newR === 'Nil' ? 'var(--ba-green)' : '#10B981' }}>{newR}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="mt-3 text-[10px] text-[var(--ba-text-muted)] font-dm-sans">
                    New regime: Standard deduction of ₹75,000 available for salaried. Marginal relief on ₹7L income — effectively zero tax. Cess @ 4% applies to all.
                </div>
            </div>

            {/* FAQs */}
            <div>
                <div className="text-[14px] font-semibold text-[var(--ba-text-primary)] font-dm-sans mb-3 flex items-center gap-2">
                    <HelpCircle size={16} className="text-[var(--ba-blue)]" /> Frequently Asked Questions
                </div>
                <FAQAccordion items={FAQS} />
            </div>

            {/* Useful Links */}
            <div className="bg-[var(--ba-bg-secondary)] border border-[var(--ba-border)] rounded-2xl p-5">
                <div className="text-[13px] font-semibold text-[var(--ba-text-primary)] font-dm-sans mb-3 flex items-center gap-2">
                    <BookOpen size={14} /> Useful Official Links
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                        { label: 'File ITR Online', url: 'https://eportal.incometax.gov.in', desc: 'Official income tax e-filing portal' },
                        { label: 'View Form 26AS / AIS', url: 'https://incometax.gov.in', desc: 'Tax credit & annual information statement' },
                        { label: 'RBI Retail Direct (G-Sec/Bonds)', url: 'https://rbiretaildirect.org.in', desc: 'Buy government bonds directly' },
                        { label: 'Tax Calculator (IT Dept)', url: 'https://eportal.incometax.gov.in/iec/foservices/#/pre-login/taxCal', desc: 'Compare old vs new regime' },
                    ].map(l => (
                        <a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center justify-between px-4 py-3 bg-[var(--ba-bg-tertiary)] border border-[var(--ba-border)] rounded-xl hover:border-[var(--ba-blue)] hover:bg-[var(--ba-blue)]/[0.05] transition-colors group">
                            <div>
                                <div className="text-[12px] font-semibold text-[var(--ba-text-primary)] font-dm-sans group-hover:text-[var(--ba-blue)]">{l.label}</div>
                                <div className="text-[10px] text-[var(--ba-text-muted)] font-dm-sans">{l.desc}</div>
                            </div>
                            <ChevronRight size={14} className="text-[var(--ba-text-muted)] group-hover:text-[var(--ba-blue)] shrink-0" />
                        </a>
                    ))}
                </div>
            </div>

            {/* Disclaimer */}
            <div className="bg-[var(--ba-gold)]/[0.07] border border-[var(--ba-gold)]/[0.2] rounded-xl px-4 py-3 flex gap-2">
                <AlertCircle size={13} className="text-[var(--ba-gold)] shrink-0 mt-[1px]" />
                <div className="text-[10px] text-[var(--ba-text-secondary)] font-dm-sans leading-[1.6]">
                    This guide is for educational purposes only and does not constitute tax advice. Tax laws change every year — always verify with the official Income Tax Department website or consult a qualified Chartered Accountant (CA) before filing. BharatAlpha is not responsible for any tax-filing decisions made based on this content.
                </div>
            </div>
        </div>
    );
}
