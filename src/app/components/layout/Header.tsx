import React, { useState, useRef, useEffect } from 'react';
import { Bell, Search, X, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router';

const recentSearches = ['RELIANCE', 'TCS', 'HDFCBANK', 'NIFTY 50'];
const trendingStocks = [
  { symbol: 'TATAMOTORS', change: '+1.84%' },
  { symbol: 'SUNPHARMA', change: '+1.88%' },
  { symbol: 'BAJFINANCE', change: '+1.89%' },
];

export function Header() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  const handleSearch = (symbol: string) => {
    setSearchOpen(false);
    setQuery('');
    navigate(`/stock/${symbol}`);
  };

  return (
    <header className="sticky top-0 z-[100] h-14 bg-[var(--ba-bg-secondary)] border-b border-[var(--ba-border)] flex items-center px-4 gap-3">
      {/* Logo */}
      <button
        type="button"
        onClick={() => navigate('/')}
        className="shrink-0 flex items-center gap-2 cursor-pointer"
        aria-label="Go to dashboard"
        title="BharatAlpha"
      >
        <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-[var(--ba-blue)] to-[var(--ba-green)] flex items-center justify-center">
          <TrendingUp size={14} strokeWidth={2.5} className="text-white" />
        </span>
        <span className="font-dm-serif text-[18px] text-[var(--ba-text-primary)] font-normal tracking-[-0.3px]">
          BharatAlpha
        </span>
      </button>

      {/* Search Bar */}
      <div className="flex-1 relative max-w-[340px]">
        <div className="flex items-center gap-2 bg-[var(--ba-bg-tertiary)] border border-[var(--ba-border)] focus-within:border-[var(--ba-blue)] rounded-[10px] px-3 h-9 transition-colors">
          <Search size={14} className="text-[var(--ba-text-muted)]" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setSearchOpen(true)}
            onKeyDown={(e) => e.key === 'Enter' && query && handleSearch(query.toUpperCase())}
            placeholder="Search stocks, MFs, indices..."
            className="flex-1 bg-transparent border-0 outline-none text-[13px] text-[var(--ba-text-primary)] font-dm-sans placeholder:text-[var(--ba-text-muted)]"
          />
          {query && (
            <button
              type="button"
              aria-label="Clear search"
              title="Clear search"
              onClick={() => setQuery('')}
              className="p-0 bg-transparent border-0 cursor-pointer"
            >
              <X size={12} className="text-[var(--ba-text-muted)]" />
            </button>
          )}
        </div>

        {/* Search Dropdown */}
        {searchOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setSearchOpen(false)} />
            <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--ba-bg-tertiary)] border border-[var(--ba-border)] rounded-[10px] z-[200] overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
              {/* Recent */}
              <div className="px-3 pt-2 pb-1 text-[11px] text-[var(--ba-text-muted)] font-dm-sans tracking-[0.08em] uppercase">
                Recent Searches
              </div>
              {recentSearches
                .filter((s) => !query || s.toLowerCase().includes(query.toLowerCase()))
                .map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleSearch(s)}
                    className="w-full flex items-center gap-2 px-3 py-2 bg-transparent border-0 cursor-pointer text-left text-[13px] text-[var(--ba-text-primary)] font-dm-sans hover:bg-[var(--ba-bg-secondary)]"
                  >
                    <Search size={12} className="text-[var(--ba-text-muted)]" />
                    {s}
                  </button>
                ))}

              {/* Trending */}
              <div className="border-t border-[var(--ba-border)] px-3 pt-2 pb-1 text-[11px] text-[var(--ba-text-muted)] font-dm-sans tracking-[0.08em] uppercase">
                Trending
              </div>
              {trendingStocks.map((s) => (
                <button
                  key={s.symbol}
                  type="button"
                  onClick={() => handleSearch(s.symbol)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-transparent border-0 cursor-pointer text-[13px] text-[var(--ba-text-primary)] font-dm-sans hover:bg-[var(--ba-bg-secondary)]"
                >
                  <span className="flex items-center gap-2">
                    <TrendingUp size={12} className="text-[var(--ba-green)]" />
                    {s.symbol}
                  </span>
                  <span className="text-[var(--ba-green)] font-jetbrains text-[12px]">{s.change}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Right Side */}
      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          aria-label="Notifications"
          title="Notifications"
          className="relative bg-[var(--ba-bg-tertiary)] border border-[var(--ba-border)] rounded-lg p-[6px] cursor-pointer flex items-center"
        >
          <Bell size={16} className="text-[var(--ba-text-secondary)]" />
          <span className="absolute top-[3px] right-[3px] w-[7px] h-[7px] bg-[var(--ba-red)] rounded-full" />
        </button>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--ba-blue)] to-[var(--ba-purple)] flex items-center justify-center cursor-pointer text-[13px] text-white font-semibold font-dm-sans">
          R
        </div>
      </div>
    </header>
  );
}
