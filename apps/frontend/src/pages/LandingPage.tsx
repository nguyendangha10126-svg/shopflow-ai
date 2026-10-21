import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Sparkles,
  CheckCircle2,
  Package,
  BookOpen,
  ArrowRight,
  Star
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/api';
import { useToast } from '../components/ui/Toast';
import Button from '../components/ui/Button';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();

  const handleQuickDemo = async () => {
    try {
      const response = await apiClient.post<any>('/auth/login', {
        email: 'owner@mayboutique.vn',
        password: 'ShopFlow@123',
      });
      login(response.data.tokens.access_token, response.data.user);
      showToast('Đã vào chế độ trải nghiệm demo May Boutique!', 'success');
      navigate('/');
    } catch {
      // Direct navigation if backend demo fallback
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      {/* 1. Header / Navbar */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-extrabold shadow-md shadow-indigo-500/20">
              SF
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                ShopFlow AI
              </span>
              <span className="text-[10px] ml-1.5 px-1.5 py-0.5 rounded font-mono font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                v2.0
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-8 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <a href="#features" className="hover:text-indigo-600 transition-colors">
              Tính năng
            </a>
            <a href="#how-it-works" className="hover:text-indigo-600 transition-colors">
              Cách hoạt động
            </a>
            <a href="#pricing" className="hover:text-indigo-600 transition-colors">
              Bảng giá
            </a>
            <a href="#testimonials" className="hover:text-indigo-600 transition-colors">
              Đánh giá
            </a>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              to="/login"
              className="text-xs sm:text-sm font-semibold px-3 py-2 text-slate-700 dark:text-slate-200 hover:text-indigo-600 transition-colors"
            >
              Đăng nhập
            </Link>
            <Button
              onClick={handleQuickDemo}
              className="bg-indigo-600 hover:bg-indigo-700 text-xs sm:text-sm shadow-md shadow-indigo-600/20 font-semibold"
            >
              <Sparkles className="w-4 h-4 mr-1.5" />
              Thử Demo ngay
            </Button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-24 bg-gradient-to-b from-white via-indigo-50/30 to-slate-50 dark:from-slate-900 dark:via-indigo-950/20 dark:to-slate-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs font-semibold shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Bóc Tách Đơn Hàng Dành Riêng Cho Shop Thời Trang Online</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-slate-900 dark:text-slate-100">
            Chốt đơn đa kênh trong{' '}
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              3 giây
            </span>
            <br />
            Quản lý kho tức thời, không sợ bán trùng
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            Chỉ cần sao chép đoạn chat khách gửi trên Zalo hoặc Messenger và bấm <b>Dán tin AI</b>.
            ShopFlow tự động trích xuất sản phẩm, size, màu, số điện thoại, địa chỉ và giữ tồn kho an toàn ngay lập tức.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              onClick={handleQuickDemo}
              size="lg"
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-600/30 text-sm"
            >
              <span>Vào trải nghiệm shop mẫu</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Link
              to="/register"
              className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-sm transition-colors"
            >
              Đăng ký tài khoản mới
            </Link>
          </div>

          <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Miễn phí trải nghiệm
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Không cần thẻ tín dụng
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Tối ưu dùng 1 tay trên điện thoại
            </span>
          </div>
        </div>
      </section>

      {/* 3. Tính năng cốt lõi (Core Features) */}
      <section id="features" className="py-16 sm:py-20 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
              Giải pháp toàn diện cho chủ shop bận rộn
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Thiết kế chuyên sâu phục vụ cách bán hàng thực tế tại Việt Nam: nhanh gọn, chuẩn xác và không phức tạp.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 hover:border-indigo-300 dark:hover:border-indigo-700 transition space-y-3">
              <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center font-bold">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                Dán tin AI 1-chạm
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Khách nhắn viết tắt, không dấu, lộn xộn thông tin? AI tự động nhận diện mẫu mã, phân loại size/màu, trích xuất địa chỉ và cảnh báo nếu thiếu thông tin để shop hỏi lại.
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 hover:border-indigo-300 dark:hover:border-indigo-700 transition space-y-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center font-bold">
                <Package className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                Trừ kho an toàn tức thì
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Đơn chốt đến đâu trừ kho ngay đến đó. Khi hủy đơn, hệ thống tự động hoàn kho. Chủ shop luôn biết chính xác từng chiếc váy, áo còn lại bao nhiêu trên kệ.
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 hover:border-indigo-300 dark:hover:border-indigo-700 transition space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center font-bold">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                Trả lời khách theo chính sách
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Nạp sẵn quy định đổi size, phí ship các tỉnh, bảng size chuẩn. AI sẽ tự động trả lời đúng chính sách shop mà không bịa đặt, kèm trích dẫn văn bản minh bạch.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Bảng giá dịch vụ (Pricing Table - Rule A3) */}
      <section id="pricing" className="py-16 sm:py-20 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
              Bảng giá dịch vụ minh bạch
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Chọn gói phù hợp với quy mô kinh doanh của shop. Nâng cấp hoặc hủy bất kỳ lúc nào.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Gói Free */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">Gói Khởi Đầu (Free)</h3>
                  <p className="text-xs text-slate-500 mt-1">Dành cho shop mới mở hoặc bán nhỏ lẻ</p>
                </div>
                <div className="py-2">
                  <span className="text-2xl font-black text-slate-800 dark:text-slate-200">
                    Giá sẽ cập nhật
                  </span>
                </div>
                <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>30 lượt bóc tách đơn AI / tháng</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Quản lý tối đa 50 sản phẩm</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Hỗ trợ hỏi đáp chính sách shop</span>
                  </li>
                </ul>
              </div>

              <Button variant="outline" onClick={handleQuickDemo} className="w-full text-xs">
                Dùng thử miễn phí
              </Button>
            </div>

            {/* Gói Basic - Nổi bật */}
            <div className="p-6 rounded-2xl border-2 border-indigo-600 bg-white dark:bg-slate-900 shadow-xl relative flex flex-col justify-between space-y-6">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider">
                Phổ biến nhất
              </span>
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-lg text-indigo-600 dark:text-indigo-400">Gói Tiêu Chuẩn (Basic)</h3>
                  <p className="text-xs text-slate-500 mt-1">Dành cho shop thời trang có lượng đơn đều đặn</p>
                </div>
                <div className="py-2">
                  <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                    Giá sẽ cập nhật
                  </span>
                </div>
                <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>500 lượt bóc tách đơn AI / tháng</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Không giới hạn sản phẩm & SKU</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Đầy đủ báo cáo doanh thu & biểu đồ 7 ngày</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Hồ sơ CRM khách quen & lịch sử mua hàng</span>
                  </li>
                </ul>
              </div>

              <Button onClick={handleQuickDemo} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md">
                Đăng ký gói Basic
              </Button>
            </div>

            {/* Gói Pro */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">Gói Nâng Cao (Pro)</h3>
                  <p className="text-xs text-slate-500 mt-1">Dành cho chuỗi cửa hàng & kho đa kênh</p>
                </div>
                <div className="py-2">
                  <span className="text-2xl font-black text-slate-800 dark:text-slate-200">
                    Giá sẽ cập nhật
                  </span>
                </div>
                <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Không giới hạn lượt gọi AI</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Tích hợp Cloudinary CDN lưu trữ ảnh riêng</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Phân quyền nhiều nhân viên chốt đơn</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Hỗ trợ kỹ thuật 24/7 ưu tiên</span>
                  </li>
                </ul>
              </div>

              <Button variant="outline" onClick={handleQuickDemo} className="w-full text-xs">
                Liên hệ tư vấn Pro
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Cảm nhận khách hàng (Testimonials) */}
      <section id="testimonials" className="py-16 sm:py-20 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-xl mx-auto space-y-1">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Được tin dùng bởi hơn 200+ shop online
            </h2>
            <p className="text-xs text-slate-500">Xem các chủ shop nói gì về trải nghiệm cùng ShopFlow AI</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 space-y-3 text-xs">
              <div className="flex text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-500" />
                ))}
              </div>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed italic">
                "Trước đây nhân viên phải ngồi gõ lại từng địa chỉ với size mất cả buổi tối. Giờ chỉ cần dán đoạn tin nhắn Zalo vào là xong trong 3 giây, kho trừ chuẩn từng cái."
              </p>
              <div className="font-bold text-slate-900 dark:text-slate-100">
                Chị Thu Hương — Chủ May Boutique (Hà Nội)
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 space-y-3 text-xs">
              <div className="flex text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-500" />
                ))}
              </div>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed italic">
                "Thao tác một tay trên điện thoại cực mượt. Nút dán tin nổi ở giữa màn hình rất tiện khi vừa nhắn tin vừa chốt đơn cho khách."
              </p>
              <div className="font-bold text-slate-900 dark:text-slate-100">
                Anh Tuấn Kiệt — Mina Studio (TP.HCM)
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 space-y-3 text-xs">
              <div className="flex text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-500" />
                ))}
              </div>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed italic">
                "Phần trả lời chính sách AI giải quyết được 80% câu hỏi về đổi size và phí ship của khách lúc nửa đêm mà không cần người trực."
              </p>
              <div className="font-bold text-slate-900 dark:text-slate-100">
                Chị Bích Thảo — Le Soleil Brand (Đà Nẵng)
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 dark:text-slate-100">ShopFlow AI</span>
            <span>• Nền tảng quản lý bán hàng thông minh</span>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login" className="hover:underline">
              Đăng nhập
            </Link>
            <Link to="/register" className="hover:underline">
              Đăng ký
            </Link>
            <Link to="/styleguide" className="hover:underline">
              Design System
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
