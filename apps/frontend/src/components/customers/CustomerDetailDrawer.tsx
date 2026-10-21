import React, { useState, useEffect } from 'react';
import {
  Phone,
  Copy,
  Check,
  ShoppingBag,
  Plus,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  FileText
} from 'lucide-react';
import Drawer from '../ui/Drawer';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import MoneyText from '../ui/MoneyText';
import Skeleton from '../ui/Skeleton';
import { useToast } from '../ui/Toast';
import { apiClient } from '../../services/api';
import { formatRelativeTime } from '../../utils/format';

export interface CustomerDetail {
  id: string;
  name: string;
  phone: string;
  address?: string | null;
  notes?: string | null;
  total_orders?: number;
  total_spent_vnd?: number;
  total_spend_vnd?: number;
  created_at: string;
}

interface CustomerOrder {
  id: string;
  order_number: number;
  customer_name: string;
  customer_phone: string;
  shipping_address: string;
  subtotal_vnd: number;
  total_vnd: number;
  status: string;
  created_at: string;
  items: Array<{
    id: string;
    snap_product_name: string;
    snap_variant_name: string;
    quantity: number;
    subtotal_vnd: number;
  }>;
}

interface CustomerDetailDrawerProps {
  customer: CustomerDetail | null;
  isOpen: boolean;
  onClose: () => void;
  onCreateOrderForCustomer?: (customer: CustomerDetail) => void;
}

export const CustomerDetailDrawer: React.FC<CustomerDetailDrawerProps> = ({
  customer,
  isOpen,
  onClose,
  onCreateOrderForCustomer,
}) => {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (customer && isOpen) {
      setIsLoadingOrders(true);
      apiClient
        .get<{ data: { items: CustomerOrder[] } }>('/orders', {
          params: { search: customer.phone },
        })
        .then((res) => {
          setOrders(res.data.items);
        })
        .catch(() => {
          setOrders([]);
        })
        .finally(() => {
          setIsLoadingOrders(false);
        });
    }
  }, [customer, isOpen]);

  if (!customer) return null;

  const totalSpent = customer.total_spent_vnd ?? customer.total_spend_vnd ?? 0;
  const orderCount = customer.total_orders ?? orders.length;
  const averageOrderValue = orderCount > 0 ? Math.round(totalSpent / orderCount) : 0;
  const isRegular = orderCount >= 3;

  const handleCopy = async (text: string, label: string, fieldKey: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldKey);
      showToast(`Đã sao chép ${label}`, 'success');
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      showToast(`Không thể sao chép ${label}`, 'error');
    }
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return (
          <Badge variant="uncertain" size="sm">
            <Clock className="w-3 h-3 mr-1" /> Bản nháp
          </Badge>
        );
      case 'CONFIRMED':
        return (
          <Badge variant="success" size="sm">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Đã xác nhận
          </Badge>
        );
      case 'SHIPPING':
        return (
          <Badge variant="system" size="sm">
            <Truck className="w-3 h-3 mr-1" /> Đang giao
          </Badge>
        );
      case 'DELIVERED':
        return (
          <Badge variant="success" size="sm">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Hoàn thành
          </Badge>
        );
      case 'CANCELLED':
        return (
          <Badge variant="danger" size="sm">
            <XCircle className="w-3 h-3 mr-1" /> Đã hủy
          </Badge>
        );
      default:
        return <Badge size="sm">{status}</Badge>;
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      width="max-w-xl"
      title={
        <div className="flex items-center gap-2.5">
          <span>{customer.name}</span>
          {isRegular ? (
            <Badge variant="system" size="sm">
              Khách quen (&ge; 3 đơn)
            </Badge>
          ) : (
            <Badge variant="default" size="sm">
              Khách mới
            </Badge>
          )}
        </div>
      }
      subtitle={
        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 font-mono">
          <span>{customer.phone}</span>
          <span>•</span>
          <span>Tham gia {formatRelativeTime(customer.created_at)}</span>
        </div>
      }
      footer={
        <div className="flex items-center justify-between gap-3">
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>

          {onCreateOrderForCustomer && (
            <Button
              variant="primary"
              onClick={() => {
                onClose();
                onCreateOrderForCustomer(customer);
              }}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Tạo đơn mới cho khách này
            </Button>
          )}
        </div>
      }
    >
      {/* 1. Header Card với Avatar và Thao tác nhanh */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
            {getInitials(customer.name)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
              {customer.name}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              📍 {customer.address || 'Chưa cập nhật địa chỉ giao hàng'}
            </p>
          </div>
        </div>

        {/* Nút hành động nhanh: Gọi & Sao chép */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <a
            href={`tel:${customer.phone}`}
            className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold hover:bg-emerald-100/70 transition-colors"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Gọi ngay</span>
          </a>

          <button
            type="button"
            onClick={() => handleCopy(customer.phone, 'số điện thoại', 'phone')}
            className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-200 transition-colors"
          >
            {copiedField === 'phone' ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span>Sao chép SĐT</span>
          </button>
        </div>
      </div>

      {/* 2. Thẻ chỉ số tài chính (CRM KPIs) */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <span className="text-[11px] text-slate-400 block">Tổng đơn mua</span>
          <span className="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono mt-0.5 block">
            {orderCount}
          </span>
        </div>

        <div className="p-3 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/30 dark:bg-indigo-950/20">
          <span className="text-[11px] text-indigo-600 dark:text-indigo-400 block font-medium">
            Tổng chi tiêu
          </span>
          <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400 block mt-0.5">
            <MoneyText amount={totalSpent} />
          </span>
        </div>

        <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <span className="text-[11px] text-slate-400 block">TB/đơn (AOV)</span>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mt-1">
            <MoneyText amount={averageOrderValue} />
          </span>
        </div>
      </div>

      {/* 3. Ghi chú sở thích khách hàng */}
      {customer.notes && (
        <div className="p-3.5 rounded-xl border border-amber-200/80 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            Lưu ý & Sở thích mua sắm
          </span>
          <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed italic">
            "{customer.notes}"
          </p>
        </div>
      )}

      {/* 4. Lịch sử đơn hàng của khách */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <ShoppingBag className="w-3.5 h-3.5" />
            Lịch sử đơn hàng ({orders.length})
          </h4>
        </div>

        {isLoadingOrders ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 text-xs">
            Khách hàng chưa có lịch sử đơn hàng nào
          </div>
        ) : (
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
            {orders.map((o) => (
              <div
                key={o.id}
                className="p-3.5 bg-white dark:bg-slate-900 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-indigo-600 dark:text-indigo-400">
                      #{o.order_number}
                    </span>
                    {renderStatusBadge(o.status)}
                  </div>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    <MoneyText amount={o.total_vnd} />
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500">
                  <div className="truncate max-w-xs">
                    {o.items.map((i) => `${i.snap_product_name} (${i.snap_variant_name}) x${i.quantity}`).join(', ')}
                  </div>
                  <span className="text-[11px] shrink-0">
                    {formatRelativeTime(o.created_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Drawer>
  );
};

export default CustomerDetailDrawer;
