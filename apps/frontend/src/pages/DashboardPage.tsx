import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
        <Skeleton className="h-24 w-full rounded-2xl" />
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
        <span className="text-4xl">⚠️</span>
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

  // Tìm doanh thu lớn nhất trong 7 ngày để scale chiều cao cột SVG
  const maxDailyRevenue = Math.max(...summary.revenue_trend_7d.map((d) => d.revenue_vnd), 1);

  // Tính tỷ lệ % nguồn đơn
  const totalSources = summary.orders_by_source.clipboard + summary.orders_by_source.manual;
  const clipboardPercent =
    totalSources > 0 ? Math.round((summary.orders_by_source.clipboard / totalSources) * 100) : 0;
  const manualPercent = 100 - clipboardPercent;

  return (
    <div className="space-y-6">
      {/* 1. Header & Lời chào */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 p-6 rounded-2xl text-white shadow-md">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-bold">
              👋 Xin chào, {user?.full_name || 'Chủ shop'}!
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-white/20 text-indigo-100">
              {user?.shop?.name || 'ShopFlow AI'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-indigo-200">
            Hôm nay bạn có{' '}
            <b>{(summary.orders_by_status.CONFIRMED || 0) + (summary.orders_by_status.SHIPPING || 0)}</b> đơn đang xử
            lý và <b>{summary.ai_usage.remaining}</b> lượt phân tích AI còn lại trong tháng.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            type="button"
            variant="primary"
            onClick={() => setIsAiIngestOpen(true)}
            className="bg-purple-500 hover:bg-purple-600 active:bg-purple-700 text-white shadow font-semibold"
          >
            ⚡ Dán tin tạo đơn AI
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/orders')}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs"
          >
            📋 Quản lý đơn
          </Button>
        </div>
      </div>

      {/* 2. Thẻ KPI Kinh Doanh (4 Thẻ) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Doanh Thu */}
        <Card className="hover:border-indigo-300 dark:hover:border-indigo-700 transition">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold uppercase tracking-wider">Doanh thu thuần</span>
              <span className="text-base">💰</span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
              <MoneyText amount={summary.kpis.total_revenue_vnd} />
            </div>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center space-x-1">
              <span>✓ Tính từ các đơn đã xác nhận & hoàn thành</span>
            </p>
          </div>
        </Card>

        {/* KPI 2: Tổng Đơn Hàng */}
        <Card className="hover:border-indigo-300 dark:hover:border-indigo-700 transition">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold uppercase tracking-wider">Tổng đơn hàng</span>
              <span className="text-base">📦</span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {summary.kpis.total_orders} <span className="text-xs font-normal text-slate-400">đơn</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
              <span className="text-emerald-600 font-semibold">{summary.orders_by_status.CONFIRMED || 0} chốt</span>
              <span>•</span>
              <span className="text-sky-600 font-semibold">{summary.orders_by_status.SHIPPING || 0} giao</span>
              <span>•</span>
              <span className="text-indigo-600 font-semibold">{summary.orders_by_status.DELIVERED || 0} xong</span>
              <span>•</span>
              <span className="text-amber-600 font-semibold">{summary.orders_by_status.DRAFT || 0} nháp</span>
            </div>
          </div>
        </Card>

        {/* KPI 3: Tỷ Lệ Chuyển Đổi AI */}
        <Card className="hover:border-purple-300 dark:hover:border-purple-700 transition">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold uppercase tracking-wider">Hiệu quả chốt đơn AI</span>
              <span className="text-base">⚡</span>
            </div>
            <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
              {summary.kpis.ai_conversion_rate}%
            </div>
            <p className="text-[11px] text-slate-500">
              Đã bóc tách <b>{summary.kpis.ai_orders_count}</b> đơn từ tin nhắn chat
            </p>
          </div>
        </Card>

        {/* KPI 4: Sản Phẩm & Cảnh Báo Kho */}
        <Card className="hover:border-indigo-300 dark:hover:border-indigo-700 transition">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold uppercase tracking-wider">Mặt hàng trong kho</span>
              <span className="text-base">👗</span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {summary.kpis.active_products_count}{' '}
              <span className="text-xs font-normal text-slate-400">SKU</span>
            </div>
            <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
              ⚠️ {summary.kpis.low_stock_products_count} mặt hàng sắp hết kho
            </p>
          </div>
        </Card>
      </div>

      {/* 3. Biểu đồ Doanh Thu 7 Ngày & Phân Bổ Nguồn Đơn */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Biểu đồ Cột SVG 7 Ngày (2 Cột trên màn lớn) */}
        <Card className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                📈 Biểu Đồ Doanh Thu 7 Ngày Gần Nhất
              </h2>
              <p className="text-xs text-slate-400">Xu hướng dòng tiền bán hàng theo mốc thời gian</p>
            </div>
            <Badge variant="system" size="sm">
              Tự động cập nhật
            </Badge>
          </div>

          {/* SVG Bar Chart Tối Giản, Nhẹ, Không Phình Bundle */}
          <div className="h-56 w-full pt-4 flex items-end justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
            {summary.revenue_trend_7d.map((day) => {
              const heightPercent =
                maxDailyRevenue > 0
                  ? Math.max(8, Math.round((day.revenue_vnd / maxDailyRevenue) * 100))
                  : 8;

              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                  {/* Tooltip Hover */}
                  <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] p-1.5 rounded-lg pointer-events-none whitespace-nowrap shadow-lg z-10 text-center">
                    <p className="font-bold">{day.revenue_vnd.toLocaleString('vi-VN')} đ</p>
                    <p className="text-slate-400">{day.order_count} đơn hàng</p>
                  </div>

                  {/* Cột hiển thị */}
                  <div className="w-full max-w-[40px] flex items-end justify-center h-44 bg-slate-100 dark:bg-slate-800/40 rounded-t-lg overflow-hidden">
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full bg-gradient-to-t from-indigo-600 to-purple-500 rounded-t-md transition-all duration-500 group-hover:from-indigo-500 group-hover:to-purple-400"
                    />
                  </div>

                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    {day.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
            <span>Đơn vị: Đồng (VND)</span>
            <span>Rê chuột vào từng cột để xem chi tiết đơn</span>
          </div>
        </Card>

        {/* Phân Bổ Nguồn Đơn Hàng (AI vs Thủ công) */}
        <Card className="space-y-4 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              🎯 Nguồn Gốc Đơn Hàng
            </h2>
            <p className="text-xs text-slate-400">Tỷ lệ đơn tự động qua AI vs Tạo tay</p>
          </div>

          <div className="space-y-4 my-auto py-2">
            {/* Visual Ratio Meter */}
            <div className="h-4 w-full rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800">
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
              <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-purple-600" />
                  <span className="font-semibold text-purple-900 dark:text-purple-200">
                    ⚡ Dán tin AI (Clipboard)
                  </span>
                </div>
                <span className="font-bold text-purple-700 dark:text-purple-300">
                  {summary.orders_by_source.clipboard} đơn ({clipboardPercent}%)
                </span>
              </div>

              <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-slate-400" />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    ✍️ Tạo thủ công
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
            Xem danh sách đơn chi tiết →
          </Button>
        </Card>
      </div>

      {/* 4. Khối HẠN MỨC & GIÁM SÁT AI (Telemetry & Quota) */}
      <Card className="space-y-5 border-purple-200 dark:border-purple-900/60 bg-gradient-to-br from-white via-purple-50/20 to-indigo-50/20 dark:from-slate-900 dark:via-purple-950/10 dark:to-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
              <span>⚡ Hạn Mức & Giám Sát AI Tháng Này</span>
              <Badge variant="ai" size="sm">
                {summary.ai_usage.model_name || 'Google Gemini 1.5 Flash'}
              </Badge>
            </h2>
            <p className="text-xs text-slate-500">
              Kiểm soát số lượt gọi, độ trễ và tổng token tiêu thụ theo gói dịch vụ
            </p>
          </div>

          <div className="text-right">
            <span className="text-sm font-extrabold text-purple-600 dark:text-purple-400">
              {summary.ai_usage.used_this_month} / {summary.ai_usage.monthly_limit} lượt
            </span>
            <p className="text-[11px] text-slate-400">
              Còn lại: <b>{summary.ai_usage.remaining}</b> lượt trong tháng
            </p>
          </div>
        </div>

        {/* Thanh tiến trình hạn mức (Progress bar) */}
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

          {summary.ai_usage.is_near_limit && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 rounded-xl text-xs text-amber-800 dark:text-amber-200 flex items-center space-x-2">
              <span className="text-base">⚠️</span>
              <p>
                <b>Cảnh báo hạn mức:</b> Cửa hàng đã sử dụng {summary.ai_usage.usage_percentage}% số
                lượt phân tích AI trong tháng. Khi đạt 100%, bạn vẫn có thể tạo đơn hàng thủ công bình
                thường.
              </p>
            </div>
          )}
        </div>

        {/* Bảng Chỉ Số Giám Sát Telemetry */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-400">Độ trễ trung bình</p>
            <p className="text-base font-bold text-slate-800 dark:text-slate-200 mt-1">
              {summary.ai_usage.avg_latency_ms} ms
            </p>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-400">Độ trễ p50 (Trung vị)</p>
            <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {summary.ai_usage.p50_latency_ms} ms
            </p>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-400">Độ trễ p95 (Chậm nhất)</p>
            <p className="text-base font-bold text-indigo-600 dark:text-indigo-400 mt-1">
              {summary.ai_usage.p95_latency_ms} ms
            </p>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-400">Tổng Token tiêu thụ</p>
            <p className="text-base font-bold text-purple-600 dark:text-purple-400 mt-1">
              {summary.ai_usage.total_tokens_used.toLocaleString('vi-VN')}
            </p>
          </div>
        </div>
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
