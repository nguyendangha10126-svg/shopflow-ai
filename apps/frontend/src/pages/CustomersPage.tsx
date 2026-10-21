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

interface Customer {
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

export const CustomersPage: React.FC = () => {
  const { showToast } = useToast();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State Thêm Khách Hàng
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const response = await apiClient.get<{ data: { items: Customer[] } }>('/customers', {
        params: {
          search: searchTerm || undefined,
        },
      });
      setCustomers(response.data.items);
    } catch (err: any) {
      if (err instanceof ApiClientError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Không thể tải danh sách khách hàng');
      }
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setName('');
    setPhone('');
    setAddress('');
    setNotes('');
    setFormError('');
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim() || name.trim().length < 2) {
      setFormError('Họ tên khách hàng phải có ít nhất 2 ký tự');
      return;
    }
    if (!/^[0-9+]{9,15}$/.test(phone.trim())) {
      setFormError('Số điện thoại không hợp lệ (9-15 chữ số)');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post('/customers', {
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      showToast(`Đã thêm khách hàng "${name.trim()}" thành công!`, 'success');
      setIsModalOpen(false);
      fetchCustomers();
    } catch (err: any) {
      if (err instanceof ApiClientError) {
        setFormError(err.message);
      } else {
        setFormError('Có lỗi xảy ra khi lưu thông tin khách hàng');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
            <span>👥 Quản Lý Khách Hàng</span>
            <Badge variant="system" size="sm">
              Cô lập theo Shop
            </Badge>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Tra cứu lịch sử mua hàng, lưu địa chỉ giao nhận và tổng chi tiêu của khách
          </p>
        </div>

        <Button variant="primary" onClick={handleOpenModal}>
          + Thêm khách hàng
        </Button>
      </div>

      {/* 2. Thanh tìm kiếm */}
      <Card>
        <div className="max-w-md">
          <Input
            label=""
            placeholder="🔍 Tìm theo tên hoặc số điện thoại..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </Card>

      {/* 3. Danh sách khách hàng */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
      ) : errorMessage ? (
        <Card className="border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20">
          <div className="text-center py-8">
            <span className="text-3xl">⚠️</span>
            <h2 className="mt-2 text-base font-semibold text-rose-700 dark:text-rose-300">
              {errorMessage}
            </h2>
            <div className="mt-4">
              <Button variant="outline" size="sm" onClick={fetchCustomers}>
                Thử lại
              </Button>
            </div>
          </div>
        </Card>
      ) : customers.length === 0 ? (
        <EmptyState
          icon="👥"
          title="Chưa có khách hàng nào"
          description={
            searchTerm
              ? 'Không tìm thấy khách hàng nào khớp với từ khóa'
              : 'Dữ liệu khách hàng sẽ tự động tích lũy khi bạn tạo đơn hàng hoặc thêm thủ công tại đây'
          }
          actionText="+ Thêm khách hàng đầu tiên"
          onAction={handleOpenModal}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map((c) => (
            <Card
              key={c.id}
              className="hover:border-indigo-200 dark:hover:border-indigo-800 transition"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                      {c.name}
                    </h3>
                    <p className="text-xs font-mono text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
                      📞 {c.phone}
                    </p>
                  </div>
                  {(c.total_orders ?? 0) >= 3 ? (
                    <Badge variant="system" size="sm">
                      Khách quen
                    </Badge>
                  ) : (
                    <span className="text-[11px] text-slate-400">Khách mới</span>
                  )}
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                  <p>
                    <span className="text-slate-400">Địa chỉ:</span>{' '}
                    {c.address || <span className="italic text-slate-400">Chưa cập nhật</span>}
                  </p>
                  {c.notes && (
                    <p className="italic bg-slate-50 dark:bg-slate-800/40 p-1.5 rounded">
                      💬 {c.notes}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    Đã mua: <b>{c.total_orders ?? 0}</b> đơn
                  </span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Chi tiêu: <MoneyText amount={c.total_spent_vnd ?? c.total_spend_vnd ?? 0} />
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* 4. MODAL: Thêm Khách Hàng Mới */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !isSubmitting && setIsModalOpen(false)}
        title="Thêm Khách Hàng Mới"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4">
          {formError && (
            <div
              className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg text-xs text-rose-700 dark:text-rose-300"
              role="alert"
            >
              ⚠️ {formError}
            </div>
          )}

          <Input
            label="Họ và tên khách hàng"
            placeholder="VD: Trần Thị Bích Thảo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            label="Số điện thoại"
            placeholder="VD: 0987654321"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />

          <Input
            label="Địa chỉ giao hàng mặc định"
            placeholder="VD: Số 45, Đường Lê Duẩn, TP. Đà Nẵng"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />

          <Input
            label="Ghi chú sở thích/lưu ý"
            placeholder="VD: Thích mặc form rộng, thường chọn màu tối..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
            >
              Hủy bỏ
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Lưu Khách Hàng
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CustomersPage;