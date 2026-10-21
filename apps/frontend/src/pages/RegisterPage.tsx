import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import { apiClient, ApiClientError } from '../services/api';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();

  const [shopName, setShopName] = useState('');
  const [shopPhone, setShopPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const response = await apiClient.post<any>('/auth/register', {
        shop_name: shopName,
        shop_phone: shopPhone,
        full_name: fullName,
        email,
        password,
      });

      login(response.data.tokens.access_token, response.data.user);
      showToast({
        type: 'success',
        message: 'Tạo cửa hàng thành công! Chào mừng bạn gia nhập ShopFlow AI.',
      });
      navigate('/products');
    } catch (err: any) {
      if (err instanceof ApiClientError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Không thể đăng ký lúc này. Vui lòng thử lại sau');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-indigo-600 text-white font-black text-xl items-center justify-center shadow-lg shadow-indigo-600/30">
            SF
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">
            Đăng ký Shop mới
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tạo cửa hàng và kích hoạt trợ lý chốt đơn AI trong 30 giây
          </p>
        </div>

        <Card className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div
                role="alert"
                className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 font-medium"
              >
                {errorMessage}
              </div>
            )}

            <Input
              label="Tên cửa hàng / Shop"
              required
              placeholder="Ví dụ: Tiệm Thời Trang Linh Linh"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              disabled={isLoading}
            />

            <Input
              label="Số điện thoại Shop"
              required
              placeholder="0901234567"
              value={shopPhone}
              onChange={(e) => setShopPhone(e.target.value)}
              disabled={isLoading}
            />

            <Input
              label="Họ tên chủ shop"
              required
              placeholder="Nguyễn Văn A"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={isLoading}
            />

            <Input
              label="Email đăng nhập"
              type="email"
              required
              placeholder="owner@shop.vn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />

            <Input
              label="Mật khẩu (Tối thiểu 8 ký tự)"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />

            <Button type="submit" isLoading={isLoading} className="w-full mt-2">
              Hoàn tất đăng ký & Khởi tạo Shop
            </Button>
          </form>
        </Card>

        <p className="text-center text-xs text-slate-500 dark:text-slate-400">
          Đã có tài khoản?{' '}
          <Link
            to="/login"
            className="font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
          >
            Đăng nhập ngay
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;

