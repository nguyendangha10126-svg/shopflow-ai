import React, { useState } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import MoneyText from '../components/ui/MoneyText';
import { useToast } from '../components/ui/Toast';

export const DesignSystemShowcase: React.FC = () => {
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState('0903123456');
  const [inputError, setInputError] = useState('');
  const [btnLoading, setBtnLoading] = useState(false);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center space-x-2">
            <span>ShopFlow AI Design Tokens & Components</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Nền tảng giao diện chuẩn Senior Full-stack: Mobile-first, Dark mode, WCAG AA tương phản
            &gt;= 4.5:1.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            onClick={() => {
              showToast({
                type: 'success',
                message: 'Đã lưu cấu hình shop thành công!',
                onUndo: () => alert('Đã hoàn tác thao tác!'),
              });
            }}
          >
            Thử Toast Hoàn tác
          </Button>
          <Button size="sm" variant="outline" onClick={() => setIsModalOpen(true)}>
            Mở Modal Test
          </Button>
        </div>
      </div>

      {/* 1. KHỐI HIỂN THỊ 3 CẤP ĐỘ DỮ LIỆU ĐỘC QUYỀN */}
      <Card>
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center space-x-2">
          <span>Quy ước 3 Cấp độ Dữ liệu (Design Hierarchy)</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Phân biệt minh bạch giữa Dữ liệu thực tế từ CSDL, Dữ liệu do AI tự tin bóc tách và Dữ liệu
          AI nghi ngờ cần hỏi lại.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-sky-50/60 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-900 dark:text-sky-200">
                1. Sự thật Hệ thống
              </span>
              <Badge variant="system" size="sm" />
            </div>
            <p className="text-xs text-sky-800 dark:text-sky-300">
              Dữ liệu tồn kho, giá niêm yết, mã đơn hàng được đọc trực tiếp từ PostgreSQL (Single
              Source of Truth). Khóa không sửa đổi tự do.
            </p>
            <div className="text-xs font-mono font-bold text-sky-950 dark:text-sky-100">
              Giá: <MoneyText amount={250000} /> (Tồn: 10)
            </div>
          </div>

          <div className="p-4 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-900 dark:text-purple-200">
                2. AI Gợi ý (Độ tin cậy cao)
              </span>
              <Badge variant="ai" size="sm" />
            </div>
            <p className="text-xs text-purple-800 dark:text-purple-300">
              Trích xuất từ tin nhắn chat Zalo/Facebook với độ tự tin &ge; 0.85, đã khớp thành công
              với SKU trong kho.
            </p>
            <div className="text-xs font-medium text-purple-900 dark:text-purple-200">
              Khách: Nguyễn Thùy Trang (SĐT: 0903***)
            </div>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                3. AI Cần hỏi lại (Không chắc)
              </span>
              <Badge variant="uncertain" size="sm" />
            </div>
            <p className="text-xs text-amber-800 dark:text-amber-300">
              Tin nhắn thiếu thông tin size/màu hoặc khách viết tắt mơ hồ. Giao diện hiển thị viền
              vàng và câu hỏi gợi ý.
            </p>
            <div className="text-xs text-amber-950 dark:text-amber-200 italic">
              "Khách chưa chọn size (S/M/L) cho váy hoa nhí"
            </div>
          </div>
        </div>
      </Card>

      {/* 2. CÁC NÚT BẤM (BUTTONS) */}
      <Card>
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">
          Các Biến Thể Nút Bấm (Button Variants)
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Primary Button</Button>
          <Button variant="secondary">Secondary Button</Button>
          <Button variant="outline">Outline Button</Button>
          <Button variant="danger">Danger Button</Button>
          <Button variant="ghost">Ghost Button</Button>
          <Button
            isLoading={btnLoading}
            onClick={() => {
              setBtnLoading(true);
              setTimeout(() => setBtnLoading(false), 2000);
            }}
          >
            {btnLoading ? 'Đang xử lý...' : 'Bấm thử Loading'}
          </Button>
          <Button disabled>Disabled Button</Button>
        </div>
      </Card>

      {/* 3. Ô NHẬP LIỆU (INPUTS) */}
      <Card>
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">
          Ô Nhập Liệu (Accessible Inputs)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
          <Input
            label="Số điện thoại khách hàng"
            required
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              if (e.target.value.length < 9) {
                setInputError('Số điện thoại phải có ít nhất 9 số');
              } else {
                setInputError('');
              }
            }}
            error={inputError}
            helperText="Nhập số điện thoại 10 số (chỉ lưu cục bộ)"
          />

          <Input
            label="Địa chỉ giao hàng"
            placeholder="Ví dụ: 120 Phố Huế, Hai Bà Trưng, Hà Nội"
            helperText="Tự động bóc tách từ tin nhắn chat"
          />
        </div>
      </Card>

      {/* 4. SKELETON & EMPTY STATE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">
            Hiệu Ứng Chờ (Skeleton Shimmer)
          </h2>
          <div className="space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <div className="flex space-x-2 pt-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">
            Trạng Thái Trống (Empty State)
          </h2>
          <EmptyState
            icon="🛍️"
            title="Chưa có đơn hàng nào hôm nay"
            description="Hãy bấm nút Dán tin nhắn từ Clipboard hoặc nhập đơn thủ công để bắt đầu chốt đơn."
            actionText="Tạo đơn hàng mới"
            onAction={() => alert('Chuyển hướng đến màn hình tạo đơn!')}
          />
        </Card>
      </div>

      {/* Focus-trapped Modal Test */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Kiểm Thử Hộp Thoại (Focus Trap Modal)"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Hủy bỏ
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setIsModalOpen(false);
                showToast({ type: 'info', message: 'Đã đóng hộp thoại thành công!' });
              }}
            >
              Xác nhận
            </Button>
          </>
        }
      >
        <p className="mb-3">Hộp thoại này tuân thủ chuẩn trợ năng WAI-ARIA:</p>
        <ul className="list-disc list-inside space-y-1 text-xs text-slate-600 dark:text-slate-400">
          <li>
            Bấm phím <strong>TAB</strong> để di chuyển: tiêu điểm bàn phím bị khóa lại bên trong hộp
            thoại, không bị lọt ra ngoài trang nền.
          </li>
          <li>
            Bấm phím <strong>ESC</strong> hoặc nhấp chuột vào nền tối bên ngoài để đóng modal.
          </li>
          <li>Sau khi đóng modal, tiêu điểm bàn phím tự động hoàn trả lại đúng nút bấm ban đầu.</li>
        </ul>
      </Modal>
    </div>
  );
};

export default DesignSystemShowcase;
