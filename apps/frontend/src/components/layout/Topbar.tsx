import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Sparkles,
  Bell,
  Sun,
  Moon,
  LogOut,
  ChevronDown,
  Menu,
  Check,
  Code2,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';

interface TopbarProps {
  onToggleSidebar?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenAiIngest?: () => void;
  isDark: boolean;
  onToggleDarkMode: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  onToggleSidebar,
  onOpenCommandPalette,
  onOpenAiIngest,
  isDark,
  onToggleDarkMode,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isTechnicalMode, setIsTechnicalMode] = useState<boolean>(() => {
    return localStorage.getItem('sf_tech_mode') === 'true';
  });

  const accountRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setIsAccountOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleTechnicalMode = () => {
    const next = !isTechnicalMode;
    setIsTechnicalMode(next);
    localStorage.setItem('sf_tech_mode', String(next));
    window.dispatchEvent(new Event('sf_tech_mode_changed'));
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 h-14 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between select-none transition">
      {/* Left: Mobile hamburger & Search trigger */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 -ml-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden transition"
          aria-label="Mở danh mục điều hướng"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Bar (Trigger for Ctrl+K) */}
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center space-x-2.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition text-xs w-48 sm:w-64"
        >
          <Search className="w-4 h-4 shrink-0 text-slate-400" />
          <span className="truncate text-left flex-1">Tìm kiếm hoặc lệnh...</span>
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
            Ctrl K
          </kbd>
        </button>
      </div>

      {/* Right actions: AI Ingest, Theme, Notification, Account */}
      <div className="flex items-center space-x-2 sm:space-x-2.5">
        {/* Quick Hero AI Ingest button */}
        <Button
          size="sm"
          onClick={onOpenAiIngest}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold shadow-sm text-xs px-3 hidden sm:inline-flex"
        >
          <Sparkles className="w-3.5 h-3.5 mr-1.5" />
          <span>Dán tin AI</span>
        </Button>

        {/* Dark/Light mode toggle */}
        <button
          onClick={onToggleDarkMode}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          aria-label="Chuyển đổi giao diện Sáng / Tối"
          title={isDark ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-600" />
          )}
        </button>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 relative transition"
            aria-label="Thông báo hệ thống"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-white dark:ring-slate-900" />
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-3 z-50 animate-slide-up">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 mb-2">
                <span className="font-bold text-xs text-slate-900 dark:text-slate-100">Thông báo mới</span>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold cursor-pointer">
                  Đánh dấu đã đọc
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    Đơn hàng #1001 đã được khách xác nhận
                  </p>
                  <p className="text-[11px] text-slate-400">15 phút trước • Lê Thu Hương</p>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    Cảnh báo tồn kho: Váy hoa nhí (Size M) còn 3 chiếc
                  </p>
                  <p className="text-[11px] text-slate-400">Hôm nay lúc 10:20</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Account Popover */}
        <div className="relative" ref={accountRef}>
          <button
            onClick={() => setIsAccountOpen(!isAccountOpen)}
            className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition text-left"
            aria-label="Menu tài khoản người dùng"
            aria-expanded={isAccountOpen}
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
              {user?.full_name?.charAt(0) || 'S'}
            </div>
            <div className="hidden lg:block text-xs pr-1">
              <p className="font-bold text-slate-800 dark:text-slate-200 leading-tight truncate max-w-[120px]">
                {user?.shop?.name || 'May Boutique'}
              </p>
              <p className="text-[11px] text-slate-400 leading-tight">
                {user?.role === 'OWNER' ? 'Chủ cửa hàng' : 'Nhân viên'}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {isAccountOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-2 z-50 animate-slide-up divide-y divide-slate-100 dark:divide-slate-800">
              <div className="p-2 space-y-0.5">
                <p className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                  {user?.full_name || 'Nguyễn Văn Chủ Shop'}
                </p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email || 'owner@mayboutique.vn'}</p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                  {user?.shop?.name || 'May Boutique'} • {user?.role || 'OWNER'}
                </span>
              </div>

              {/* Technical mode toggle */}
              <div className="py-1">
                <button
                  onClick={toggleTechnicalMode}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  <div className="flex items-center space-x-2">
                    <Code2 className="w-4 h-4 text-slate-400" />
                    <span>Xem thông số kỹ thuật</span>
                  </div>
                  {isTechnicalMode && <Check className="w-3.5 h-3.5 text-indigo-600 font-bold" />}
                </button>
              </div>

              {/* Logout button */}
              <div className="pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Đăng xuất tài khoản</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
