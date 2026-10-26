import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Package,
  Sparkles,
  AlertTriangle,
  Clock,
  Truck,
  CheckCircle2,
  ChevronRight,
  Cpu,
  BarChart2,
  Table as TableIcon,
  HelpCircle,
  Layers
} from 'lucide-react';
import { apiClient, ApiClientError } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import MoneyText from '../components/ui/MoneyText';
import Skeleton from '../components/ui/Skeleton';
import MessageIngestionModal from '../components/ai/MessageIngestionModal';
import DraftOrderReviewModal from '../components/ai/DraftOrderReviewModal';
import { ProcessedAIDraftResult } from '../types/ai.types';

export interface DashboardSummaryData {
  kpis: {
    total_revenue_vnd: number;
    total_orders: number;
    ai_orders_count: number;
    ai_conversion_rate: number;
    active_products_count: number;
    low_stock_products_count: number;
  };
  orders_by_status: Record<string, number>;
  orders_by_source: {
    clipboard: number;
    manual: number;
  };
  revenue_trend_7d: Array<{
    date: string;
    label: string;
    revenue_vnd: number;
    order_count: number;
  }>;
  ai_usage: {
    model_name?: string;
    used_this_month: number;
    monthly_limit: number;
    remaining: number;
    usage_percentage: number;
    is_near_limit: boolean;
    avg_latency_ms: number;
    p50_latency_ms: number;
    p95_latency_ms: number;
    total_tokens_used: number;
    success_rate: number;
  };
}

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [summary, setSummary] = useState<DashboardSummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Chế độ xem biểu đồ dạng bảng số liệu (Accessibility)
  const [showDataTable, setShowDataTable] = useState(false);

  // Chế độ xem kỹ thuật (Tech Mode)
  const [techMode, setTechMode] = useState(() => {
    return localStorage.getItem('shopflow_tech_mode') === 'true';
  });

  // Tooltip trợ giúp định nghĩa chỉ số
  const [showFormulaTooltip, setShowFormulaTooltip] = useState(false);

  // Modals nạp tin nhắn và duyệt đơn AI
  const [isAiIngestOpen, setIsAiIngestOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewResult, setReviewResult] = useState<ProcessedAIDraftResult | null>(null);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const response = await apiClient.get<{ data: DashboardSummaryData }>('/dashboard/summary');
      setSummary(response.data);
    } catch (err: any) {
      if (err instanceof ApiClientError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Không thể tải dữ liệu báo cáo kinh doanh');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Lắng nghe thay đổi tech mode từ custom event
  useEffect(() => {
    const handleStorageChange = () => {
      setTechMode(localStorage.getItem('shopflow_tech_mode') === 'true');
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleAiSuccess = (result: ProcessedAIDraftResult) => {
    setReviewResult(result);
    setIsReviewOpen(true);
  };

  const handleConfirmedOrder = () => {
    fetchDashboardData();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    );
  }

  if (errorMessage || !summary) {
    return (
      <Card className="border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20 text-center py-12">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="mt-2 text-base font-bold text-rose-700 dark:text-rose-300">
          {errorMessage || 'Không thể hiển thị dữ liệu báo cáo'}
        </h2>
        <div className="mt-4">
          <Button variant="outline" size="sm" onClick={fetchDashboardData}>
            Thử tải lại
          </Button>
        </div>
      </Card>
    );
  }

  // Doanh thu lớn nhất trong 7 ngày để scale trục Y
  const rawMaxDaily = Math.max(...summary.revenue_trend_7d.map((d) => d.revenue_vnd), 1000000);
  // Làm tròn mốc cao nhất của trục Y (e.g. 1.500.000)
  const yAxisMax = Math.ceil(rawMaxDaily / 500000) * 500000;
  const yAxisMid = yAxisMax / 2;

  // Tính tỷ lệ % nguồn đơn
  const totalSources = summary.orders_by_source.clipboard + summary.orders_by_source.manual;
  const clipboardPercent =
    totalSources > 0 ? Math.round((summary.orders_by_source.clipboard / totalSources) * 100) : 0;
  const manualPercent = 100 - clipboardPercent;

  // Số việc cần xử lý ngay
  const draftOrdersCount = summary.orders_by_status.DRAFT || 0;
  const confirmedOrdersCount = summary.orders_by_status.CONFIRMED || 0;
  const lowStockCount = summary.kpis.low_stock_products_count || 0;
  const inProgressOrdersCount = confirmedOrdersCount + (summary.orders_by_status.SHIPPING || 0);

  return (
    <div className="space-y-6">
      {/* 1. Header & Banner Lời chào */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 p-6 rounded-2xl text-white shadow-md">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-bold">
              Xin chào, {user?.full_name || 'Chủ shop'}!
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-indigo-100">
              {user?.shop?.name || 'May Boutique'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-indigo-200">
            Hôm nay cửa hàng có <b>{inProgressOrdersCount}</b> đơn đang xử lý và{' '}
            <b>{summary.ai_usage.remaining}</b> lượt dùng AI còn lại trong tháng.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            type="button"
            variant="primary"
            onClick={() => setIsAiIngestOpen(true)}
            className="bg-purple-500 hover:bg-purple-600 active:bg-purple-700 text-white shadow font-semibold"
          >
            <Sparkles className="w-4 h-4 mr-1.5" />
            Dán tin AI
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/orders')}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs"
          >
            Quản lý đơn
          </Button>
        </div>
      </div>

      {/* 2. Khối CẦN XỬ LÝ NGAY (Urgent Action Card) */}
      {(draftOrdersCount > 0 || confirmedOrdersCount > 0 || lowStockCount > 0) && (
        <Card className="border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-500 text-white shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                  Cần xử lý ngay hôm nay
                </h3>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-amber-800 dark:text-amber-300 mt-1">
                  {draftOrdersCount > 0 && (
                    <span className="flex items-center gap-1 font-semibold">
                      <Clock className="w-3.5 h-3.5" /> {draftOrdersCount} đơn nháp chờ duyệt
                    </span>
                  )}
                  {confirmedOrdersCount > 0 && (
                    <span className="flex items-center gap-1 font-semibold">
                      <Truck className="w-3.5 h-3.5" /> {confirmedOrdersCount} đơn chờ đóng gói giao hàng
                    </span>
                  )}
                  {lowStockCount > 0 && (
                    <span className="flex items-center gap-1 font-semibold">
                      <Package className="w-3.5 h-3.5" /> {lowStockCount} SKU sắp hết hàng (&le; 5 chiếc)
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 sm:pt-0">
              {draftOrdersCount > 0 && (
                <Button
                  size="sm"
                  onClick={() => navigate('/orders')}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs"
                >
                  Duyệt đơn ngay
                </Button>
              )}
              {lowStockCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/products')}
                  className="border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs"
                >
                  Kiểm tra kho
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* 3. Thẻ KPI Kinh Doanh (4 Thẻ chuẩn hóa Single Source of Truth) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Doanh Thu Thuần */}
        <Card className="hover:border-indigo-300 dark:hover:border-indigo-700 transition">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-bold uppercase tracking-wider">Doanh thu thuần</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
              <MoneyText amount={summary.kpis.total_revenue_vnd} />
            </div>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3 mr-0.5 inline" />
              <span>Từ 5 đơn đã chốt & giao</span>
            </p>
          </div>
        </Card>

        {/* KPI 2: Tổng Đơn Hàng */}
        <Card className="hover:border-indigo-300 dark:hover:border-indigo-700 transition">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-bold uppercase tracking-wider">Tổng đơn hàng</span>
              <Package className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
              {summary.kpis.total_orders} <span className="text-xs font-normal text-slate-400">đơn</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 font-medium">
              <span className="text-emerald-600">{summary.orders_by_status.CONFIRMED || 0} chốt</span>
              <span>•</span>
              <span className="text-sky-600">{summary.orders_by_status.SHIPPING || 0} giao</span>
              <span>•</span>
              <span className="text-indigo-600">{summary.orders_by_status.DELIVERED || 0} xong</span>
              <span>•</span>
              <span className="text-amber-600">{summary.orders_by_status.DRAFT || 0} nháp</span>
              {((summary.orders_by_status.CANCELLED || 0) + (summary.orders_by_status.RETURNED || 0)) > 0 && (
                <>
                  <span>•</span>
                  <span className="text-rose-600">
                    {(summary.orders_by_status.CANCELLED || 0) + (summary.orders_by_status.RETURNED || 0)} hủy/trả
                  </span>
                </>
              )}
            </div>
          </div>
        </Card>

        {/* KPI 3: Tỷ Lệ Chuyển Đổi AI */}
        <Card className="hover:border-purple-300 dark:hover:border-purple-700 transition relative">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-bold uppercase tracking-wider flex items-center gap-1">
                <span>Hiệu quả chốt đơn AI</span>
                <button
                  type="button"
                  onClick={() => setShowFormulaTooltip(!showFormulaTooltip)}
                  className="text-slate-400 hover:text-slate-600"
                  title="Xem công thức tính"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
              </span>
              <Sparkles className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-black text-purple-600 dark:text-purple-400 font-mono">
              {summary.kpis.ai_conversion_rate}%
            </div>
            <p className="text-[11px] text-slate-500">
              Đã bóc tách <b>{summary.kpis.ai_orders_count}</b> đơn từ tin nhắn khách
            </p>

            {showFormulaTooltip && (
              <div className="absolute top-10 left-4 right-4 p-2.5 rounded-lg bg-slate-900 text-white text-[11px] shadow-xl z-20 space-y-1">
                <p className="font-bold text-purple-300">Công thức định nghĩa M7:</p>
                <p>(Số đơn AI đã xác nhận/hoàn thành) ÷ (Tổng đơn AI tạo ra) = 60%</p>
              </div>
            )}
          </div>
        </Card>

        {/* KPI 4: Mặt Hàng Trong Kho */}
        <Card className="hover:border-indigo-300 dark:hover:border-indigo-700 transition">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-bold uppercase tracking-wider">Mặt hàng trong kho</span>
              <Layers className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
              {summary.kpis.active_products_count}{' '}
              <span className="text-xs font-normal text-slate-400">SKU</span>
            </div>
            <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
              {summary.kpis.low_stock_products_count} mặt hàng sắp hết kho (&le; 5 chiếc)
            </p>
          </div>
        </Card>
      </div>

      {/* 4. Biểu Đồ Doanh Thu 7 Ngày & Phân Bổ Nguồn Đơn */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Biểu đồ Doanh Thu 7 Ngày có Trục Y rõ ràng & Bảng Dữ Liệu Thay Thế */}
        <Card className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-indigo-600" />
                <span>Biểu Đồ Doanh Thu 7 Ngày Gần Nhất</span>
              </h2>
              <p className="text-xs text-slate-400">Dòng tiền bán lẻ theo từng ngày đối soát</p>
            </div>

            <button
              type="button"
              onClick={() => setShowDataTable(!showDataTable)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Chuyển đổi giữa biểu đồ và bảng dữ liệu"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>{showDataTable ? 'Xem dạng cột' : 'Xem dạng bảng'}</span>
            </button>
          </div>

          {showDataTable ? (
            /* Bảng dữ liệu hỗ trợ Screen Reader & Trợ năng */
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="py-2.5 px-3">Ngày</th>
                    <th className="py-2.5 px-3">Thứ</th>
                    <th className="py-2.5 px-3 text-right">Doanh thu (VNĐ)</th>
                    <th className="py-2.5 px-3 text-right">Số đơn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {summary.revenue_trend_7d.map((day) => (
                    <tr key={day.date} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 font-mono">{day.date}</td>
                      <td className="py-2 px-3 font-semibold">{day.label}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-indigo-600">
                        {day.revenue_vnd.toLocaleString('vi-VN')} ₫
                      </td>
                      <td className="py-2 px-3 text-right font-mono">{day.order_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* Biểu đồ cột có Trục Y rõ ràng */
            <div className="space-y-2">
              <div className="h-56 w-full flex items-end gap-2 pt-4">
                {/* Trục Y đánh dấu giá trị tiền tệ */}
                <div className="h-44 flex flex-col justify-between text-[10px] font-mono text-slate-400 pr-2 border-r border-slate-200 dark:border-slate-800 text-right select-none">
                  <span>{(yAxisMax / 1000).toLocaleString('vi-VN')}k</span>
                  <span>{(yAxisMid / 1000).toLocaleString('vi-VN')}k</span>
                  <span>0 ₫</span>
                </div>

                {/* Các cột dữ liệu 7 ngày */}
                <div className="flex-1 h-44 flex items-end justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-0.5">
                  {summary.revenue_trend_7d.map((day) => {
                    const heightPercent =
                      yAxisMax > 0
                        ? Math.max(6, Math.round((day.revenue_vnd / yAxisMax) * 100))
                        : 6;

                    return (
                      <div
                        key={day.date}
                        className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end"
                        tabIndex={0}
                        aria-label={`${day.label}: ${day.revenue_vnd.toLocaleString('vi-VN')} đ (${day.order_count} đơn)`}
                      >
                        {/* Tooltip Hover / Focus */}
                        <div className="absolute -top-12 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] p-2 rounded-lg pointer-events-none whitespace-nowrap shadow-xl z-10 text-center">
                          <p className="font-bold text-indigo-300">
                            {day.revenue_vnd.toLocaleString('vi-VN')} ₫
                          </p>
                          <p className="text-slate-400">{day.order_count} đơn hàng</p>
                        </div>

                        {/* Cột hiển thị gradient */}
                        <div className="w-full max-w-[36px] flex items-end justify-center h-full bg-slate-100 dark:bg-slate-800/40 rounded-t-lg overflow-hidden">
                          <div
                            style={{ height: `${heightPercent}%` }}
                            className="w-full bg-gradient-to-t from-indigo-600 to-purple-500 rounded-t-md transition-all duration-500 group-hover:from-indigo-500 group-hover:to-purple-400"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Trục X nhãn thứ trong tuần */}
              <div className="flex justify-between pl-12 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                {summary.revenue_trend_7d.map((day) => (
                  <span key={day.date} className="flex-1 text-center">
                    {day.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span>Đơn vị: Việt Nam Đồng (VND)</span>
            <span>Rê chuột vào cột để xem số đơn và giá trị</span>
          </div>
        </Card>

        {/* Phân Bổ Nguồn Đơn Hàng (AI vs Thủ công) */}
        <Card className="space-y-4 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>Nguồn Gốc Đơn Hàng</span>
            </h2>
            <p className="text-xs text-slate-400">Tỷ lệ đơn tự động qua AI vs Tạo tay</p>
          </div>

          <div className="space-y-4 my-auto py-2">
            {/* Visual Ratio Meter */}
            <div className="h-3.5 w-full rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800">
              <div
                style={{ width: `${clipboardPercent}%` }}
                className="bg-purple-600 transition-all duration-500"
                title={`AI Dán tin: ${clipboardPercent}%`}
              />
              <div
                style={{ width: `${manualPercent}%` }}
                className="bg-slate-400 dark:bg-slate-600 transition-all duration-500"
                title={`Thủ công: ${manualPercent}%`}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-purple-600" />
                  <span className="font-semibold text-purple-900 dark:text-purple-200">
                    Dán tin AI
                  </span>
                </div>
                <span className="font-bold text-purple-700 dark:text-purple-300">
                  {summary.orders_by_source.clipboard} đơn ({clipboardPercent}%)
                </span>
              </div>

              <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-slate-400" />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Tạo thủ công
                  </span>
                </div>
                <span className="font-bold text-slate-600 dark:text-slate-400">
                  {summary.orders_by_source.manual} đơn ({manualPercent}%)
                </span>
              </div>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate('/orders')}
            className="w-full text-xs"
          >
            Xem danh sách đơn chi tiết <ChevronRight className="w-3.5 h-3.5 ml-1 inline" />
          </Button>
        </Card>
      </div>

      {/* 5. Khối HẠN MỨC AI THÁNG NÀY (Thân thiện, không lộ thuật ngữ) */}
      <Card className="space-y-4 border-purple-200 dark:border-purple-900/60 bg-gradient-to-br from-white via-purple-50/20 to-indigo-50/20 dark:from-slate-900 dark:via-purple-950/10 dark:to-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <span>Lượt Dùng AI Tháng Này</span>
              <Badge variant="ai" size="sm">
                {summary.ai_usage.model_name || 'Gemini 1.5 Flash'}
              </Badge>
            </h2>
            <p className="text-xs text-slate-500">
              Số lượt bóc tách đơn hàng thông minh còn lại theo gói dịch vụ shop đang dùng
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-base font-extrabold text-purple-600 dark:text-purple-400 font-mono">
              {summary.ai_usage.used_this_month} / {summary.ai_usage.monthly_limit} lượt
            </span>
            <p className="text-[11px] text-slate-400">
              Còn lại: <b>{summary.ai_usage.remaining}</b> lượt trong tháng
            </p>
          </div>
        </div>

        {/* Thanh tiến trình hạn mức */}
        <div className="space-y-1.5">
          <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              style={{ width: `${summary.ai_usage.usage_percentage}%` }}
              className={`h-full transition-all duration-500 rounded-full ${
                summary.ai_usage.is_near_limit
                  ? 'bg-rose-500'
                  : summary.ai_usage.usage_percentage > 60
                  ? 'bg-amber-500'
                  : 'bg-purple-600'
              }`}
            />
          </div>
        </div>

        {/* Chế độ xem kỹ thuật (Thu gọn mặc định) */}
        {techMode && (
          <div className="pt-3 border-t border-purple-100 dark:border-purple-900/40 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900 dark:text-purple-300">
              <Cpu className="w-3.5 h-3.5" />
              <span>Thông số kỹ thuật Telemetry & Giám sát hệ thống:</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center">
                <p className="text-[11px] text-slate-400">Độ trễ trung bình</p>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 font-mono mt-0.5">
                  {summary.ai_usage.avg_latency_ms} ms
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center">
                <p className="text-[11px] text-slate-400">Độ trễ p50 (Trung vị)</p>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                  {summary.ai_usage.p50_latency_ms} ms
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center">
                <p className="text-[11px] text-slate-400">Độ trễ p95 (Chậm nhất)</p>
                <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 font-mono mt-0.5">
                  {summary.ai_usage.p95_latency_ms} ms
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center">
                <p className="text-[11px] text-slate-400">Tổng Token tiêu thụ</p>
                <p className="text-sm font-bold text-purple-600 dark:text-purple-400 font-mono mt-0.5">
                  {summary.ai_usage.total_tokens_used.toLocaleString('vi-VN')}
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Modals hỗ trợ tạo và duyệt đơn */}
      <MessageIngestionModal
        isOpen={isAiIngestOpen}
        onClose={() => setIsAiIngestOpen(false)}
        onAnalysisSuccess={handleAiSuccess}
      />

      <DraftOrderReviewModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        reviewData={reviewResult}
        onOrderConfirmed={handleConfirmedOrder}
      />
    </div>
  );
};

export default DashboardPage;
