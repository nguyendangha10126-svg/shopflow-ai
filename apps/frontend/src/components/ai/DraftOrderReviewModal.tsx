import React, { useState, useEffect } from 'react';
import { apiClient, ApiClientError } from '../../services/api';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Input from '../ui/Input';
import MoneyText from '../ui/MoneyText';
import { useToast } from '../ui/Toast';
import { ProcessedAIDraftResult, MatchedOrderItem } from '../../types/ai.types';

export interface DraftOrderReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  reviewData: ProcessedAIDraftResult | null;
  onOrderConfirmed: () => void;
}

export const DraftOrderReviewModal: React.FC<DraftOrderReviewModalProps> = ({
  isOpen,
  onClose,
  reviewData,
  onOrderConfirmed,
}) => {
  const { showToast } = useToast();

  // Dữ liệu khách hàng chỉnh sửa được
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingFee, setShippingFee] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [orderNotes, setOrderNotes] = useState('');

  // Danh sách sản phẩm được nhân viên xác nhận/chọn
  const [items, setItems] = useState<MatchedOrderItem[]>([]);
  const [highlightKeyword, setHighlightKeyword] = useState<string | null>(null);

  const [isConfirming, setIsConfirming] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Đồng bộ dữ liệu khi modal mở hoặc reviewData thay đổi
  useEffect(() => {
    if (reviewData) {
      setCustomerName(reviewData.customer?.name || '');
      setCustomerPhone(reviewData.customer?.phone || '');
      setShippingAddress(reviewData.customer?.address || '');
      setShippingFee(0);
      setDiscount(0);
      setOrderNotes('');
      setItems(reviewData.matched_items || []);
      setHighlightKeyword(null);
      setErrorMessage('');
    }
  }, [reviewData, isOpen]);

  if (!reviewData) return null;

  // Tính nhẩm tổng tiền dựa trên GIÁ DB
  const calculateTotals = () => {
    let subtotal = 0;
    items.forEach((item) => {
      if (item.price_vnd && item.match_status === 'MATCHED') {
        subtotal += item.price_vnd * item.quantity;
      }
    });
    const total = Math.max(0, subtotal + (shippingFee || 0) - (discount || 0));
    return { subtotal, total };
  };

  const { subtotal, total } = calculateTotals();

  // Tô sáng từ khóa trong tin nhắn gốc
  const renderHighlightedMessage = () => {
    const raw = reviewData.raw_anonymized_message;
    if (!highlightKeyword || !highlightKeyword.trim()) {
      return <span>{raw}</span>;
    }

    try {
      // Tìm từ khóa case-insensitive
      const escaped = highlightKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const parts = raw.split(new RegExp(`(${escaped})`, 'gi'));

      return (
        <span>
          {parts.map((part, i) =>
            part.toLowerCase() === highlightKeyword.toLowerCase() ? (
              <mark
                key={i}
                className="bg-yellow-300 dark:bg-yellow-500/80 text-slate-900 font-bold px-1.5 py-0.5 rounded shadow-sm border border-yellow-400"
              >
                {part}
              </mark>
            ) : (
              <span key={i}>{part}</span>
            )
          )}
        </span>
      );
    } catch {
      return <span>{raw}</span>;
    }
  };

  // 1-Click Sao chép toàn bộ câu hỏi gửi khách
  const handleCopyStaffQuestions = async () => {
    const questions = reviewData.questions_for_staff;
    if (!questions || questions.length === 0) return;

    const formattedMessage = `Dạ em chào chị ${
      customerName ? customerName : ''
    }! ShopFlow đang chuẩn bị lên đơn cho mình nè. Em muốn xác nhận lại một chút để gửi đúng món chị thích nhé:\n${questions
      .map((q) => `• ${q}`)
      .join('\n')}\nChị nhắn lại sớm để shop đóng gói ship cho mình ngay nha! Cảm ơn chị ❤️`;

    try {
      await navigator.clipboard.writeText(formattedMessage);
      showToast('Đã sao chép câu hỏi gửi khách! Bạn chỉ cần dán sang tin nhắn gửi khách.', 'success');
    } catch {
      showToast('Không thể sao chép tự động. Hãy sao chép nội dung bằng tay.', 'error');
    }
  };

  // Chọn biến thể thay thế cho trường hợp AMBIGUOUS
  const handleSelectAlternativeVariant = (
    itemIndex: number,
    potential: {
      variant_id: string;
      variant_name: string;
      sku: string;
      price_vnd: number;
      stock: number;
    }
  ) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[itemIndex] = {
        ...updated[itemIndex],
        match_status: 'MATCHED',
        variant_id: potential.variant_id,
        variant_name: potential.variant_name,
        sku: potential.sku,
        price_vnd: potential.price_vnd,
        stock: potential.stock,
        notes: undefined,
      };
      return updated;
    });
    showToast(`Đã chọn biến thể: ${potential.variant_name}`, 'success');
  };

  // Điều chỉnh số lượng mặt hàng
  const handleQuantityChange = (index: number, newQty: number) => {
    const validQty = Math.max(1, newQty);
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], quantity: validQty };
      return updated;
    });
  };

  // Xóa một mặt hàng khỏi đơn
  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // 1. Xác nhận chốt đơn & Trừ kho nguyên tử
  const handleConfirmAndDeductStock = async () => {
    setErrorMessage('');

    if (!customerPhone.trim()) {
      setErrorMessage('Vui lòng cung cấp số điện thoại của khách hàng');
      return;
    }

    const matchedOnly = items.filter((i) => i.match_status === 'MATCHED' && i.variant_id);
    if (matchedOnly.length === 0) {
      setErrorMessage(
        'Đơn hàng chưa có sản phẩm nào được khớp với kho CSDL. Vui lòng chọn biến thể hợp lệ trước khi chốt đơn.'
      );
      return;
    }

    setIsConfirming(true);
    try {
      if (reviewData.draft_order_id) {
        // Đã có bản nháp trong DB, gọi endpoint confirm để trừ kho
        await apiClient.post(`/orders/${reviewData.draft_order_id}/confirm`, {});
        showToast(
          `Đã chốt đơn #${reviewData.order_number || ''} và trừ kho nguyên tử thành công!`,
          'success'
        );
      } else {
        // Tạo đơn hàng mới ở trạng thái CONFIRMED
        const res = await apiClient.post<{ data: { order: { order_number: number } } }>(
          '/orders',
          {
            customer_name: customerName.trim() || 'Khách đặt qua tin nhắn',
            customer_phone: customerPhone.trim(),
            shipping_address: shippingAddress.trim() || 'Chưa cập nhật địa chỉ',
            shipping_fee_vnd: Number(shippingFee) || 0,
            discount_vnd: Number(discount) || 0,
            notes: orderNotes.trim() || `[AI Clipboard] ${reviewData.raw_anonymized_message.slice(0, 100)}`,
            status: 'CONFIRMED',
            source: 'CLIPBOARD',
            items: matchedOnly.map((i) => ({
              product_variant_id: i.variant_id!,
              quantity: i.quantity,
            })),
          }
        );
        showToast(
          `Đã tạo và chốt đơn #${res.data.order.order_number} (Đã trừ kho nguyên tử)!`,
          'success'
        );
      }

      onOrderConfirmed();
      onClose();
    } catch (err: any) {
      if (err instanceof ApiClientError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Lỗi khi chốt đơn hàng và trừ kho');
      }
    } finally {
      setIsConfirming(false);
    }
  };

  // 2. Lưu dạng nháp (Chưa trừ kho)
  const handleSaveAsDraft = async () => {
    setErrorMessage('');
    setIsConfirming(true);

    try {
      if (!reviewData.draft_order_id) {
        const validItems = items.filter((i) => i.variant_id);
        if (validItems.length > 0) {
          await apiClient.post('/orders', {
            customer_name: customerName.trim() || 'Khách đặt qua tin nhắn',
            customer_phone: customerPhone.trim() || '0000000000',
            shipping_address: shippingAddress.trim() || 'Chưa có địa chỉ',
            shipping_fee_vnd: Number(shippingFee) || 0,
            discount_vnd: Number(discount) || 0,
            notes: orderNotes.trim() || `[Bản nháp AI] ${reviewData.raw_anonymized_message.slice(0, 100)}`,
            status: 'DRAFT',
            source: 'CLIPBOARD',
            items: validItems.map((i) => ({
              product_variant_id: i.variant_id!,
              quantity: i.quantity,
            })),
          });
        }
      }
      showToast('Đã lưu đơn hàng ở trạng thái Bản Nháp (Kho giữ nguyên).', 'info');
      onOrderConfirmed();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi lưu bản nháp');
    } finally {
      setIsConfirming(false);
    }
  };

  // Phím tắt Ctrl + Enter để chốt đơn nhanh
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!isConfirming) {
        handleConfirmAndDeductStock();
      }
    }
  };

  const isPromptInjection = reviewData.warning_flags?.includes('PROMPT_INJECTION_DETECTED');
  const isNotOrder = reviewData.intent !== 'ORDER_CREATE';

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !isConfirming && onClose()}
      title="Duyệt Đơn Nháp AI (Kiểm Tra 3 Loại Dữ Liệu)"
    >
      <div onKeyDown={handleKeyDown} className="space-y-5 text-slate-800 dark:text-slate-200">
        {/* 1. Thanh cảnh báo đặc biệt (Tấn công Prompt / Hỏi giá) */}
        {isPromptInjection && (
          <div
            className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-500 rounded-xl text-xs text-rose-800 dark:text-rose-200 space-y-1"
            role="alert"
          >
            <p className="font-bold flex items-center space-x-1.5 text-sm">
              <span>🚨 CẢNH BÁO BẢO MẬT: PHÁT HIỆN LỆNH CAN THIỆP HỆ THỐNG</span>
            </p>
            <p className="text-[11px] leading-relaxed">
              Tin nhắn chứa câu lệnh bất thường cố tình thay đổi quyền hạn hoặc giá tiền. Nút chốt đơn tự động
              đã bị tạm khóa để bảo vệ cửa hàng. Vui lòng kiểm tra kỹ tin nhắn gốc.
            </p>
          </div>
        )}

        {isNotOrder && (
          <div
            className="p-3.5 bg-sky-50 dark:bg-sky-950/40 border border-sky-300 dark:border-sky-800 rounded-xl text-xs text-sky-800 dark:text-sky-200 flex items-start space-x-2"
            role="alert"
          >
            <span className="text-lg">ℹ️</span>
            <div>
              <p className="font-bold">Tin nhắn hỏi giá hoặc tư vấn chính sách</p>
              <p className="text-[11px] mt-0.5">
                AI nhận định khách đang hỏi thông tin (Ý định: <b>{reviewData.intent}</b>). Hãy sao chép câu hỏi
                để tư vấn thêm trước khi lên đơn.
              </p>
            </div>
          </div>
        )}

        {/* 2. Cảnh báo lỗi */}
        {errorMessage && (
          <div
            className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300"
            role="alert"
          >
            ⚠️ {errorMessage}
          </div>
        )}

        {/* 3. Khung hiển thị Tin Nhắn Gốc & Tính Năng Tô Sáng (Highlight) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
              <span>💬 Tin nhắn gốc của khách hàng</span>
              <Badge variant="system" size="sm">
                Đã che SĐT
              </Badge>
            </span>
            {highlightKeyword && (
              <button
                type="button"
                onClick={() => setHighlightKeyword(null)}
                className="text-[11px] text-indigo-600 hover:underline"
              >
                Bỏ tô sáng
              </button>
            )}
          </div>

          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-sans leading-relaxed text-slate-700 dark:text-slate-300 max-h-28 overflow-y-auto select-text">
            {renderHighlightedMessage()}
          </div>
          <p className="text-[11px] text-slate-400 italic">
            💡 Mẹo: Bấm vào từng trường bên dưới để tô sáng đoạn tương ứng trong tin nhắn gốc.
          </p>
        </div>

        {/* 4. Khối "AI MUỐN HỎI BẠN" (Clarification Box) */}
        {reviewData.questions_for_staff && reviewData.questions_for_staff.length > 0 && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700/80 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center space-x-1.5">
                <span>⚠️ AI Muốn Hỏi Bạn ({reviewData.questions_for_staff.length} điểm cần làm rõ):</span>
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyStaffQuestions}
                className="text-xs h-7 py-0.5 border-amber-400 text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/40"
              >
                📋 Sao chép câu hỏi gửi khách
              </Button>
            </div>

            <ul className="space-y-1 text-xs text-amber-800 dark:text-amber-300 list-disc list-inside">
              {reviewData.questions_for_staff.map((q, idx) => (
                <li key={idx} className="leading-relaxed">
                  {q}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 5. Khối Thông Tin Khách Hàng (DỮ LIỆU AI GỢI Ý - ⚡) */}
        <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
              <span>1. Thông tin người nhận</span>
              <Badge variant="ai" size="sm">
                ⚡ AI Gợi ý
              </Badge>
            </h3>
            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
              Độ tin cậy: {Math.round(reviewData.confidence * 100)}%
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div onFocus={() => setHighlightKeyword(customerName)}>
              <Input
                label="Họ và tên khách"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="VD: Thu Trang"
              />
            </div>
            <div onFocus={() => setHighlightKeyword(customerPhone || '[PHONE_1]')}>
              <Input
                label="Số điện thoại nhận hàng"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="VD: 0912345678"
                required
              />
            </div>
          </div>

          <div onFocus={() => setHighlightKeyword(shippingAddress)}>
            <Input
              label="Địa chỉ giao hàng"
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              placeholder="VD: 45 Lê Duẩn, Bến Nghé, Quận 1, TP.HCM"
              required
            />
          </div>
        </div>

        {/* 6. Khối Sản Phẩm (DỮ LIỆU HỆ THỐNG - 🔒 & DỮ LIỆU CẦN LÀM RÕ - ⚠️) */}
        <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
              <span>2. Mặt hàng đặt mua</span>
              <Badge variant="system" size="sm">
                🔒 Giá & Kho CSDL
              </Badge>
            </h3>
            <span className="text-[11px] text-slate-400">
              Giá và tồn kho lấy trực tiếp từ PostgreSQL
            </span>
          </div>

          <div className="space-y-3">
            {items.map((item, idx) => (
              <div
                key={idx}
                onMouseEnter={() => setHighlightKeyword(item.raw_text)}
                className={`p-3.5 rounded-xl border transition ${
                  item.match_status === 'MATCHED'
                    ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                    : item.match_status === 'AMBIGUOUS'
                    ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-400 dark:border-amber-600'
                    : 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-300 dark:border-rose-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {item.product_name || item.product_name_query}
                      </span>
                      {item.variant_name && (
                        <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                          ({item.variant_name})
                        </span>
                      )}

                      {/* Huy hiệu trạng thái khớp */}
                      {item.match_status === 'MATCHED' ? (
                        <Badge variant="success" size="sm">
                          🔒 Khớp kho ({item.sku})
                        </Badge>
                      ) : item.match_status === 'AMBIGUOUS' ? (
                        <Badge variant="uncertain" size="sm">
                          ⚠️ Chưa rõ biến thể
                        </Badge>
                      ) : item.match_status === 'OUT_OF_STOCK' ? (
                        <Badge variant="danger" size="sm">
                          ✕ Hết hàng
                        </Badge>
                      ) : (
                        <Badge variant="danger" size="sm">
                          ✕ Chưa có trong kho
                        </Badge>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                      Đoạn chat: "{item.raw_text}"
                    </p>

                    {item.notes && (
                      <p className="text-xs text-amber-700 dark:text-amber-300 font-medium mt-1">
                        👉 {item.notes}
                      </p>
                    )}

                    {/* Danh sách lựa chọn biến thể nếu AMBIGUOUS */}
                    {item.match_status === 'AMBIGUOUS' && item.potential_matches && (
                      <div className="mt-2 space-y-1.5 pt-2 border-t border-amber-200 dark:border-amber-800">
                        <p className="text-[11px] font-bold text-amber-900 dark:text-amber-200">
                          Bấm chọn 1 biến thể đúng từ kho:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {item.potential_matches.map((p) => (
                            <button
                              key={p.variant_id}
                              type="button"
                              onClick={() => handleSelectAlternativeVariant(idx, p)}
                              className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 text-xs hover:bg-amber-100 dark:hover:bg-amber-900 transition font-medium"
                            >
                              {p.variant_name} (Còn {p.stock} | {p.price_vnd.toLocaleString('vi-VN')} đ)
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Cột Số lượng & Giá tiền */}
                  <div className="flex items-center space-x-3 self-end sm:self-auto">
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-slate-400">SL:</span>
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(idx, Number(e.target.value))}
                        className="w-14 text-center text-xs py-1 px-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold"
                      />
                    </div>

                    <div className="text-right min-w-[90px]">
                      {item.price_vnd ? (
                        <div className="font-extrabold text-sm text-indigo-600 dark:text-indigo-400">
                          <MoneyText amount={item.price_vnd * item.quantity} />
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Chưa có giá</span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="text-slate-400 hover:text-rose-500 text-sm p-1"
                      title="Xóa món này"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 7. Tài chính: Phí Ship & Giảm Giá */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-2 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Phí vận chuyển (VND)"
              type="number"
              min={0}
              value={shippingFee}
              onChange={(e) => setShippingFee(Number(e.target.value) || 0)}
            />
            <Input
              label="Giảm giá voucher (VND)"
              type="number"
              min={0}
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value) || 0)}
            />
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1">
            <div className="flex justify-between text-slate-500">
              <span>Tiền hàng:</span>
              <MoneyText amount={subtotal} />
            </div>
            <div className="flex justify-between font-bold text-sm text-slate-900 dark:text-slate-100 pt-1">
              <span>TỔNG THANH TOÁN (Trừ kho thực tế):</span>
              <span className="text-base text-emerald-600 dark:text-emerald-400 font-extrabold">
                <MoneyText amount={total} />
              </span>
            </div>
          </div>
        </div>

        {/* 8. THANH HÀNH ĐỘNG DÍNH ĐÁY MÀN HÌNH (Sticky Bottom Action Bar) */}
        <div className="sticky -bottom-6 -mx-6 -mb-6 p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg z-20">
          <div className="text-xs text-slate-500 hidden sm:block">
            <span>Phím tắt: <b>Ctrl + Enter</b> để chốt đơn & trừ kho tức thì</span>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={onClose}
              disabled={isConfirming}
            >
              Bỏ qua
            </Button>

            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={handleSaveAsDraft}
              disabled={isConfirming}
            >
              Lưu bản nháp
            </Button>

            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleConfirmAndDeductStock}
              isLoading={isConfirming}
              disabled={isConfirming || isPromptInjection}
              className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 font-bold px-5"
            >
              ✓ Xác Nhận & Trừ Kho
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default DraftOrderReviewModal;
