import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  LayoutDashboard,
  ShoppingBag,
  Shirt,
  Users,
  HelpCircle,
  Palette,
  Sparkles,
  Sun,
  Moon,
  ArrowRight,
  X,
} from 'lucide-react';

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  category: 'Điều hướng' | 'Thao tác nhanh';
  action: () => void;
  shortcut?: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAiIngest?: () => void;
  onToggleTheme?: () => void;
  isDark?: boolean;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onOpenAiIngest,
  onToggleTheme,
  isDark,
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: CommandItem[] = [
    {
      id: 'nav-dashboard',
      title: 'Bảng Tổng quan',
      subtitle: 'Xem doanh thu, KPI và cảnh báo cần xử lý',
      icon: <LayoutDashboard className="w-4 h-4 text-indigo-500" />,
      category: 'Điều hướng',
      action: () => {
        navigate('/');
        onClose();
      },
      shortcut: 'G D',
    },
    {
      id: 'nav-orders',
      title: 'Quản lý Đơn hàng',
      subtitle: 'Xem toàn bộ đơn chốt, đang giao, hoàn thành',
      icon: <ShoppingBag className="w-4 h-4 text-emerald-500" />,
      category: 'Điều hướng',
      action: () => {
        navigate('/orders');
        onClose();
      },
      shortcut: 'G O',
    },
    {
      id: 'nav-products',
      title: 'Quản lý Sản phẩm & Tồn kho',
      subtitle: 'Xem danh sách sản phẩm, SKU và cảnh báo hết hàng',
      icon: <Shirt className="w-4 h-4 text-sky-500" />,
      category: 'Điều hướng',
      action: () => {
        navigate('/products');
        onClose();
      },
      shortcut: 'G P',
    },
    {
      id: 'nav-customers',
      title: 'Danh bạ Khách hàng',
      subtitle: 'Quản lý khách quen, lịch sử chi tiêu và địa chỉ',
      icon: <Users className="w-4 h-4 text-purple-500" />,
      category: 'Điều hướng',
      action: () => {
        navigate('/customers');
        onClose();
      },
      shortcut: 'G C',
    },
    {
      id: 'nav-faq',
      title: 'Chính sách & Trả lời khách (FAQ)',
      subtitle: 'Tài liệu quy định và trợ lý hỏi đáp tự động',
      icon: <HelpCircle className="w-4 h-4 text-amber-500" />,
      category: 'Điều hướng',
      action: () => {
        navigate('/faq');
        onClose();
      },
      shortcut: 'G F',
    },
    {
      id: 'nav-styleguide',
      title: 'Hệ thống thiết kế (Styleguide)',
      subtitle: 'Xem bảng màu, typography và components',
      icon: <Palette className="w-4 h-4 text-pink-500" />,
      category: 'Điều hướng',
      action: () => {
        navigate('/styleguide');
        onClose();
      },
    },
    {
      id: 'act-ai-ingest',
      title: 'Dán tin nhắn AI tạo đơn nhanh',
      subtitle: 'Bóc tách tự động tên, số điện thoại, địa chỉ và SKU',
      icon: <Sparkles className="w-4 h-4 text-purple-500" />,
      category: 'Thao tác nhanh',
      action: () => {
        onClose();
        onOpenAiIngest?.();
      },
      shortcut: 'Ctrl+V',
    },
    {
      id: 'act-theme',
      title: isDark ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối',
      subtitle: 'Đổi nền và màu chữ tối ưu theo môi trường ánh sáng',
      icon: isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />,
      category: 'Thao tác nhanh',
      action: () => {
        onToggleTheme?.();
        onClose();
      },
      shortcut: 'T',
    },
  ];

  const filtered = commands.filter((cmd) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      cmd.title.toLowerCase().includes(q) ||
      (cmd.subtitle && cmd.subtitle.toLowerCase().includes(q)) ||
      cmd.category.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tìm kiếm nhanh & Hành động"
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[80vh] transition"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 space-x-3 bg-slate-50/50 dark:bg-slate-950/40">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={filtered.length > 0}
            placeholder="Tìm trang, chức năng hoặc thao tác nhanh... (Gõ để tìm)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
              aria-label="Xóa từ khóa"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded bg-slate-200 dark:bg-slate-800 text-slate-500">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-slate-800/50">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs sm:text-sm">
              Không tìm thấy lệnh hoặc trang nào khớp với từ khóa "{query}"
            </div>
          ) : (
            <div className="space-y-1">
              {filtered.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={item.id}
                    onClick={item.action}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs sm:text-sm transition ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 font-semibold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center space-x-3 truncate">
                      <div className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-sm">
                        {item.icon}
                      </div>
                      <div className="truncate">
                        <div className="truncate">{item.title}</div>
                        {item.subtitle && (
                          <div className="text-[11px] font-normal text-slate-400 truncate">
                            {item.subtitle}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0 ml-3">
                      {item.shortcut && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700">
                          {item.shortcut}
                        </span>
                      )}
                      <ArrowRight className={`w-3.5 h-3.5 ${isSelected ? 'text-indigo-500 opacity-100' : 'opacity-0'}`} />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 bg-slate-50/60 dark:bg-slate-950/40 flex items-center justify-between select-none">
          <div className="flex items-center space-x-3">
            <span>↑↓ Di chuyển</span>
            <span>↵ Chọn</span>
            <span>ESC Đóng</span>
          </div>
          <span className="font-medium text-indigo-600 dark:text-indigo-400">ShopFlow AI Command</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
