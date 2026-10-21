import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  Sparkles,
  Shirt,
  Users,
} from 'lucide-react';

interface MobileBottomBarProps {
  onOpenAiIngest: () => void;
}

export const MobileBottomBar: React.FC<MobileBottomBarProps> = ({ onOpenAiIngest }) => {
  return (
    <nav
      aria-label="Thanh điều hướng di động"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex items-center justify-around h-16 px-2 select-none"
    >
      {/* 1. Tổng quan */}
      <NavLink
        to="/"
        end
        className={({ isActive }) =>
          `flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-medium transition ${
            isActive
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
          }`
        }
      >
        <LayoutDashboard className="w-5 h-5 mb-0.5" aria-hidden="true" />
        <span>Tổng quan</span>
      </NavLink>

      {/* 2. Đơn hàng */}
      <NavLink
        to="/orders"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-medium transition ${
            isActive
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
          }`
        }
      >
        <ShoppingBag className="w-5 h-5 mb-0.5" aria-hidden="true" />
        <span>Đơn hàng</span>
      </NavLink>

      {/* 3. CENTER FLOATING ACTION BUTTON (FAB) AI DÁN TIN */}
      <div className="relative flex flex-col items-center justify-center flex-1">
        <button
          onClick={onOpenAiIngest}
          className="absolute -top-6 w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-purple-600/40 border-2 border-white dark:border-slate-900 active:scale-95 transition transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
          aria-label="Dán tin nhắn chat tạo đơn AI một chạm"
        >
          <Sparkles className="w-6 h-6 animate-pulse" />
        </button>
        <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 mt-6">
          Dán AI
        </span>
      </div>

      {/* 4. Sản phẩm */}
      <NavLink
        to="/products"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-medium transition ${
            isActive
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
          }`
        }
      >
        <Shirt className="w-5 h-5 mb-0.5" aria-hidden="true" />
        <span>Sản phẩm</span>
      </NavLink>

      {/* 5. Khách hàng */}
      <NavLink
        to="/customers"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-medium transition ${
            isActive
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
          }`
        }
      >
        <Users className="w-5 h-5 mb-0.5" aria-hidden="true" />
        <span>Khách hàng</span>
      </NavLink>
    </nav>
  );
};

export default MobileBottomBar;

