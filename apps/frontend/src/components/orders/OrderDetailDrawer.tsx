import React, { useState } from 'react';
import {
  Phone,
  Copy,
  Check,
  Share2,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
  Sparkles,
  PenLine,
  ShieldAlert
} from 'lucide-react';
import Drawer from '../ui/Drawer';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import MoneyText from '../ui/MoneyText';
import { useToast } from '../ui/Toast';
import { formatRelativeTime } from '../../utils/format';
import { OrderStatus, OrderSource } from '../../pages/OrdersPage';

export interface OrderItem {
  id: string;
  product_variant_id: string;
  snap_product_name: string;
  snap_variant_name: string;
  snap_sku: string;
  snap_price_vnd: number;
  quantity: number;
  subtotal_vnd: number;
}

export interface OrderDetail {
  id: string;
  order_number: number;
  customer_name: string;
  customer_phone: string;
  shipping_address: string;
  subtotal_vnd: number;
  shipping_fee_vnd: number;
  discount_vnd: number;
  total_vnd: number;
  notes?: string | null;
  status: OrderStatus;
  source: OrderSource;
  created_at: string;
  items: OrderItem[];
}

interface OrderDetailDrawerProps {
  order: OrderDetail | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmDraft: (order: OrderDetail) => void;
  onUpdateStatus: (order: OrderDetail, newStatus: OrderStatus) => void;
  onRequestCancel: (order: OrderDetail) => void;
}

export const OrderDetailDrawer: React.FC<OrderDetailDrawerProps> = ({
  order,
  isOpen,
  onClose,
  onConfirmDraft,
  onUpdateStatus,
  onRequestCancel,
}) => {
  const { showToast } = useToast();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!order) return null;

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

  const handleCopyZaloMessage = () => {
    const itemsSummary = order.items
      .map(
        (i) =>
          `• ${i.snap_product_name} (${i.snap_variant_name}) x${i.quantity} = ${i.subtotal_vnd.toLocaleString('vi-VN')}₫`
      )
      .join('\n');

    const msg = `Dạ Shop May xin gửi thông tin xác nhận đơn hàng #${order.order_number} của anh/chị ${order.customer_name}:
${itemsSummary}
- Tiền hàng: ${order.subtotal_vnd.toLocaleString('vi-VN')}₫
${order.shipping_fee_vnd > 0 ? `- Phí ship: +${order.shipping_fee_vnd.toLocaleString('vi-VN')}₫\n` : ''}${
      order.discount_vnd > 0 ? `- Giảm giá: -${order.discount_vnd.toLocaleString('vi-VN')}₫\n` : ''
    }- TỔNG THANH TOÁN: ${order.total_vnd.toLocaleString('vi-VN')}₫
- Địa chỉ nhận: ${order.shipping_address}
- Số điện thoại: ${order.customer_phone}

Dạ đơn hàng sẽ được giao trong 2-3 ngày tới. Cảm ơn anh/chị đã ủng hộ shop ạ! ✨`;

    handleCopy(msg, 'tin nhắn xác nhận đơn cho Zalo/Messenger', 'zalo');
  };

  const renderStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'DRAFT':
        return (
          <Badge variant="uncertain" size="sm">
            <Clock className="w-3.5 h-3.5 mr-1" />
            Bản nháp (Chưa trừ kho)
          </Badge>
        );
      case 'CONFIRMED':
        return (
          <Badge variant="success" size="sm">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            Đã xác nhận (Đã trừ kho)
          </Badge>
        );
      case 'SHIPPING':
        return (
          <Badge variant="system" size="sm">
            <Truck className="w-3.5 h-3.5 mr-1" />
            Đang giao hàng
          </Badge>
        );
      case 'DELIVERED':
        return (
          <Badge variant="success" size="sm">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            Hoàn tất thành công
          </Badge>
        );
      case 'CANCELLED':
        return (
          <Badge variant="danger" size="sm">
            <XCircle className="w-3.5 h-3.5 mr-1" />
            Đã hủy (Đã hoàn kho)
          </Badge>
        );
      default:
        return <Badge size="sm">{status}</Badge>;
    }
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      width="max-w-2xl"
      title={
        <div className="flex items-center gap-2">
          <span className="font-mono text-xl font-bold text-indigo-600 dark:text-indigo-400">
            #{order.order_number}
          </span>
          {renderStatusBadge(order.status)}
        </div>
      }
      subtitle={
        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
          <span>Tạo {formatRelativeTime(order.created_at)}</span>
          <span>•</span>
          <span title={new Date(order.created_at).toLocaleString('vi-VN')}>
            {new Date(order.created_at).toLocaleTimeString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
            })}{' '}
            {new Date(order.created_at).toLocaleDateString('vi-VN')}
          </span>
          <span>•</span>
          {order.source === 'CLIPBOARD' ? (
            <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-medium">
              <Sparkles className="w-3 h-3" /> AI Dán tin
            </span>
          ) : (
            <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400 font-medium">
              <PenLine className="w-3 h-3" /> Thủ công
            </span>
          )}
        </div>
      }
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            {order.status === 'DRAFT' || order.status === 'CONFIRMED' ? (
              <Button
                variant="outline"
                size="sm"
                className="text-rose-600 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                onClick={() => {
                  onRequestCancel(order);
                }}
              >
                <XCircle className="w-4 h-4 mr-1.5" />
                Hủy đơn hàng
              </Button>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            {order.status === 'DRAFT' && (
              <Button
                variant="primary"
                onClick={() => {
                  onConfirmDraft(order);
                }}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                Chốt & Trừ kho
              </Button>
            )}

            {order.status === 'CONFIRMED' && (
              <Button
                variant="secondary"
                onClick={() => {
                  onUpdateStatus(order, 'SHIPPING');
                }}
              >
                <Truck className="w-4 h-4 mr-1.5" />
                Bắt đầu giao hàng
              </Button>
            )}

            {order.status === 'SHIPPING' && (
              <Button
                variant="primary"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => {
                  onUpdateStatus(order, 'DELIVERED');
                }}
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                Xác nhận đã giao thành công
              </Button>
            )}

            <Button variant="outline" onClick={onClose}>
              Đóng
            </Button>
          </div>
        </div>
      }
    >
      {/* 1. Thanh thao tác nhanh */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <button
          type="button"
          onClick={handleCopyZaloMessage}
          className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100/60 transition-colors text-xs font-semibold"
        >
          {copiedField === 'zalo' ? (
            <Check className="w-4 h-4 text-emerald-600" />
          ) : (
            <Share2 className="w-4 h-4 text-indigo-600" />
          )}
          <span>Sao chép tin nhắn Zalo / FB</span>
        </button>

        <a
          href={`tel:${order.customer_phone}`}
          className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-xs font-semibold text-slate-700 dark:text-slate-200"
        >
          <Phone className="w-4 h-4 text-emerald-600" />
          <span>Gọi ngay: {order.customer_phone}</span>
        </a>
      </div>

      {/* 2. Thẻ Khách hàng */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Thông tin người nhận
          </span>
          <button
            type="button"
            onClick={() => handleCopy(order.shipping_address, 'địa chỉ giao hàng', 'address')}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            {copiedField === 'address' ? (
              <Check className="w-3 h-3 text-emerald-600" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
            <span>Sao chép địa chỉ</span>
          </button>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-sm shrink-0">
            {getInitials(order.customer_name)}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {order.customer_name}
            </h4>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-slate-600 dark:text-slate-300 font-mono">
                {order.customer_phone}
              </span>
              <button
                type="button"
                onClick={() => handleCopy(order.customer_phone, 'số điện thoại', 'phone')}
                className="text-slate-400 hover:text-slate-600 p-0.5"
                title="Sao chép SĐT"
              >
                {copiedField === 'phone' ? (
                  <Check className="w-3 h-3 text-emerald-600" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
              📍 {order.shipping_address}
            </p>
          </div>
        </div>

        {order.notes && (
          <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
            <span className="font-semibold shrink-0">Ghi chú:</span>
            <span>{order.notes}</span>
          </div>
        )}
      </div>

      {/* 3. Danh sách sản phẩm mua */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Chi tiết mặt hàng ({order.items.length})
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            Tổng {order.items.reduce((s, i) => s + i.quantity, 0)} sản phẩm
          </span>
        </div>

        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="p-3.5 flex items-center justify-between gap-4 bg-white dark:bg-slate-900 hover:bg-slate-50/60 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                  {item.snap_product_name}
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                  <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-medium text-slate-700 dark:text-slate-300">
                    Phân loại: {item.snap_variant_name}
                  </span>
                  <span className="font-mono text-slate-400">
                    SKU: {item.snap_sku}
                  </span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-xs text-slate-500">
                  <MoneyText amount={item.snap_price_vnd} /> × {item.quantity}
                </div>
                <div className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-0.5">
                  <MoneyText amount={item.subtotal_vnd} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Tổng kết tài chính */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 space-y-2 text-xs">
        <div className="flex justify-between text-slate-600 dark:text-slate-400">
          <span>Tiền hàng:</span>
          <MoneyText amount={order.subtotal_vnd} />
        </div>
        <div className="flex justify-between text-slate-600 dark:text-slate-400">
          <span>Phí giao hàng:</span>
          <span>{order.shipping_fee_vnd > 0 ? `+ ${order.shipping_fee_vnd.toLocaleString('vi-VN')} ₫` : 'Miễn phí'}</span>
        </div>
        {order.discount_vnd > 0 && (
          <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
            <span>Khuyến mãi / Giảm giá:</span>
            <span>- {order.discount_vnd.toLocaleString('vi-VN')} ₫</span>
          </div>
        )}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-baseline">
          <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Tổng thanh toán:
          </span>
          <span className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400">
            <MoneyText amount={order.total_vnd} />
          </span>
        </div>
      </div>

      {/* 5. Cảnh báo an toàn kho */}
      {order.status === 'DRAFT' && (
        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
          <span>
            Đơn hàng đang ở trạng thái <b>Bản nháp</b>. Tồn kho sản phẩm chưa bị trừ. Bấm <b>Chốt & Trừ kho</b> để chuyển sang Đã xác nhận và đảm bảo không bán trùng.
          </span>
        </div>
      )}

      {order.status === 'CONFIRMED' && (
        <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
          <span>
            Đã giữ tồn kho an toàn cho đơn hàng này. Khi shipper đến lấy hàng, bấm <b>Bắt đầu giao hàng</b> để theo dõi tiến độ vận chuyển.
          </span>
        </div>
      )}
    </Drawer>
  );
};

export default OrderDetailDrawer;
