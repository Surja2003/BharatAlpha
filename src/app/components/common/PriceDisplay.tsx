import React from 'react';

interface Props {
  price: number;
  change?: number;
  changePct?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'hero';
  showChange?: boolean;
  prefix?: string;
}

const PRICE_SIZE_CLASS: Record<NonNullable<Props['size']>, string> = {
  xs: 'text-[11px]',
  sm: 'text-[13px]',
  md: 'text-[15px]',
  lg: 'text-[18px]',
  hero: 'text-[42px]',
};

const CHANGE_SIZE_CLASS: Record<NonNullable<Props['size']>, string> = {
  xs: 'text-[11px]',
  sm: 'text-[11px]',
  md: 'text-[11px]',
  lg: 'text-[13px]',
  hero: 'text-[30px]',
};

export function PriceDisplay({ price, change, changePct, size = 'md', showChange = true, prefix = '₹' }: Props) {
  const isPositive = (change ?? 0) >= 0;
  const arrow = change !== undefined ? (isPositive ? '▲' : '▼') : '';
  const changeColorClass = change !== undefined ? (isPositive ? 'text-[var(--ba-green)]' : 'text-[var(--ba-red)]') : 'text-[#F1F5F9]';

  return (
    <div className="inline-flex flex-col gap-0.5 font-jetbrains">
      <span
        className={
          `${PRICE_SIZE_CLASS[size]} text-[#F1F5F9] ` +
          (size === 'hero' ? 'font-bold' : 'font-medium')
        }
      >
        {prefix}{price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
      {showChange && change !== undefined && changePct !== undefined && (
        <span className={`${CHANGE_SIZE_CLASS[size]} ${changeColorClass}`}>
          {arrow} {Math.abs(change).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({Math.abs(changePct).toFixed(2)}%)
        </span>
      )}
    </div>
  );
}

export function ChangeChip({ change, changePct }: { change: number; changePct: number }) {
  const isPositive = changePct >= 0;
  return (
    <span
      className={
        `whitespace-nowrap rounded-md border px-2 py-0.5 font-jetbrains text-[12px] font-medium ` +
        (isPositive
          ? 'border-[rgba(0,200,150,0.3)] bg-[rgba(0,200,150,0.15)] text-[var(--ba-green)]'
          : 'border-[rgba(255,77,106,0.3)] bg-[rgba(255,77,106,0.15)] text-[var(--ba-red)]')
      }
    >
      {isPositive ? '▲' : '▼'} {Math.abs(changePct).toFixed(2)}%
    </span>
  );
}
