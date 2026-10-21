import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Clipboard,
  Plus,
  Trash2,
  AlertTriangle,
  AlertCircle,
  Loader2,
  FileText,
} from 'lucide-react';
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

const SAMPLE_SCENARIOS = [
  {
    id: 'full_order',
    title: 'Đủ thông tin & size',
    text: 'Shop ơi ship cho mình 1 Váy hoa nhí dáng xòe Vintage size S màu vàng kem về số 15 ngõ 120 Hoàng Hoa Thám, Ba Đình, Hà Nội. Tên mình là Lê Thu Hương, sđt 0987654321 nhé!',
  },
  {
    id: 'missing_variant',
    title: 'Thiếu size / màu',
    text: 'Cho em lấy 1 áo sơ mi lụa cổ V thanh lịch về 45 Lê Duẩn, Quận 1, TP.HCM, sđt 0912345678, em Mai Chi nhé.',
  },
  {
    id: 'multi_items',
    title: 'Nhiều món & viết tắt',
    text: 'Lấy 1 váy hoa nhí size M + 2 sơ mi lụa trắng về 88 Nguyễn Trãi, Thanh Xuân, Hà Nội. Nhung 0978901234.',
  },
];

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
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    }
  }, [isOpen]);

  // Đọc nội dung trực tiếp từ Clipboard
  const handleReadClipboard = async (isAppending = false) => {
    setClipboardError(null);
    setErrorMessage('');

    if (!navigator.clipboard || !navigator.clipboard.readText) {
      setClipboardError(
        'Trình duyệt chưa hỗ trợ Clipboard API hoặc đang truy cập qua HTTP không bảo mật. Bạn có thể dán bằng phím tắt Ctrl+V hoặc gõ vào ô bên dưới.'
      );
      textareaRef.current?.focus();
      return;
    }

    try {
      const text = await navigator.clipboard.readText();
      const trimmed = text.trim();

      if (!trimmed) {
        showToast('Bộ nhớ tạm đang trống. Hãy sao chép tin nhắn của khách trước.', 'info');
        textareaRef.current?.focus();
        return;
      }

      if (isAppending && message) {
        const combined = `${message}\n${trimmed}`;
        if (combined.length > 2000) {
          showToast('Tin nhắn sau khi ghép vượt quá 2.000 ký tự.', 'error');
          return;
        }
        setMessage(combined);
        showToast('Đã ghép thêm nội dung từ bộ nhớ tạm!', 'success');
      } else {
        if (trimmed.length > 2000) {
          setMessage(trimmed.slice(0, 2000));
          showToast('Nội dung quá dài, hệ thống đã lấy 2.000 ký tự đầu tiên.', 'info');
        } else {
          setMessage(trimmed);
          showToast('Đã dán tin nhắn từ bộ nhớ tạm thành công!', 'success');
        }
      }
      textareaRef.current?.focus();
    } catch {
      setClipboardError(
        'Trình duyệt đang chặn quyền đọc Clipboard. Bạn vui lòng bấm Ctrl+V để dán trực tiếp vào ô văn bản bên dưới.'
      );
      textareaRef.current?.focus();
    }
  };

  const handleAnalyze = async () => {
    const trimmed = message.trim();
    if (!trimmed) {
      setErrorMessage('Vui lòng nhập hoặc dán tin nhắn khách trước khi phân tích');
      textareaRef.current?.focus();
      return;
    }

    if (trimmed.length > 2000) {
      setErrorMessage('Nội dung không được vượt quá 2.000 ký tự');
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage('');
    setAnalysisStep('Đang bảo vệ dữ liệu cá nhân (che mờ số điện thoại)...');

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const idempotencyKey = `draft-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const timer1 = setTimeout(() => {
      setAnalysisStep('AI đang nhận diện tên khách, địa chỉ và mã SKU...');
    }, 800);

    const timer2 = setTimeout(() => {
      setAnalysisStep('Đang kiểm tra tồn kho và đơn giá tức thì...');
    }, 1800);

    try {
      const response = await apiClient.post<{ data: ProcessedAIDraftResult }>(
        '/ai/draft-order',
        { message: trimmed },
        {
          headers: { 'Idempotency-Key': idempotencyKey },
          signal: controller.signal,
        }
      );

      clearTimeout(timer1);
      clearTimeout(timer2);
      setIsAnalyzing(false);

      showToast('Đã bóc tách đơn hàng thành công!', 'success');
      onAnalysisSuccess(response.data);
      onClose();
    } catch (err: any) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setIsAnalyzing(false);

      if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
        showToast('Đã dừng phân tích', 'info');
        return;
      }

      if (err instanceof ApiClientError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Không thể kết nối tới dịch vụ AI. Vui lòng thử lại sau.');
      }
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsAnalyzing(false);
  };

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
      title="Dán Tin Nhắn Chat — Bóc Tách Đơn AI"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4">
        {/* 1. Thanh thao tác Clipboard */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-800/60 rounded-xl">
          <div className="flex items-center space-x-2">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => handleReadClipboard(false)}
              disabled={isAnalyzing}
              className="bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white shadow-sm inline-flex items-center space-x-1.5"
            >
              <Clipboard className="w-3.5 h-3.5" />
              <span>Dán từ bộ nhớ tạm</span>
            </Button>

            {message.trim().length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleReadClipboard(true)}
                disabled={isAnalyzing}
                className="inline-flex items-center space-x-1"
                title="Ghép thêm nội dung sao chép mới vào sau tin nhắn này"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ghép thêm tin</span>
              </Button>
            )}
          </div>

          {message.trim().length > 0 && !isAnalyzing && (
            <button
              type="button"
              onClick={() => setMessage('')}
              className="text-xs text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition inline-flex items-center space-x-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa</span>
            </button>
          )}
        </div>

        {/* 2. Cảnh báo quyền Clipboard nếu bị chặn */}
        {clipboardError && (
          <div
            className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 rounded-xl text-xs text-amber-800 dark:text-amber-200 flex items-start space-x-2"
            role="alert"
          >
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold">Mẹo dán tin nhắn:</p>
              <p className="text-[11px] leading-relaxed">{clipboardError}</p>
            </div>
          </div>
        )}

        {/* 3. Lỗi API nếu có */}
        {errorMessage && (
          <div
            className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-start space-x-2"
            role="alert"
          >
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <p className="font-medium">{errorMessage}</p>
          </div>
        )}

        {/* 4. Textarea nhập tin nhắn với đếm ký tự */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <label
              htmlFor="raw-message-input"
              className="font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-500" />
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
            placeholder="Dán hoặc gõ nội dung tin nhắn khách gửi tại đây...&#10;Ví dụ: Shop ship cho mình 1 đầm hoa nhí size S màu vàng về 15 Hoàng Hoa Thám, sđt 0987654321 nhé!"
            className={`w-full rounded-xl border p-3 text-xs sm:text-sm font-sans transition focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 ${
              isOverLimit
                ? 'border-rose-500 focus:ring-rose-500'
                : 'border-slate-300 dark:border-slate-700'
            }`}
          />
          <p className="text-[11px] text-slate-400">
            Mẹo: Nhấn <b>Ctrl + Enter</b> để bắt đầu bóc tách nhanh.
          </p>
        </div>

        {/* 5. Ba nút kịch bản mẫu */}
        <div className="space-y-1.5 pt-1">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Hoặc thử nhanh với tin nhắn mẫu:
          </span>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_SCENARIOS.map((sc) => (
              <button
                key={sc.id}
                type="button"
                disabled={isAnalyzing}
                onClick={() => {
                  setMessage(sc.text);
                  textareaRef.current?.focus();
                }}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 transition text-left"
              >
                <div className="font-medium text-[11px]">{sc.title}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 6. Trạng thái phân tích thật */}
        {isAnalyzing && (
          <div
            role="status"
            aria-live="polite"
            className="p-4 bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 rounded-xl space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />
                <span className="text-xs font-bold text-purple-900 dark:text-purple-200">
                  ShopFlow AI đang phân tích...
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCancel}
                className="text-xs py-1 h-7 text-rose-600 border-rose-300 hover:bg-rose-50"
              >
                Hủy
              </Button>
            </div>

            <p className="text-xs font-medium text-purple-700 dark:text-purple-300 animate-pulse">
              {analysisStep}
            </p>

            <div className="space-y-2 pt-1">
              <Skeleton className="h-3 w-3/4 rounded bg-purple-200/60 dark:bg-purple-900/40" />
              <Skeleton className="h-3 w-1/2 rounded bg-purple-200/60 dark:bg-purple-900/40" />
            </div>
          </div>
        )}

        {/* 7. Footer buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          <Badge variant="system" size="sm">
            Bảo vệ SĐT tự động
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
              className="bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-semibold inline-flex items-center space-x-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Bóc tách đơn hàng</span>
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default MessageIngestionModal;
