import React from 'react';
import type { Signal } from '../../data/mockData';

interface Props {
  signal: Signal;
  size?: 'sm' | 'md';
}

const config: Record<Signal, { className: string; label: string }> = {
  BUY: {
    className: 'border-[rgba(0,200,150,0.3)] bg-[rgba(0,200,150,0.15)] text-[var(--ba-green)]',
    label: 'BUY',
  },
  SELL: {
    className: 'border-[rgba(255,77,106,0.3)] bg-[rgba(255,77,106,0.15)] text-[var(--ba-red)]',
    label: 'SELL',
  },
  HOLD: {
    className: 'border-[rgba(245,158,11,0.3)] bg-[rgba(245,158,11,0.15)] text-[var(--ba-gold)]',
    label: 'HOLD',
  },
  WATCH: {
    className: 'border-[rgba(59,130,246,0.3)] bg-[rgba(59,130,246,0.15)] text-[var(--ba-blue)]',
    label: 'WATCH',
  },
};

export function SignalBadge({ signal, size = 'sm' }: Props) {
  const c = config[signal];
  return (
    <span
      className={
        `inline-block whitespace-nowrap rounded-md border font-dm-sans text-[11px] font-semibold uppercase tracking-[0.06em] ` +
        (size === 'sm' ? 'px-[7px] py-0.5' : 'px-[10px] py-1') +
        ` ${c.className}`
      }
    >
      {c.label}
    </span>
  );
}
