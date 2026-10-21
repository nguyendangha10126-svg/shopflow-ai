import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  Shirt,
  Users,
  HelpCircle,
  Moon,
  Sun,
  LogOut,
  Palette,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';

export const AppLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState<boolean>(() => {
    return (
      localStorage.getItem('sf_theme') === 'dark' ||
      (!('sf_theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
    );
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('sf_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('sf_theme', 'light');
    }
  }, [isDark]);

  const toggleDarkMode = () => setIsDark(!isDark);

  const navItems = [
    { to: '/', label: 'Tổng quan', icon: LayoutDashboard },
    { to: '/orders', label: 'Đơn hàng', icon: ShoppingBag },
    { to: '/products', label: 'Sản phẩm', icon: Shirt },
    { to: '/customers', label: 'Khách hàng', icon: Users },
    { to: '/faq', label: 'Chính sách & Hỏi đáp', icon: HelpCircle },
    { to: '/styleguide', label: 'Styleguide', icon: Palette },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased">
      {/* 1. Skip-link trợ năng bàn phím */}
      <a href="#main-content" className="skip-link">
        Chuyển đến nội dung chính (Phím tắt Tab)
      </a>

      {/* 2. Desktop Sidebar (Ẩn trên mobile, hiện trên md:block) */}
      <aside className="hidden md:flex md:w-64 flex-col justify-between border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sticky top-0 h-screen select-none">
        <div>
          {/* Logo & Shop Info */}
          <div className="flex items-center space-x-3 px-2 py-3 mb-6 border-b border-slate-100 dark:border-slate-800">
            <span className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
              SF
            </span>
            <div className="overflow-hidden">
              <h1 className="font-bold text-sm truncate text-slate-900 dark:text-slate-100">
                {user?.shop?.name || 'ShopFlow AI'}
              </h1>
              <p className="text-[11px] text-slate-400 truncate">
                {user?.role === 'OWNER' ? '👑 Chủ cửa hàng' : 'Nhân viên shop'}
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1" aria-label="Menu thanh điều hướng">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-semibold shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer Sidebar: User info & Theme Toggle */}
        <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs text-slate-500">Chế độ hiển thị</span>
            <button
              onClick={toggleDarkMode}
              className="inline-flex items-center space-x-1.5 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 transition"
              aria-label="Chuyển đổi giao diện Sáng / Tối"
            >
              {isDark ? (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Tối</span>
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>Sáng</span>
                </>
              )}
            </button>
          </div>

          <div className="px-2 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-xs">
            <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
              {user?.full_name || 'Người dùng'}
            </p>
            <p className="text-slate-400 truncate text-[11px]">{user?.email}</p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="w-full text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-200 dark:border-rose-900 inline-flex items-center justify-center space-x-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Đăng xuất</span>
          </Button>
        </div>
      </aside>

      {/* 3. Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-h-screen pb-16 md:pb-0">
        {/* Mobile Header Bar */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
          <div className="flex items-center space-x-2.5">
            <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
              SF
            </span>
            <h1 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate max-w-[180px]">
              {user?.shop?.name || 'ShopFlow AI'}
            </h1>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleDarkMode}
              aria-label="Đổi giao diện Sáng/Tối"
              className="p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
            >
              {isDark ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
            </button>
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              aria-label="Đăng xuất"
              className="p-1.5 text-xs text-rose-500 font-semibold inline-flex items-center space-x-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Thoát</span>
            </button>
          </div>
        </header>

        {/* 4. Nội dung trang chính */}
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto focus:outline-none"
        >
          <Outlet />
        </main>
      </div>

      {/* 5. Mobile Bottom Navigation Tab Bar (Dính đáy cố định trên mobile) */}
      <nav
        aria-label="Menu tab đáy di động"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex items-center justify-around py-1.5 select-none"
      >
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-2 text-[10px] font-medium transition ${
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                }`
              }
            >
              <Icon className="w-4 h-4 mb-0.5" aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};

export default AppLayout;
