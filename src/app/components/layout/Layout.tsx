import React from 'react';
import { Outlet } from 'react-router';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { useAppStore } from '../../store/store';

export const Layout: React.FC = () => {
  const { sidebarCollapsed } = useAppStore();

  return (
    <div className="min-h-screen bg-[#0A0F1E]">
      <Header />

      <div className="hidden lg:block fixed left-0 top-14 bottom-0 z-50">
        <Sidebar />
      </div>

      <div className="lg:hidden">
        <BottomNav />
      </div>

      <main
        className={`
          pb-[76px] lg:pb-0
          transition-[padding-left] duration-300 ease-in-out
          ${sidebarCollapsed ? 'lg:pl-[60px]' : 'lg:pl-64'}
        `}
      >
        <div className="min-h-[calc(100vh-56px)] p-4 md:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};