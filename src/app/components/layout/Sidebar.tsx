import React from 'react';
import { useLocation, useNavigate } from 'react-router';
import {
  BarChart2,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  FileText,
  Home,
  Landmark,
  Lightbulb,
  Search,
  TrendingUp,
  User,
  Zap,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { ThemeToggle } from './ThemeToggle';

const navItems = [
  { icon: Home, label: 'Dashboard', path: '/' },
  { icon: Search, label: 'Stock Explorer', path: '/explore' },
  { icon: Zap, label: 'Screener', path: '/screener' },
  { icon: BarChart2, label: 'Mutual Funds', path: '/mutual-funds' },
  { icon: BookOpen, label: 'ETFs', path: '/etfs' },
  { icon: Landmark, label: 'Govt Bonds', path: '/government-bonds' },
  { icon: Lightbulb, label: 'Invest Advisor', path: '/advisor' },
  { icon: FileText, label: 'ITR Filing', path: '/itr-filing' },
  { icon: User, label: 'Profile', path: '/profile' },
] as const;


export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { sidebarCollapsed, setSidebarCollapsed } = useStore();

  const widthClass = sidebarCollapsed ? 'w-16' : 'w-[260px]';

  return (
    <aside
      className={
        `relative flex h-full shrink-0 flex-col border-r border-[var(--ba-border)] bg-[var(--ba-bg-secondary)] transition-[width] duration-[250ms] ease-in-out ` +
        widthClass
      }
    >
      <div
        className={
          `flex h-14 items-center gap-2.5 border-b border-[var(--ba-border)] ` +
          (sidebarCollapsed ? 'px-[18px]' : 'px-5')
        }
      >
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--ba-blue)] to-[var(--ba-green)]">
          <TrendingUp size={14} strokeWidth={2.5} className="text-white" />
        </div>
        {!sidebarCollapsed && (
          <span className="truncate font-dm-serif text-[18px] font-normal tracking-[-0.3px] text-[var(--ba-text-primary)]">
            BharatAlpha
          </span>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-2 py-3">
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
          return (
            <button
              key={path}
              type="button"
              onClick={() => navigate(path)}
              title={sidebarCollapsed ? label : undefined}
              className={
                `flex w-full items-center gap-3 rounded-[10px] text-left transition-colors ` +
                (sidebarCollapsed ? 'px-[18px] py-2.5' : 'px-3 py-2.5') +
                (isActive
                  ? ' bg-[rgba(59,130,246,0.15)] text-[var(--ba-blue)]'
                  : ' bg-transparent text-[var(--ba-text-secondary)] hover:bg-[var(--ba-bg-tertiary)]')
              }
              aria-label={label}
            >
              <Icon
                size={18}
                strokeWidth={isActive ? 2 : 1.5}
                className="shrink-0"
              />
              {!sidebarCollapsed && (
                <span
                  className={
                    `truncate font-dm-sans text-[14px] ` +
                    (isActive ? 'font-semibold' : 'font-normal')
                  }
                >
                  {label}
                </span>
              )}
              {isActive && !sidebarCollapsed && (
                <div className="ml-auto h-5 w-[3px] rounded-sm bg-[var(--ba-blue)]" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-[var(--ba-border)] p-2">
        <ThemeToggle collapsed={sidebarCollapsed} />
      </div>

      {!sidebarCollapsed && (
        <div className="flex flex-col gap-1 px-4 py-3">
          <div className="font-dm-sans text-[11px] text-[var(--ba-text-muted)]">Data: IIFL TTBlaze • NSE</div>
          <div className="font-dm-sans text-[10px] text-[var(--ba-text-muted)]">v2.4.1 • Model: Mar 2026</div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className="absolute right-[-12px] top-1/2 z-10 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--ba-border)] bg-[var(--ba-bg-tertiary)] text-[var(--ba-text-secondary)]"
        aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {sidebarCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  );
}
