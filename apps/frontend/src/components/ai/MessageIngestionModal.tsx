import React, { useState, useRef, useEffect } from 'react';
import { apiClient, ApiClientError } from '../../services/api';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Skeleton from '../ui/Skeleton';
import { useToast } from '../ui/Toast';
import { ProcessedAIDraftResult } from '../../types/ai.types';

export interface MessageIngestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalysisSuccess: (result: ProcessedAIDraftResult) => void;
}

export const MessageIngestionModal: React.FC<MessageIngestionModalProps> = ({
  isOpen,
  onClose,
  onAnalysisSuccess,
}) => {
  const { showToast } = useToast();

  const [message, setMessage] = useState('');
  const [clipboardError, setClipboardError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<string>('');
  const [selectedScenario, setSelectedScenario] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Reset state mỗi khi mở modal
  useEffect(() => {
    if (isOpen) {
      setClipboardError(null);
      setErrorMessage('');
      setIsAnalyzing(false);
      setAnalysisStep('');
    } else {
      // Khi đóng modal, hủy request đang chạy nếu có
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    }
  }, [isOpen]);

  // 1. Thao tác Đọc nhanh từ Clipboard (Chỉ hoạt động khi có thao tác chạm/click của người dùng)
  const handleReadClipboard = async (isAppending = false) => {
    setClipboardError(null);
    setErrorMessage('');

    if (!navigator.clipboard || !navigator.clipboard.readText) {
      setClipboardError(
        'Trình duyệt này không hỗ trợ Clipboard API hoặc bạn đang truy cập qua giao thức HTTP không bảo mật. Vui lòng nhập tay vào ô bên dưới.'
      );
      textareaRef.current?.focus();
      return;
    }

    try {
      const text = await navigator.clipboard.readText();
      const trimmed = text.trim();

      if (!trimmed) {
        showToast('Bộ nhớ tạm (Clipboard) đang trống. Hãy sao chép tin nhắn của khách trước.', 'info');
        textareaRef.current?.focus();
        return;
      }

      if (isAppending && message) {
        // Ghép nhiều tin nhắn liên tiếp
        const combined = `${message}\n${trimmed}`;
        if (combined.length > 2000) {
          showToast('Tin nhắn sau khi ghép vượt quá giới hạn 2.000 ký tự.', 'error');
          return;
        }
        setMessage(combined);
        showToast('Đã ghép thêm nội dung mới từ Clipboard!', 'success');
      } else {
        if (trimmed.length > 2000) {
          setMessage(trimmed.slice(0, 2000));
          showToast('Tin nhắn quá dài, hệ thống đã tự động cắt ở 2.000 ký tự.', 'info');
        } else {
          setMessage(trimmed);
          showToast('Đã dán tin nhắn từ Clipboard thành công!', 'success');
        }
      }

      textareaRef.current?.focus();
    } catch (err: any) {
      // Trình duyệt từ chối cấp quyền truy cập Clipboard (NotAllowedError / Permission denied)
      setClipboardError(
        'Trình duyệt chưa được cấp quyền đọc Clipboard (hoặc bạn đã bấm Từ chối). Bạn vui lòng dùng ô nhập tay bên dưới hoặc cho phép quyền trong cài đặt trình duyệt.'
      );
      textareaRef.current?.focus();
    }
  };

  // 2. Gửi tin nhắn tới AI Backend với AbortController & Idempotency-Key
  const handleAnalyze = async () => {
    const trimmed = message.trim();
    if (!trimmed) {
      setErrorMessage('Vui lòng dán hoặc nhập nội dung tin nhắn trước khi phân tích');
      textareaRef.current?.focus();
      return;
    }

    if (trimmed.length > 2000) {
      setErrorMessage('Tin nhắn không được vượt quá 2.000 ký tự');
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage('');
    setAnalysisStep('🔒 Đang che mờ số điện thoại bảo mật...');

    // Khởi tạo AbortController để cho phép người dùng bấm Hủy
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Sinh Idempotency-Key chống gửi trùng
    const idempotencyKey = `draft-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // Hiệu ứng các bước phân tích (Visual Stepper)
    const timer1 = setTimeout(() => {
      setAnalysisStep('🤖 Google Gemini đang bóc tách sản phẩm & địa chỉ...');
    }, 1200);

    const timer2 = setTimeout(() => {
      setAnalysisStep('📊 Đang đối chiếu giá và tồn kho với PostgreSQL...');
    }, 2800);

    try {
      const response = await apiClient.post<{ data: ProcessedAIDraftResult }>(
        '/ai/draft-order',
        {
          message: trimmed,
          scenario: selectedScenario || undefined,
        },
        {
          headers: {
            'Idempotency-Key': idempotencyKey,
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timer1);
      clearTimeout(timer2);
      setIsAnalyzing(false);

      showToast('Đã bóc tách dữ liệu đơn hàng thành công!', 'success');
      onAnalysisSuccess(response.data);
      onClose();
    } catch (err: any) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setIsAnalyzing(false);

      if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
        showToast('Đã hủy quá trình phân tích đơn hàng', 'info');
        return;
      }

      if (err instanceof ApiClientError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Không thể kết nối tới dịch vụ AI. Vui lòng thử lại sau.');
      }
    }
  };

  // Hủy quá trình phân tích
  const handleCancelAnalysis = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsAnalyzing(false);
  };

  // Phím tắt Ctrl + Enter để phân tích nhanh
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!isAnalyzing && message.trim()) {
        handleAnalyze();
      }
    }
  };

  const charCount = message.length;
  const isOverLimit = charCount > 2000;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !isAnalyzing && onClose()}
      title="⚡ Tạo Đơn Nhanh Bằng AI (Dán Tin Nhắn)"
    >
      <div className="space-y-4">
        {/* 1. Thanh nút thao tác Clipboard */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 rounded-xl">
          <div className="flex items-center space-x-2">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => handleReadClipboard(false)}
              disabled={isAnalyzing}
              className="bg-purple-600 hover:bg-purple-700 active:bg-purple-800 shadow-sm"
            >
              📋 Dán nhanh từ Clipboard
            </Button>

            {message.trim().length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleReadClipboard(true)}
                disabled={isAnalyzing}
                title="Đọc nội dung mới từ clipboard và nối tiếp vào tin nhắn hiện có"
              >
                + Ghép thêm tin
              </Button>
            )}
          </div>

          {message.trim().length > 0 && !isAnalyzing && (
            <button
              type="button"
              onClick={() => setMessage('')}
              className="text-xs text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition"
            >
              Xóa trắng
            </button>
          )}
        </div>

        {/* 2. Cảnh báo thân thiện khi Trình duyệt từ chối quyền Clipboard */}
        {clipboardError && (
          <div
            className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 rounded-xl text-xs text-amber-800 dark:text-amber-200 flex items-start space-x-2"
            role="alert"
          >
            <span className="text-base" aria-hidden="true">
              ⚠️
            </span>
            <div className="space-y-1">
              <p className="font-semibold">Trình duyệt chưa cho phép đọc Clipboard</p>
              <p className="text-[11px] leading-relaxed">{clipboardError}</p>
            </div>
          </div>
        )}

        {/* 3. Lỗi từ hệ thống / API */}
        {errorMessage && (
          <div
            className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-start space-x-2"
            role="alert"
          >
            <span className="text-base" aria-hidden="true">
              ❌
            </span>
            <p className="font-medium">{errorMessage}</p>
          </div>
        )}

        {/* 4. Ô nhập tay dự phòng bắt buộc (Textarea) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <label
              htmlFor="raw-message-input"
              className="font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1"
            >
              <span>Nội dung tin nhắn khách gửi</span>
              <span className="text-rose-500">*</span>
            </label>

            <span
              className={`font-mono text-[11px] ${
                isOverLimit
                  ? 'text-rose-600 font-bold'
                  : charCount > 1800
                  ? 'text-amber-600 font-semibold'
                  : 'text-slate-400'
              }`}
            >
              {charCount} / 2.000 ký tự
            </span>
          </div>

          <textarea
            id="raw-message-input"
            ref={textareaRef}
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isAnalyzing}
            placeholder="Dán hoặc gõ nội dung tin nhắn của khách tại đây...&#10;Ví dụ: Shop ship cho mình 1 đầm hoa nhí size M màu vàng về số 25 Nguyễn Trãi, Thanh Xuân, Hà Nội, sđt 0912345678 nhé, tên mình là Lan."
            className={`w-full rounded-xl border p-3 text-xs sm:text-sm font-sans transition focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 ${
              isOverLimit
                ? 'border-rose-500 focus:ring-rose-500'
                : 'border-slate-300 dark:border-slate-700'
            }`}
          />
          <p className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>Mẹo: Bạn có thể chỉnh sửa tin nhắn trước khi gửi, hoặc nhấn <b>Ctrl + Enter</b> để phân tích nhanh.</span>
          </p>
        </div>

        {/* 5. Bộ chọn Kịch bản Test giả lập (Dành cho Dev / Kiểm thử chức năng) */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <details className="text-xs group">
            <summary className="cursor-pointer font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 flex items-center justify-between select-none">
              <span>🛠️ Chế độ kiểm thử Kịch bản AI (Tùy chọn)</span>
              <span className="text-[10px] group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="mt-2 p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-lg space-y-2">
              <p className="text-[11px] text-slate-500">
                Chọn kịch bản để kiểm thử cách hệ thống phản ứng với các tình huống biên:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: '', label: '⚡ Tự động (Mặc định)' },
                  { id: 'success', label: '✓ Đơn chuẩn' },
                  { id: 'ambiguous', label: '⚠️ Thiếu size/màu' },
                  { id: 'injection', label: '🛡️ Tấn công Prompt' },
                  { id: 'malformed_json', label: '🔄 Thử lại khi lỗi JSON' },
                  { id: 'timeout', label: '⏱️ Timeout (>8s)' },
                ].map((sc) => (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => setSelectedScenario(sc.id)}
                    className={`px-2 py-1 rounded text-[11px] font-medium transition ${
                      selectedScenario === sc.id
                        ? 'bg-purple-600 text-white'
                        : 'bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {sc.label}
                  </button>
                ))}
              </div>
            </div>
          </details>
        </div>

        {/* 6. Trạng thái Đang phân tích (Skeleton + aria-live) */}
        {isAnalyzing && (
          <div
            role="status"
            aria-live="polite"
            className="p-4 bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 rounded-xl space-y-3 animate-pulse"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-xs flex items-center justify-center animate-spin">
                  ⚡
                </span>
                <span className="text-xs font-bold text-purple-900 dark:text-purple-200">
                  ShopFlow AI đang làm việc...
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCancelAnalysis}
                className="text-xs py-1 h-7 text-rose-600 border-rose-300 hover:bg-rose-50"
              >
                Hủy phân tích
              </Button>
            </div>

            <p className="text-xs font-medium text-purple-700 dark:text-purple-300">
              {analysisStep}
            </p>

            <div className="space-y-2 pt-1">
              <Skeleton className="h-4 w-3/4 rounded bg-purple-200/60 dark:bg-purple-900/40" />
              <Skeleton className="h-4 w-1/2 rounded bg-purple-200/60 dark:bg-purple-900/40" />
            </div>
          </div>
        )}

        {/* 7. Footer Nút hành động */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          <Badge variant="system" size="sm">
            🔒 Bảo mật SĐT tự động
          </Badge>

          <div className="flex items-center space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isAnalyzing}
            >
              Đóng
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleAnalyze}
              isLoading={isAnalyzing}
              disabled={isAnalyzing || !message.trim() || isOverLimit}
              className="bg-purple-600 hover:bg-purple-700 active:bg-purple-800"
            >
              🚀 Bắt Đầu Phân Tích
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default MessageIngestionModal;
