import React, { useState, useEffect, useCallback } from 'react';
import { apiClient, ApiClientError } from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import MoneyText from '../components/ui/MoneyText';
import { useToast } from '../components/ui/Toast';
import MessageIngestionModal from '../components/ai/MessageIngestionModal';
import DraftOrderReviewModal from '../components/ai/DraftOrderReviewModal';
import { ProcessedAIDraftResult } from '../types/ai.types';
import { formatRelativeTime } from '../utils/format';

export type OrderStatus =
  | 'DRAFT'
  | 'CONFIRMED'
  | 'SHIPPING'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURNED';

export type OrderSource = 'MANUAL' | 'CLIPBOARD';

interface OrderItem {
  id: string;
  product_variant_id: string;
  snap_product_name: string;
  snap_variant_name: string;
  snap_sku: string;
  snap_price_vnd: number;
  quantity: number;
  subtotal_vnd: number;
}

interface Order {
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
  customer?: { id: string; name: string; phone: string } | null;
}

interface ProductVariantFlat {
  id: string;
  productName: string;
  variantName: string;
  sku: string;
  price_vnd: number;
  stock: number;
}

export const OrdersPage: React.FC = () => {
  const { showToast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal Tạo đơn hàng & Duyệt đơn AI
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [currentAiReviewResult, setCurrentAiReviewResult] = useState<ProcessedAIDraftResult | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [availableVariants, setAvailableVariants] = useState<ProductVariantFlat[]>([]);
  const [isLoadingVariants, setIsLoadingVariants] = useState(false);

  const handleAiAnalysisSuccess = (result: ProcessedAIDraftResult) => {
    fetchOrders();
    setCurrentAiReviewResult(result);
    setIsReviewModalOpen(true);
  };

  // Form State tạo đơn
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingFee, setShippingFee] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [orderNotes, setOrderNotes] = useState('');
  const [orderInitialStatus, setOrderInitialStatus] = useState<'DRAFT' | 'CONFIRMED'>('CONFIRMED');
  const [selectedItems, setSelectedItems] = useState<
    Array<{ variantId: string; quantity: number }>
  >([{ variantId: '', quantity: 1 }]);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal Hủy đơn hàng
  const [cancelModalOrder, setCancelModalOrder] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState('Khách đổi ý không muốn nhận hàng');
  const [isCancelling, setIsCancelling] = useState(false);

  // Fetch danh sách đơn hàng
  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const response = await apiClient.get<{ data: { items: Order[] } }>('/orders', {
        params: {
          search: searchTerm || undefined,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
        },
      });
      setOrders(response.data.items);
    } catch (err: any) {
      if (err instanceof ApiClientError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Không thể tải danh sách đơn hàng');
      }
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Tải danh sách biến thể sản phẩm phục vụ tạo đơn
  const loadProductVariants = async () => {
    setIsLoadingVariants(true);
    try {
      const response = await apiClient.get<{
        data: {
          items: Array<{
            id: string;
            name: string;
            variants: Array<{
              id: string;
              variant_name: string;
              sku: string;
              price_vnd: number;
              stock: number;
            }>;
          }>;
        };
      }>('/products');

      const flat: ProductVariantFlat[] = [];
      response.data.items.forEach((p) => {
        p.variants.forEach((v) => {
          flat.push({
            id: v.id,
            productName: p.name,
            variantName: v.variant_name,
            sku: v.sku,
            price_vnd: v.price_vnd,
            stock: v.stock,
          });
        });
      });
      setAvailableVariants(flat);
      if (flat.length > 0 && selectedItems[0].variantId === '') {
        setSelectedItems([{ variantId: flat[0].id, quantity: 1 }]);
      }
    } catch (err) {
      showToast('Không thể tải danh mục sản phẩm', 'error');
    } finally {
      setIsLoadingVariants(false);
    }
  };

  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true);
    setFormError('');
    setCustomerName('');
    setCustomerPhone('');
    setShippingAddress('');
    setShippingFee(0);
    setDiscount(0);
    setOrderNotes('');
    setOrderInitialStatus('CONFIRMED');
    loadProductVariants();
  };

  // Tính nhẩm số tiền khi tạo đơn
  const calculateFormTotal = () => {
    let subtotal = 0;
    selectedItems.forEach((item) => {
      const variant = availableVariants.find((v) => v.id === item.variantId);
      if (variant) {
        subtotal += variant.price_vnd * item.quantity;
      }
    });
    const total = Math.max(0, subtotal + (shippingFee || 0) - (discount || 0));
    return { subtotal, total };
  };

  const handleAddItemRow = () => {
    const firstId = availableVariants.length > 0 ? availableVariants[0].id : '';
    setSelectedItems((prev) => [...prev, { variantId: firstId, quantity: 1 }]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (selectedItems.length <= 1) return;
    setSelectedItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (
    index: number,
    field: 'variantId' | 'quantity',
    value: string | number
  ) => {
    setSelectedItems((prev) => {
      const updated = [...prev];
      if (field === 'variantId') {
        updated[index].variantId = String(value);
      } else {
        updated[index].quantity = Math.max(1, Number(value) || 1);
      }
      return updated;
    });
  };

  // Submit tạo đơn hàng mới
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!customerName.trim()) {
      setFormError('Vui lòng nhập họ tên khách hàng');
      return;
    }
    if (!/^[0-9+]{9,15}$/.test(customerPhone.trim())) {
      setFormError('Số điện thoại khách hàng không hợp lệ (9-15 chữ số)');
      return;
    }
    if (!shippingAddress.trim()) {
      setFormError('Vui lòng nhập địa chỉ giao hàng');
      return;
    }

    const validItems = selectedItems.filter((i) => i.variantId && i.quantity > 0);
    if (validItems.length === 0) {
      setFormError('Vui lòng chọn ít nhất 1 sản phẩm cho đơn hàng');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        shipping_address: shippingAddress.trim(),
        shipping_fee_vnd: Number(shippingFee) || 0,
        discount_vnd: Number(discount) || 0,
        notes: orderNotes.trim() || undefined,
        status: orderInitialStatus,
        source: 'MANUAL',
        items: validItems.map((item) => ({
          product_variant_id: item.variantId,
          quantity: item.quantity,
        })),
      };

      const res = await apiClient.post<{ data: { order: Order } }>('/orders', payload);
      showToast(
        `Tạo đơn hàng #${res.data.order.order_number} thành công!${
          orderInitialStatus === 'CONFIRMED' ? ' (Đã trừ kho nguyên tử)' : ' (Bản nháp)'
        }`,
        'success'
      );
      setIsCreateModalOpen(false);
      fetchOrders();
    } catch (err: any) {
      if (err instanceof ApiClientError) {
        setFormError(err.message);
      } else {
        setFormError('Có lỗi xảy ra khi tạo đơn hàng');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1. Duyệt đơn nháp (Xác nhận & trừ kho nguyên tử)
  const handleConfirmDraftOrder = async (order: Order) => {
    try {
      await apiClient.post(`/orders/${order.id}/confirm`, {});
      showToast(
        `Đã xác nhận đơn hàng #${order.order_number} và trừ kho nguyên tử thành công!`,
        'success'
      );
      fetchOrders();
    } catch (err: any) {
      const msg = err instanceof ApiClientError ? err.message : 'Không thể xác nhận đơn hàng';
      showToast(msg, 'error');
    }
  };

  // 2. Chuyển trạng thái giao hàng / hoàn thành
  const handleUpdateStatus = async (order: Order, newStatus: OrderStatus) => {
    try {
      await apiClient.post(`/orders/${order.id}/status`, { status: newStatus });
      const statusLabel =
        newStatus === 'SHIPPING'
          ? 'Đang giao hàng'
          : newStatus === 'DELIVERED'
          ? 'Hoàn thành'
          : newStatus;
      showToast(`Đơn hàng #${order.order_number} đã chuyển sang: ${statusLabel}`, 'success');
      fetchOrders();
    } catch (err: any) {
      const msg = err instanceof ApiClientError ? err.message : 'Lỗi khi cập nhật trạng thái đơn';
      showToast(msg, 'error');
    }
  };

  // 3. Hủy đơn hàng và hoàn kho
  const handleConfirmCancel = async () => {
    if (!cancelModalOrder) return;
    if (!cancelReason.trim()) {
      showToast('Vui lòng nhập lý do hủy đơn hàng', 'error');
      return;
    }

    setIsCancelling(true);
    try {
      await apiClient.post(`/orders/${cancelModalOrder.id}/cancel`, {
        reason: cancelReason.trim(),
      });
      showToast(
        `Đã hủy đơn hàng #${cancelModalOrder.order_number} (Tồn kho đã được hoàn lại)`,
        'success'
      );
      setCancelModalOrder(null);
      fetchOrders();
    } catch (err: any) {
      const msg = err instanceof ApiClientError ? err.message : 'Lỗi khi hủy đơn hàng';
      showToast(msg, 'error');
    } finally {
      setIsCancelling(false);
    }
  };

  // Render Badge theo trạng thái
  const renderStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'DRAFT':
        return (
          <Badge variant="uncertain" size="sm">
            📝 Bản nháp (Chưa trừ kho)
          </Badge>
        );
      case 'CONFIRMED':
        return (
          <Badge variant="success" size="sm">
            🔒 Đã xác nhận (Đã trừ kho)
          </Badge>
        );
      case 'SHIPPING':
        return (
          <Badge variant="system" size="sm">
            🚚 Đang giao hàng
          </Badge>
        );
      case 'DELIVERED':
        return (
          <Badge variant="success" size="sm">
            🎉 Đã hoàn thành
          </Badge>
        );
      case 'CANCELLED':
        return (
          <Badge variant="danger" size="sm">
            ✕ Đã hủy (Đã hoàn kho)
          </Badge>
        );
      case 'RETURNED':
        return (
          <Badge variant="danger" size="sm">
            ↩ Đã trả hàng
          </Badge>
        );
      default:
        return <Badge size="sm">{status}</Badge>;
    }
  };

  const { subtotal: formSubtotal, total: formTotal } = calculateFormTotal();

  return (
    <div className="space-y-6">
      {/* 1. Header & Nút hành động */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
            <span>📋 Quản Lý Đơn Hàng</span>
            <Badge variant="system" size="sm">
              Trừ kho nguyên tử
            </Badge>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Theo dõi vòng đời đơn, kiểm soát tồn kho tức thời và chốt đơn đa kênh
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            type="button"
            variant="primary"
            onClick={() => setIsAiModalOpen(true)}
            className="bg-purple-600 hover:bg-purple-700 active:bg-purple-800 shadow-sm"
          >
            ⚡ Dán tin AI
          </Button>
          <Button variant="outline" onClick={handleOpenCreateModal}>
            + Tạo đơn thủ công
          </Button>
        </div>
      </div>

      {/* 2. Bộ lọc trạng thái & Tìm kiếm */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="w-full md:w-80">
            <Input
              label=""
              placeholder="🔍 Tìm mã đơn (#1001), tên khách, SĐT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
            {[
              { id: 'ALL', label: 'Tất cả' },
              { id: 'DRAFT', label: '📝 Bản nháp' },
              { id: 'CONFIRMED', label: '🔒 Đã xác nhận' },
              { id: 'SHIPPING', label: '🚚 Đang giao' },
              { id: 'DELIVERED', label: '🎉 Hoàn thành' },
              { id: 'CANCELLED', label: '✕ Đã hủy' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  statusFilter === tab.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* 3. Danh sách đơn hàng */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-36 w-full rounded-xl" />
          <Skeleton className="h-36 w-full rounded-xl" />
          <Skeleton className="h-36 w-full rounded-xl" />
        </div>
      ) : errorMessage ? (
        <Card className="border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20">
          <div className="text-center py-8">
            <span className="text-3xl">⚠️</span>
            <h2 className="mt-2 text-base font-semibold text-rose-700 dark:text-rose-300">
              {errorMessage}
            </h2>
            <div className="mt-4">
              <Button variant="outline" size="sm" onClick={fetchOrders}>
                Thử lại
              </Button>
            </div>
          </div>
        </Card>
      ) : orders.length === 0 ? (
        <EmptyState
          icon="📦"
          title="Chưa có đơn hàng nào"
          description={
            statusFilter !== 'ALL' || searchTerm
              ? 'Không tìm thấy đơn hàng phù hợp với điều kiện lọc'
              : 'Hãy bắt đầu tạo đơn hàng đầu tiên của shop để kích hoạt hệ thống trừ kho tự động'
          }
          actionText="+ Tạo đơn hàng mới"
          onAction={handleOpenCreateModal}
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card
              key={order.id}
              className="hover:border-indigo-200 dark:hover:border-indigo-800 transition shadow-sm"
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                {/* Khối Thông tin Đơn hàng */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-base text-indigo-600 dark:text-indigo-400">
                      #{order.order_number}
                    </span>
                    {renderStatusBadge(order.status)}
                    {order.source === 'CLIPBOARD' ? (
                      <Badge variant="ai" size="sm">
                        ⚡ AI Dán tin
                      </Badge>
                    ) : (
                      <Badge variant="default" size="sm">
                        ✍️ Thủ công
                      </Badge>
                    )}
                    <span
                      className="text-xs text-slate-400"
                      title={new Date(order.created_at).toLocaleString('vi-VN')}
                    >
                      {formatRelativeTime(order.created_at)}
                    </span>
                  </div>

                  {/* Thông tin Khách hàng */}
                  <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 space-y-0.5">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      👤 {order.customer_name}{' '}
                      <span className="text-slate-500 font-normal">({order.customer_phone})</span>
                    </p>
                    <p className="text-slate-600 dark:text-slate-400">
                      📍 {order.shipping_address}
                    </p>
                    {order.notes && (
                      <p className="italic text-slate-500 dark:text-slate-400">
                        💬 Ghi chú: {order.notes}
                      </p>
                    )}
                  </div>

                  {/* Danh sách sản phẩm mua */}
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Sản phẩm ({order.items.length}):
                    </p>
                    <div className="space-y-1">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between text-xs py-1 px-2 rounded bg-slate-50 dark:bg-slate-800/40"
                        >
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-slate-800 dark:text-slate-200">
                              {item.snap_product_name}
                            </span>
                            <span className="text-slate-500">
                              ({item.snap_variant_name} - SKU: {item.snap_sku})
                            </span>
                            <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                              x{item.quantity}
                            </span>
                          </div>
                          <div>
                            <MoneyText amount={item.subtotal_vnd} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Khối Tài chính & Nút hành động */}
                <div className="lg:w-64 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-slate-800 pt-3 lg:pt-0 lg:pl-6 space-y-4">
                  <div className="space-y-1 text-right">
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Tiền hàng:</span>
                      <MoneyText amount={order.subtotal_vnd} />
                    </div>
                    {order.shipping_fee_vnd > 0 && (
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Phí ship:</span>
                        <span>+ <MoneyText amount={order.shipping_fee_vnd} /></span>
                      </div>
                    )}
                    {order.discount_vnd > 0 && (
                      <div className="flex justify-between text-xs text-emerald-600">
                        <span>Giảm giá:</span>
                        <span>- <MoneyText amount={order.discount_vnd} /></span>
                      </div>
                    )}
                    <div className="flex justify-between items-baseline pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Tổng tiền:
                      </span>
                      <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400">
                        <MoneyText amount={order.total_vnd} />
                      </span>
                    </div>
                  </div>

                  {/* Nút hành động tùy theo trạng thái */}
                  <div className="space-y-2">
                    {order.status === 'DRAFT' && (
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleConfirmDraftOrder(order)}
                        >
                          ✓ Chốt & Trừ kho
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCancelModalOrder(order)}
                        >
                          Hủy nháp
                        </Button>
                      </div>
                    )}

                    {order.status === 'CONFIRMED' && (
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleUpdateStatus(order, 'SHIPPING')}
                        >
                          🚚 Giao hàng
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCancelModalOrder(order)}
                        >
                          Hủy đơn
                        </Button>
                      </div>
                    )}

                    {order.status === 'SHIPPING' && (
                      <Button
                        variant="primary"
                        size="sm"
                        className="w-full"
                        onClick={() => handleUpdateStatus(order, 'DELIVERED')}
                      >
                        🎉 Đã giao thành công
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* 4. MODAL: Tạo Đơn Hàng Mới */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => !isSubmitting && setIsCreateModalOpen(false)}
        title="Tạo Đơn Hàng Mới (Thủ Công)"
      >
        <form onSubmit={handleCreateOrder} className="space-y-4">
          {formError && (
            <div
              className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg text-xs text-rose-700 dark:text-rose-300"
              role="alert"
            >
              ⚠️ {formError}
            </div>
          )}

          {/* Thông tin khách hàng */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
              1. Thông tin khách nhận hàng
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Họ và tên khách"
                placeholder="VD: Nguyễn Thị Mai"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
              <Input
                label="Số điện thoại"
                placeholder="VD: 0912345678"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                required
              />
            </div>
            <Input
              label="Địa chỉ nhận hàng chi tiết"
              placeholder="VD: 124 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM"
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              required
            />
          </div>

          {/* Chọn sản phẩm & Biến thể */}
          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                2. Mặt hàng đặt mua
              </h3>
              <button
                type="button"
                onClick={handleAddItemRow}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
              >
                + Thêm dòng sản phẩm
              </button>
            </div>

            {isLoadingVariants ? (
              <Skeleton className="h-10 w-full rounded-lg" />
            ) : availableVariants.length === 0 ? (
              <div className="text-xs text-amber-600 p-2 bg-amber-50 rounded">
                ⚠️ Cửa hàng chưa có sản phẩm nào. Vui lòng thêm sản phẩm trước khi tạo đơn.
              </div>
            ) : (
              <div className="space-y-2">
                {selectedItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <select
                      value={item.variantId}
                      onChange={(e) => handleItemChange(idx, 'variantId', e.target.value)}
                      className="flex-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {availableVariants.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.productName} - {v.variantName} (Còn: {v.stock} | {v.price_vnd.toLocaleString('vi-VN')} đ)
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                      className="w-16 text-xs text-center rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />

                    {selectedItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItemRow(idx)}
                        className="text-rose-500 hover:text-rose-700 p-1 text-sm"
                        title="Xóa dòng"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Phí ship, giảm giá và ghi chú */}
          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
              3. Vận chuyển & Thanh toán
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Phí vận chuyển (VND)"
                type="number"
                min={0}
                value={shippingFee}
                onChange={(e) => setShippingFee(Number(e.target.value) || 0)}
              />
              <Input
                label="Giảm giá (VND)"
                type="number"
                min={0}
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value) || 0)}
              />
            </div>
            <Input
              label="Ghi chú đơn hàng"
              placeholder="VD: Cho khách xem hàng trước khi nhận..."
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
            />

            {/* Trạng thái khởi tạo */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Chế độ xử lý đơn:
                </p>
                <p className="text-[11px] text-slate-500">
                  {orderInitialStatus === 'CONFIRMED'
                    ? 'Chốt đơn và trừ kho PostgreSQL ngay lập tức'
                    : 'Lưu dạng nháp, kho hàng giữ nguyên'}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setOrderInitialStatus('CONFIRMED')}
                  className={`px-2.5 py-1 text-xs rounded font-medium ${
                    orderInitialStatus === 'CONFIRMED'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  🔒 Chốt & Trừ kho
                </button>
                <button
                  type="button"
                  onClick={() => setOrderInitialStatus('DRAFT')}
                  className={`px-2.5 py-1 text-xs rounded font-medium ${
                    orderInitialStatus === 'DRAFT'
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  📝 Lưu nháp
                </button>
              </div>
            </div>

            {/* Bảng tính tổng tiền */}
            <div className="bg-indigo-50 dark:bg-indigo-950/40 p-3 rounded-lg space-y-1 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Tiền hàng:</span>
                <MoneyText amount={formSubtotal} />
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Phí ship:</span>
                <span>+ <MoneyText amount={shippingFee} /></span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Giảm giá:</span>
                <span>- <MoneyText amount={discount} /></span>
              </div>
              <div className="flex justify-between items-baseline pt-2 border-t border-indigo-200 dark:border-indigo-800 font-bold text-sm text-indigo-900 dark:text-indigo-200">
                <span>Tổng tiền thanh toán:</span>
                <MoneyText amount={formTotal} />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={isSubmitting}
            >
              Hủy bỏ
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {orderInitialStatus === 'CONFIRMED' ? 'Xác Nhận & Trừ Kho' : 'Lưu Đơn Nháp'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 5. MODAL: Xác nhận hủy đơn hàng */}
      <Modal
        isOpen={!!cancelModalOrder}
        onClose={() => !isCancelling && setCancelModalOrder(null)}
        title={`Xác Nhận Hủy Đơn Hàng #${cancelModalOrder?.order_number}`}
      >
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Hành động này sẽ cập nhật trạng thái đơn sang <b>CANCELLED</b>. Nếu đơn hàng đã được chốt
            trước đó, hệ thống sẽ tự động <b>hoàn lại số lượng tồn kho</b> vào PostgreSQL.
          </p>

          <Input
            label="Lý do hủy đơn"
            placeholder="VD: Khách báo đổi địa chỉ/không còn nhu cầu..."
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            required
          />

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCancelModalOrder(null)}
              disabled={isCancelling}
            >
              Đóng
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleConfirmCancel}
              isLoading={isCancelling}
            >
              Xác Nhận Hủy Đơn & Hoàn Kho
            </Button>
          </div>
        </div>
      </Modal>

      {/* 6. MODAL: Dán tin nhắn tạo đơn AI (Bước C11) */}
      <MessageIngestionModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onAnalysisSuccess={handleAiAnalysisSuccess}
      />

      {/* 7. MODAL: Duyệt đơn nháp AI (Bước C12) */}
      <DraftOrderReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        reviewData={currentAiReviewResult}
        onOrderConfirmed={() => {
          fetchOrders();
          setIsReviewModalOpen(false);
        }}
      />
    </div>
  );
};

export default OrdersPage;