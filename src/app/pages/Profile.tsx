import React from 'react';
import { motion } from 'motion/react';
import { User, Bell, Shield, HelpCircle, LogOut, ChevronRight, Star } from 'lucide-react';
import { C } from '../data/mockData';
import { useStore } from '../store/useStore';

const menuItems = [
  { icon: Bell, label: 'Notifications', sub: 'Price alerts, news, signals' },
  { icon: Shield, label: 'SEBI Compliance', sub: 'Platform disclaimers & info' },
  { icon: HelpCircle, label: 'Help & Support', sub: 'FAQs, contact us' },
  { icon: Star, label: 'Rate BharatAlpha', sub: 'Help us improve' },
];

export default function Profile() {
  const { watchlist } = useStore();

  return (
    <div className="mx-auto flex max-w-[600px] flex-col gap-4 text-[var(--ba-text-primary)]">
      {/* Avatar Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 rounded-[20px] border border-[var(--ba-border)] bg-[linear-gradient(135deg,#111827_0%,#1C2537_100%)] p-6"
      >
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--ba-blue)] to-[var(--ba-purple)] font-dm-serif text-2xl font-bold text-white">
          R
        </div>
        <div>
          <div className="font-dm-serif text-[20px] text-[var(--ba-text-primary)]">
            Rahul Sharma
          </div>
          <div className="mt-0.5 font-dm-sans text-[13px] text-[var(--ba-text-secondary)]">
            rahul.sharma@email.com
          </div>
          <div className="mt-2.5 flex gap-3">
            <div className="text-center">
              <div className="font-jetbrains text-[16px] font-semibold text-[var(--ba-blue)]">{watchlist.length}</div>
              <div className="text-[10px] text-[var(--ba-text-muted)]">Watchlist</div>
            </div>
            <div className="text-center">
              <div className="font-jetbrains text-[16px] font-semibold text-[var(--ba-green)]">12</div>
              <div className="text-[10px] text-[var(--ba-text-muted)]">Alerts</div>
            </div>
            <div className="text-center">
              <div className="font-jetbrains text-[16px] font-semibold text-[var(--ba-gold)]">Pro</div>
              <div className="text-[10px] text-[var(--ba-text-muted)]">Plan</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Watchlist */}
      <div className="rounded-2xl border border-[var(--ba-border)] bg-[var(--ba-bg-secondary)] p-4">
        <div className="mb-2.5 font-dm-sans text-[14px] font-semibold text-[var(--ba-text-primary)]">
          My Watchlist ({watchlist.length} stocks)
        </div>
        <div className="flex flex-wrap gap-2">
          {watchlist.map(sym => (
            <span
              key={sym}
              className="rounded-lg border border-[rgba(59,130,246,0.3)] bg-[rgba(59,130,246,0.15)] px-3 py-1 font-jetbrains text-[12px] text-[var(--ba-blue)]"
            >
              {sym}
            </span>
          ))}
          {watchlist.length === 0 && (
            <span className="text-[13px] text-[var(--ba-text-muted)]">No stocks in watchlist yet</span>
          )}
        </div>
      </div>

      {/* Menu */}
      <div className="overflow-hidden rounded-2xl border border-[var(--ba-border)] bg-[var(--ba-bg-secondary)]">
        {menuItems.map(({ icon: Icon, label, sub }, i) => (
          <button
            key={label}
            type="button"
            className={
              `flex w-full items-center gap-3 bg-transparent px-4 py-3.5 text-left hover:bg-[var(--ba-bg-tertiary)] ` +
              (i < menuItems.length - 1 ? 'border-b border-[var(--ba-border)]' : '')
            }
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[var(--ba-bg-tertiary)]">
              <Icon size={16} className="text-[var(--ba-text-secondary)]" />
            </div>
            <div className="flex-1">
              <div className="font-dm-sans text-[14px] text-[var(--ba-text-primary)]">{label}</div>
              <div className="font-dm-sans text-[11px] text-[var(--ba-text-muted)]">{sub}</div>
            </div>
            <ChevronRight size={16} className="text-[var(--ba-text-muted)]" />
          </button>
        ))}
      </div>

      {/* Platform Info */}
      <div className="rounded-xl border border-[var(--ba-border)] bg-[var(--ba-bg-secondary)] p-3.5">
        <div className="flex justify-between font-dm-sans text-[12px] text-[var(--ba-text-muted)]">
          <span>BharatAlpha v2.4.1</span>
          <span>Model updated: Mar 2026</span>
        </div>
        <div className="mt-1.5 font-dm-sans text-[11px] leading-[1.5] text-[var(--ba-text-muted)]">
          Not a SEBI registered investment advisor. All signals for educational purposes only.
          Data: NSE • AMFI • BSE
        </div>
      </div>

      <button
        type="button"
        className="flex items-center justify-center gap-2 rounded-xl border border-[rgba(255,77,106,0.2)] bg-[rgba(255,77,106,0.1)] p-3 font-dm-sans text-[14px] text-[var(--ba-red)]"
      >
        <LogOut size={16} />
        Sign Out
      </button>
    </div>
  );
}
