import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import { apiClient, ApiClientError } from '../services/api';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

interface LoginResponse {
  message: string;
  data: {
    user: any;
    tokens: {
      access_token: string;
      refresh_token: string;
    };
  };
}

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLoginDemo = async () => {
    setEmail('owner@mayboutique.vn');
    setPassword('ShopFlow@123');
    setErrorMessage('');
    setIsLoading(true);

    try {
      const response = await apiClient.post<LoginResponse>('/auth/login', {
        email: 'owner@mayboutique.vn',
        password: 'ShopFlow@123',
      });

      login(response.data.tokens.access_token, response.data.user, response.data.tokens.refresh_token);
      showToast({
        type: 'success',
        message: `Đăng nhập thành công! Chào mừng ${response.data.user.full_name}`,
      });
      navigate('/orders');
    } catch (err: any) {
      if (err instanceof ApiClientError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Không thể kết nối tới máy chủ. Vui lòng kiểm tra lại backend trên cổng 5000');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const response = await apiClient.post<LoginResponse>('/auth/login', {
        email,
        password,
      });

      login(response.data.tokens.access_token, response.data.user, response.data.tokens.refresh_token);
      showToast({
        type: 'success',
        message: `Đăng nhập thành công! Chào mừng ${response.data.user.full_name}`,
      });
      navigate('/orders');
    } catch (err: any) {
      if (err instanceof ApiClientError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Không thể kết nối tới máy chủ. Vui lòng kiểm tra lại');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-indigo-600 text-white font-black text-xl items-center justify-center shadow-lg shadow-indigo-600/30">
            SF
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">
            Đăng nhập ShopFlow AI
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Trợ lý chốt đơn & tồn kho thông minh cho shop online
          </p>
        </div>

        {/* Login Card */}
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
              label="Địa chỉ Email"
              type="email"
              required
              placeholder="owner@mayboutique.vn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />

            <Input
              label="Mật khẩu"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />

            <Button type="submit" isLoading={isLoading} className="w-full mt-2">
              Đăng nhập hệ thống
            </Button>
          </form>

          {/* Quick Demo Fill Button */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center space-y-3">
            <p className="text-xs text-slate-400">Dành cho buổi chạy thử nghiệm đồ án:</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleLoginDemo}
              disabled={isLoading}
              className="w-full text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 hover:bg-indigo-50 font-semibold"
            >
              <Sparkles className="w-4 h-4 mr-1.5" />
              Đăng nhập 1 chạm Demo (May Boutique)
            </Button>
          </div>
        </Card>

        {/* Footer Link to Register and Landing */}
        <div className="text-center space-y-2 text-xs text-slate-500 dark:text-slate-400">
          <p>
            Chưa có cửa hàng trên ShopFlow?{' '}
            <Link
              to="/register"
              className="font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
            >
              Đăng ký shop mới ngay
            </Link>
          </p>
          <p>
            <Link
              to="/welcome"
              className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại trang giới thiệu</span>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

