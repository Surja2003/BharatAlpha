import React from 'react';
import { useLocation, useNavigate } from 'react-router';
import { BookOpen, Home, Landmark, Lightbulb, Search, Zap } from 'lucide-react';

type NavTab = { icon: React.ElementType; label: string; path: string; center?: boolean };
const tabs: NavTab[] = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Search, label: 'Explore', path: '/explore' },
  { icon: Zap, label: 'Signals', path: '/screener', center: true },
  { icon: Landmark, label: 'Bonds', path: '/government-bonds' },
  { icon: Lightbulb, label: 'Advisor', path: '/advisor' },
];


export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] flex h-[60px] items-center border-t border-[var(--ba-border)] bg-[var(--ba-bg-secondary)]">
      {tabs.map(({ icon: Icon, label, path, center }) => {
        const isActive = location.pathname === path || (path !== '/' && location.pathname.startsWith(path));

        if (center) {
          return (
            <button
              key={path}
              type="button"
              onClick={() => navigate(path)}
              className="flex flex-1 flex-col items-center justify-center gap-0.5 bg-transparent"
              aria-label={label}
              title={label}
            >
              <div
                className={
                  `flex h-9 w-11 items-center justify-center rounded-xl transition-colors ` +
                  (isActive
                    ? 'bg-[var(--ba-blue)]'
                    : 'bg-[rgba(59,130,246,0.2)]')
                }
              >
                <Icon size={18} className={isActive ? 'text-white' : 'text-[var(--ba-blue)]'} />
              </div>
              <span
                className={
                  `font-dm-sans text-[10px] ` +
                  (isActive ? 'text-[var(--ba-blue)]' : 'text-[var(--ba-text-muted)]')
                }
              >
                {label}
              </span>
            </button>
          );
        }

        return (
          <button
            key={path}
            type="button"
            onClick={() => navigate(path)}
            className={
              `flex flex-1 flex-col items-center justify-center gap-0.5 bg-transparent pt-1 ` +
              (isActive ? 'border-t-2 border-[var(--ba-blue)]' : 'border-t-2 border-transparent')
            }
            aria-label={label}
            title={label}
          >
            <Icon size={18} className={isActive ? 'text-[var(--ba-blue)]' : 'text-[var(--ba-text-muted)]'} />
            <span
              className={
                `font-dm-sans text-[10px] ` +
                (isActive ? 'text-[var(--ba-blue)]' : 'text-[var(--ba-text-muted)]')
              }
            >
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
