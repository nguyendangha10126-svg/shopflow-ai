import React, { useState, useEffect, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import MobileBottomBar from './MobileBottomBar';
import CommandPalette from './CommandPalette';
import MessageIngestionModal from '../ai/MessageIngestionModal';
import DraftOrderReviewModal from '../ai/DraftOrderReviewModal';
import { ProcessedAIDraftResult } from '../../types/ai.types';

export const AppLayout: React.FC = () => {
  const [isDark, setIsDark] = useState<boolean>(() => {
    return (
      localStorage.getItem('sf_theme') === 'dark' ||
      (!('sf_theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
    );
  });

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('sf_sidebar_collapsed') === 'true';
  });

  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isAiIngestOpen, setIsAiIngestOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewResult, setReviewResult] = useState<ProcessedAIDraftResult | null>(null);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('sf_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('sf_theme', 'light');
    }
  }, [isDark]);

  const toggleDarkMode = useCallback(() => setIsDark((prev) => !prev), []);

  const toggleSidebarCollapse = useCallback(() => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('sf_sidebar_collapsed', String(next));
      return next;
    });
  }, []);

  // Global Keyboard Shortcuts (Ctrl+K for Command Palette, Alt+S for Sidebar collapse)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
      if (e.altKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        toggleSidebarCollapse();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebarCollapse]);

  const handleAiSuccess = (result: ProcessedAIDraftResult) => {
    setReviewResult(result);
    setIsReviewOpen(true);
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased font-sans selection:bg-indigo-500 selection:text-white">
      {/* 1. Skip-link trợ năng bàn phím */}
      <a href="#main-content" className="skip-link">
        Chuyển đến nội dung chính (Phím tắt Tab)
      </a>

      {/* 2. Desktop Collapsible Full-Height Sidebar */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapse}
        onOpenAiIngest={() => setIsAiIngestOpen(true)}
      />

      {/* 3. Main Application Column */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen pb-16 md:pb-0">
        {/* Topbar with Global Search, Notifications & Account */}
        <Topbar
          onToggleSidebar={toggleSidebarCollapse}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onOpenAiIngest={() => setIsAiIngestOpen(true)}
          isDark={isDark}
          onToggleDarkMode={toggleDarkMode}
        />

        {/* Main Content Area */}
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto focus:outline-none transition-all"
        >
          <Outlet />
        </main>
      </div>

      {/* 4. Mobile Bottom Navigation with Floating Action Button (FAB) */}
      <MobileBottomBar onOpenAiIngest={() => setIsAiIngestOpen(true)} />

      {/* 5. Global Command Palette (Ctrl+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onOpenAiIngest={() => setIsAiIngestOpen(true)}
        onToggleTheme={toggleDarkMode}
        isDark={isDark}
      />

      {/* 6. Global Shared AI Ingestion Sheet & Review Modal */}
      <MessageIngestionModal
        isOpen={isAiIngestOpen}
        onClose={() => setIsAiIngestOpen(false)}
        onAnalysisSuccess={handleAiSuccess}
      />

      <DraftOrderReviewModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        reviewData={reviewResult}
        onOrderConfirmed={() => {
          setIsReviewOpen(false);
          // Thông báo cho trang hiện tại reload dữ liệu nếu cần
          window.dispatchEvent(new Event('sf_order_created'));
        }}
      />
    </div>
  );
};

export default AppLayout;
