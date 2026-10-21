import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  onUndo?: () => void;
  durationMs?: number;
}

export type ShowToastOptions =
  | Omit<ToastItem, 'id'>
  | { message: string; type?: 'success' | 'error' | 'info'; onUndo?: () => void; durationMs?: number };

interface ToastContextType {
  showToast: {
    (options: ShowToastOptions): void;
    (message: string, type?: 'success' | 'error' | 'info'): void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (
      arg1: ShowToastOptions | string,
      arg2: 'success' | 'error' | 'info' = 'info'
    ) => {
      let type: 'success' | 'error' | 'info' = 'info';
      let message = '';
      let onUndo: (() => void) | undefined;
      let durationMs = 4000;

      if (typeof arg1 === 'string') {
        message = arg1;
        type = arg2;
      } else {
        message = arg1.message;
        type = arg1.type || 'info';
        onUndo = arg1.onUndo;
        durationMs = arg1.durationMs || 4000;
      }

      const id = `${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, type, message, onUndo, durationMs }]);

      setTimeout(() => {
        removeToast(id);
      }, durationMs);
    },
    [removeToast]
  ) as ToastContextType['showToast'];

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Notification Container (Fixed góc dưới màn hình mobile / góc trên desktop) */}
      <div
        aria-live="polite"
        className="fixed bottom-16 sm:bottom-6 sm:right-6 z-50 flex flex-col space-y-2 pointer-events-none p-4 w-full sm:max-w-md"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto flex items-center justify-between p-3.5 rounded-xl shadow-lg border text-sm transition-all duration-300 animate-slide-up ${
              toast.type === 'success'
                ? 'bg-slate-900 text-white border-slate-800'
                : toast.type === 'error'
                ? 'bg-rose-600 text-white border-rose-700'
                : 'bg-indigo-600 text-white border-indigo-700'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <span aria-hidden="true" className="shrink-0">
                {toast.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : toast.type === 'error' ? (
                  <AlertTriangle className="w-4 h-4 text-rose-200" />
                ) : (
                  <Info className="w-4 h-4 text-indigo-200" />
                )}
              </span>
              <p className="font-medium text-xs sm:text-sm">{toast.message}</p>
            </div>

            <div className="flex items-center space-x-2">
              {toast.onUndo && (
                <button
                  onClick={() => {
                    toast.onUndo?.();
                    removeToast(toast.id);
                  }}
                  className="px-2 py-1 text-xs font-semibold bg-white/20 hover:bg-white/30 rounded transition"
                >
                  Hoàn tác
                </button>
              )}
              <button
                onClick={() => removeToast(toast.id)}
                className="p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition"
                aria-label="Đóng thông báo"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast phải được sử dụng bên trong ToastProvider');
  }
  return context;
};

export default ToastProvider;