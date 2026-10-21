import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users,
  Plus,
  Search,
  Phone,
  Copy,
  Check,
  Star,
  MapPin,
  ShoppingBag,
  CreditCard,
  AlertTriangle
} from 'lucide-react';
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
import CustomerDetailDrawer from '../components/customers/CustomerDetailDrawer';

export interface Customer {
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
  const [filterType, setFilterType] = useState<'ALL' | 'REGULAR' | 'NEW'>('ALL');

  // Drawer chi tiết khách hàng
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Modal State Thêm Khách Hàng
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Copy tracking state
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  // CRM KPIs summary
  const stats = useMemo(() => {
    const totalCustomers = customers.length;
    let regularCount = 0;
    let totalSpent = 0;

    customers.forEach((c) => {
      const orders = c.total_orders ?? 0;
      const spent = c.total_spent_vnd ?? c.total_spend_vnd ?? 0;
      if (orders >= 3) {
        regularCount++;
      }
      totalSpent += spent;
    });

    return {
      totalCustomers,
      regularCount,
      totalSpent,
    };
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    if (filterType === 'REGULAR') {
      return customers.filter((c) => (c.total_orders ?? 0) >= 3);
    }
    if (filterType === 'NEW') {
      return customers.filter((c) => (c.total_orders ?? 0) < 3);
    }
    return customers;
  }, [customers, filterType]);

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

  const handleCopyPhone = async (e: React.MouseEvent, cPhone: string, cId: string) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(cPhone);
      setCopiedId(`phone-${cId}`);
      showToast(`Đã sao chép SĐT ${cPhone}`, 'success');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      showToast('Không thể sao chép SĐT', 'error');
    }
  };

  const getInitials = (cName: string) => {
    const parts = cName.trim().split(' ');
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Thao tác */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2.5">
            <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>Quản Lý Khách Hàng</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {customers.length} khách
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Tra cứu lịch sử mua sắm, nhận diện khách quen và lưu trữ địa chỉ giao hàng
          </p>
        </div>

        <Button variant="primary" onClick={handleOpenModal} className="bg-indigo-600 hover:bg-indigo-700 shadow-sm">
          <Plus className="w-4 h-4 mr-1.5" />
          Thêm khách hàng
        </Button>
      </div>

      {/* 2. Thống kê nhanh CRM */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="p-3.5">
          <span className="text-xs text-slate-500 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-indigo-600" /> Tổng số khách lưu trữ
          </span>
          <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1 font-mono">
            {stats.totalCustomers} <span className="text-xs font-normal text-slate-400">người</span>
          </div>
        </Card>

        <Card className="p-3.5 border-purple-200/60 dark:border-purple-900/40 bg-purple-50/20 dark:bg-purple-950/10">
          <span className="text-xs text-purple-700 dark:text-purple-300 flex items-center gap-1.5 font-medium">
            <Star className="w-3.5 h-3.5 text-purple-600 fill-purple-600" /> Khách quen (&ge; 3 đơn)
          </span>
          <div className="text-xl font-bold text-purple-700 dark:text-purple-300 mt-1 font-mono">
            {stats.regularCount} <span className="text-xs font-normal text-purple-600">khách thân thiết</span>
          </div>
        </Card>

        <Card className="p-3.5">
          <span className="text-xs text-slate-500 flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5 text-emerald-600" /> Doanh thu tích lũy khách hàng
          </span>
          <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-1 font-mono">
            <MoneyText amount={stats.totalSpent} />
          </div>
        </Card>
      </div>

      {/* 3. Thanh tìm kiếm & Bộ lọc */}
      <Card>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="w-full sm:w-80 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm theo tên hoặc số điện thoại..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-400"
            />
          </div>

          <div className="flex items-center space-x-1.5 w-full sm:w-auto">
            {[
              { id: 'ALL', label: 'Tất cả' },
              { id: 'REGULAR', label: 'Khách quen (>=3 đơn)' },
              { id: 'NEW', label: 'Khách mới' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  filterType === tab.id
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

      {/* 4. Danh sách khách hàng */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-44 w-full rounded-xl" />
          <Skeleton className="h-44 w-full rounded-xl" />
          <Skeleton className="h-44 w-full rounded-xl" />
        </div>
      ) : errorMessage ? (
        <Card className="border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20 text-center py-8">
          <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="mt-2 text-base font-semibold text-rose-700 dark:text-rose-300">
            {errorMessage}
          </h2>
          <div className="mt-4">
            <Button variant="outline" size="sm" onClick={fetchCustomers}>
              Thử lại
            </Button>
          </div>
        </Card>
      ) : filteredCustomers.length === 0 ? (
        <EmptyState
          icon="👥"
          title="Chưa có khách hàng nào"
          description={
            searchTerm
              ? 'Không tìm thấy khách hàng nào khớp với từ khóa'
              : 'Dữ liệu khách hàng sẽ tự động tích lũy khi bạn tạo đơn hàng hoặc thêm thủ công tại đây'
          }
          actionText="+ Thêm khách hàng mới"
          onAction={handleOpenModal}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((c) => {
            const orders = c.total_orders ?? 0;
            const spent = c.total_spent_vnd ?? c.total_spend_vnd ?? 0;
            const isRegular = orders >= 3;

            return (
              <Card
                key={c.id}
                className="hover:border-indigo-300 dark:hover:border-indigo-700 transition shadow-sm cursor-pointer group flex flex-col justify-between"
                onClick={() => setSelectedCustomer(c)}
              >
                <div className="space-y-3">
                  {/* Header thẻ khách: Avatar, Tên, Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-sm shrink-0">
                        {getInitials(c.name)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate group-hover:text-indigo-600 transition-colors">
                          {c.name}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <a
                            href={`tel:${c.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs font-mono text-indigo-600 dark:text-indigo-400 font-medium hover:underline inline-flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3 text-emerald-600" />
                            {c.phone}
                          </a>
                          <button
                            type="button"
                            onClick={(e) => handleCopyPhone(e, c.phone, c.id)}
                            className="text-slate-400 hover:text-slate-600 p-0.5"
                            title="Sao chép SĐT"
                          >
                            {copiedId === `phone-${c.id}` ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {isRegular ? (
                      <Badge variant="system" size="sm">
                        <Star className="w-3 h-3 fill-indigo-600 mr-1" />
                        Khách quen
                      </Badge>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                        Khách mới
                      </span>
                    )}
                  </div>

                  {/* Địa chỉ & Ghi chú */}
                  <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                    <p className="flex items-start gap-1 line-clamp-2">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400 mt-0.5" />
                      <span>{c.address || <span className="italic text-slate-400">Chưa cập nhật địa chỉ</span>}</span>
                    </p>
                    {c.notes && (
                      <p className="italic bg-amber-50/50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 p-1.5 rounded-lg text-[11px] line-clamp-1 border border-amber-100 dark:border-amber-900/30">
                        Lưu ý: {c.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer thẻ: Tổng đơn & Chi tiêu */}
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1">
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <b>{orders}</b> đơn hàng
                  </span>
                  <div className="text-right">
                    <span className="text-slate-400 text-[10px] block">Chi tiêu</span>
                    <span className="font-extrabold text-indigo-600 dark:text-indigo-400 text-sm">
                      <MoneyText amount={spent} />
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* 5. DRAWER: Chi tiết hồ sơ khách hàng */}
      <CustomerDetailDrawer
        customer={selectedCustomer}
        isOpen={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
      />

      {/* 6. MODAL: Thêm Khách Hàng Mới */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !isSubmitting && setIsModalOpen(false)}
        title="Thêm Khách Hàng Mới"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4">
          {formError && (
            <div
              className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2"
              role="alert"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{formError}</span>
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
            label="Ghi chú sở thích / lưu ý"
            placeholder="VD: Thích mặc form rộng, gọi trước khi giao..."
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
            <Button type="submit" variant="primary" isLoading={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700">
              Lưu Khách Hàng
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CustomersPage;
