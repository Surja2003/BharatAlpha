import { create } from 'zustand';

interface AppState {
  watchlist: string[];
  activeTab: string;
  addToWatchlist: (symbol: string) => void;
  removeFromWatchlist: (symbol: string) => void;
  toggleWatchlist: (symbol: string) => void;
  setActiveTab: (tab: string) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
}

export const useStore = create<AppState>((set, get) => ({
  watchlist: ['RELIANCE', 'TCS', 'HDFCBANK'],
  activeTab: 'home',
  sidebarCollapsed: false,

  addToWatchlist: (symbol) =>
    set((s) => ({ watchlist: [...s.watchlist, symbol] })),

  removeFromWatchlist: (symbol) =>
    set((s) => ({ watchlist: s.watchlist.filter((w) => w !== symbol) })),

  toggleWatchlist: (symbol) => {
    const { watchlist } = get();
    if (watchlist.includes(symbol)) {
      set((s) => ({ watchlist: s.watchlist.filter((w) => w !== symbol) }));
    } else {
      set((s) => ({ watchlist: [...s.watchlist, symbol] }));
    }
  },

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
}));
