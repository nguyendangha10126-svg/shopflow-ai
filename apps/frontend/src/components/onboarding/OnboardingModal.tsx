import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Package,
  ArrowRight,
  Store,
  Check
} from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useToast } from '../ui/Toast';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAiIngest: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onOpenAiIngest,
}) => {
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1: Store profile
  const [shopName, setShopName] = useState('May Boutique');
  const [shopPhone, setShopPhone] = useState('0912345678');
  const [shopCategory, setShopCategory] = useState('Thời trang nữ thiết kế');

  const handleNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    localStorage.setItem('shopflow_onboarding_completed', 'true');
    showToast('Hoàn tất hướng dẫn khởi động cửa hàng!', 'success');
    onClose();
  };

  const handleTryAi = () => {
    handleComplete();
    onOpenAiIngest();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleComplete}
      title="Khởi Động Nhanh Cửa Hàng (3 Bước)"
      maxWidth="max-w-lg"
    >
      <div className="space-y-5">
        {/* Progress Stepper */}
        <div className="flex items-center justify-between relative px-2">
          <div className="absolute top-1/2 left-6 right-6 h-0.5 bg-slate-200 dark:bg-slate-700 -translate-y-1/2 -z-0" />

          {[1, 2, 3].map((step) => {
            const isCompleted = step < currentStep;
            const isCurrent = step === currentStep;

            return (
              <div
                key={step}
                className="flex flex-col items-center gap-1 z-10 bg-white dark:bg-slate-900 px-2"
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                    isCompleted
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : step}
                </div>
                <span
                  className={`text-[10px] font-semibold ${
                    isCurrent ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'
                  }`}
                >
                  {step === 1 ? 'Thông tin shop' : step === 2 ? 'Kho & Chính sách' : 'Thử chốt đơn'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Step 1: Shop Profile */}
        {currentStep === 1 && (
          <div className="space-y-4 animate-fade-in text-xs sm:text-sm">
            <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 text-xs text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
              <Store className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Xác nhận thông tin cơ bản để hiển thị trên hóa đơn và tin nhắn gửi khách.</span>
            </div>

            <Input
              label="Tên cửa hàng"
              placeholder="May Boutique"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
            />
            <Input
              label="Số điện thoại / Hotline"
              placeholder="0912345678"
              value={shopPhone}
              onChange={(e) => setShopPhone(e.target.value)}
            />
            <Input
              label="Ngành hàng chính"
              placeholder="Thời trang nữ"
              value={shopCategory}
              onChange={(e) => setShopCategory(e.target.value)}
            />
          </div>
        )}

        {/* Step 2: Catalog & Policies */}
        {currentStep === 2 && (
          <div className="space-y-4 animate-fade-in text-xs sm:text-sm">
            <div className="p-3 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 text-xs text-purple-900 dark:text-purple-200 flex items-center gap-2">
              <Package className="w-4 h-4 text-purple-600 shrink-0" />
              <span>Cửa hàng mẫu đã được chuẩn bị sẵn 4 mặt hàng và 3 bộ chính sách chuẩn.</span>
            </div>

            <div className="space-y-2 border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-slate-50 dark:bg-slate-800/40">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> 4 Sản phẩm thời trang (8 SKUs)
                </span>
                <span className="text-emerald-600">Đã kích hoạt</span>
              </div>
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> 3 Chính sách mẫu (Đổi trả, Ship, Bảng size)
                </span>
                <span className="text-emerald-600">Đã nạp</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500">
              Bạn có thể tự do thêm, sửa hoặc xóa sản phẩm và chính sách bất cứ lúc nào trong menu bên trái.
            </p>
          </div>
        )}

        {/* Step 3: Try AI First Order */}
        {currentStep === 3 && (
          <div className="space-y-4 animate-fade-in text-xs sm:text-sm text-center py-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-purple-500/30">
              <Sparkles className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                Sẵn sàng chốt đơn AI đầu tiên!
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Bấm nút bên dưới để mở cửa sổ Dán tin AI và thử nghiệm với 1 trong 3 đoạn tin nhắn khách mẫu có sẵn.
              </p>
            </div>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={handleComplete}
            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            Bỏ qua hướng dẫn
          </button>

          <div className="flex items-center gap-2">
            {currentStep > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentStep(currentStep - 1)}
              >
                Quay lại
              </Button>
            )}

            {currentStep < 3 ? (
              <Button
                variant="primary"
                size="sm"
                onClick={handleNextStep}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <span>Tiếp tục</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={handleTryAi}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md shadow-purple-600/30"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                <span>Thử Dán Tin AI Ngay</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default OnboardingModal;
