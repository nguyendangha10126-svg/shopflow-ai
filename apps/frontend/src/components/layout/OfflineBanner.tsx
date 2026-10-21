import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { useToast } from '../ui/Toast';

export const OfflineBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const { showToast } = useToast();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('Đã khôi phục kết nối Internet thành công!', 'success');
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showToast]);

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-amber-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 shadow-md sticky top-0 z-50 animate-fade-in"
    >
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>
        Bạn đang ngắt kết nối Internet. Dữ liệu đã tải trên máy vẫn hiển thị an toàn.
      </span>
    </div>
  );
};

export default OfflineBanner;
