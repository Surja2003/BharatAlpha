import React from 'react';
import { createBrowserRouter } from 'react-router';
import { Layout } from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import StockExplorer from './pages/StockExplorer';
import StockDetail from './pages/StockDetail';
import Portfolio from './pages/Portfolio';
import Screener from './pages/Screener';
import MutualFunds from './pages/MutualFunds';
import Profile from './pages/Profile';
import InvestmentAdvisor from './pages/InvestmentAdvisor';
import ETFs from './pages/ETFs';
import GovernmentBonds from './pages/GovernmentBonds';
import ITRFiling from './pages/ITRFiling';

export const router = createBrowserRouter([
  {
    path: '/',
    element: React.createElement(Layout),
    children: [
      { index: true, element: React.createElement(Dashboard) },
      { path: 'explore', element: React.createElement(StockExplorer) },
      { path: 'stock/:symbol', element: React.createElement(StockDetail) },
      { path: 'explore/:symbol', element: React.createElement(StockDetail) },
      { path: 'mutual-funds', element: React.createElement(MutualFunds) },
      { path: 'funds', element: React.createElement(MutualFunds) },
      { path: 'portfolio', element: React.createElement(Portfolio) }, // kept for direct URL
      { path: 'screener', element: React.createElement(Screener) },
      { path: 'profile', element: React.createElement(Profile) },
      { path: 'advisor', element: React.createElement(InvestmentAdvisor) },
      { path: 'etfs', element: React.createElement(ETFs) },
      { path: 'government-bonds', element: React.createElement(GovernmentBonds) },
      { path: 'itr-filing', element: React.createElement(ITRFiling) },
    ],
  },
]);

