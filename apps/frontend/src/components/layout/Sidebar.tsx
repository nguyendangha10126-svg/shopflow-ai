import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  Shirt,
  Users,
  HelpCircle,
  Palette,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenAiIngest: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  onOpenAiIngest,
}) => {
  const { user } = useAuth();

  const navItems = [
    { to: '/', label: 'Tổng quan', icon: LayoutDashboard },
    { to: '/orders', label: 'Đơn hàng', icon: ShoppingBag },
    { to: '/products', label: 'Sản phẩm', icon: Shirt },
    { to: '/customers', label: 'Khách hàng', icon: Users },
    { to: '/faq', label: 'Chính sách & Hỏi đáp', icon: HelpCircle },
    { to: '/styleguide', label: 'Styleguide', icon: Palette },
  ];

  return (
    <aside
      className={`hidden md:flex flex-col justify-between border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 h-screen select-none transition-all duration-300 z-30 ${
        isCollapsed ? 'w-20 px-3 py-4' : 'w-64 p-4'
      }`}
    >
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header: Logo & Collapse Button */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800 min-h-[56px]">
          <div className="flex items-center space-x-3 overflow-hidden">
            <span className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black flex items-center justify-center text-sm shadow-md shadow-indigo-600/30 shrink-0">
              SF
            </span>
            {!isCollapsed && (
              <div className="overflow-hidden">
                <h1 className="font-bold text-sm font-heading truncate text-slate-900 dark:text-slate-100">
                  {user?.shop?.name || 'May Boutique'}
                </h1>
                <p className="text-[11px] text-slate-400 truncate">
                  {user?.role === 'OWNER' ? 'Chủ cửa hàng' : 'Nhân viên shop'}
                </p>
              </div>
            )}
          </div>

          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
            aria-label={isCollapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên'}
            title={isCollapsed ? 'Mở rộng (Alt+S)' : 'Thu gọn (Alt+S)'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5 overflow-y-auto flex-1 pr-1" aria-label="Menu thanh điều hướng">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                title={isCollapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `flex items-center rounded-xl text-sm font-medium transition group relative ${
                    isCollapsed ? 'justify-center p-3' : 'space-x-3 px-3.5 py-2.5'
                  } ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-semibold shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0 transition group-hover:scale-110" aria-hidden="true" />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom Promo Card: AI Quick Ingestion */}
      {!isCollapsed ? (
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-50/50 dark:from-purple-950/40 dark:via-indigo-950/30 dark:to-slate-900 border border-purple-200/60 dark:border-purple-800/40 space-y-2">
            <div className="flex items-center space-x-2 text-purple-700 dark:text-purple-300 font-bold text-xs">
              <Sparkles className="w-4 h-4 shrink-0 text-purple-600 animate-pulse" />
              <span>Trợ lý Chốt đơn AI</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Dán tin nhắn Zalo/FB, AI tự bóc tách khách và trừ tồn kho tự động.
            </p>
            <button
              onClick={onOpenAiIngest}
              className="w-full mt-1 py-1.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-sm transition active:scale-95 flex items-center justify-center space-x-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Dán tin nhắn ngay</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-center">
          <button
            onClick={onOpenAiIngest}
            className="w-10 h-10 rounded-xl bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center shadow transition"
            title="Dán tin nhắn AI tạo đơn"
            aria-label="Dán tin nhắn AI tạo đơn"
          >
            <Sparkles className="w-4 h-4" />
          </button>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
