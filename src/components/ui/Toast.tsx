import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-react';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => removeToast(id), 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
};

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  const getIcon = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getColorClasses = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start space-x-3 p-4 rounded-lg border shadow-lg ${getColorClasses(toast.type)} animate-slide-in`}
        >
          {getIcon(toast.type)}
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 dark:text-white">{toast.title}</h4>
            {toast.message && (
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{toast.message}</p>
            )}
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

export const toast = {
  success: (title: string, message?: string) => {
    const event = new CustomEvent('toast', {
      detail: { type: 'success', title, message }
    });
    window.dispatchEvent(event);
  },
  error: (title: string, message?: string) => {
    const event = new CustomEvent('toast', {
      detail: { type: 'error', title, message }
    });
    window.dispatchEvent(event);
  },
  info: (title: string, message?: string) => {
    const event = new CustomEvent('toast', {
      detail: { type: 'info', title, message }
    });
    window.dispatchEvent(event);
  },
  warning: (title: string, message?: string) => {
    const event = new CustomEvent('toast', {
      detail: { type: 'warning', title, message }
    });
    window.dispatchEvent(event);
  }
};

if (typeof window !== 'undefined') {
  let toastHandler: ((e: any) => void) | null = null;

  window.addEventListener('DOMContentLoaded', () => {
    const context = document.querySelector('[data-toast-context]');
    if (context) {
      toastHandler = (e: any) => {
        const addToast = (window as any).__toastAddFunction;
        if (addToast) {
          addToast(e.detail);
        }
      };
      window.addEventListener('toast', toastHandler);
    }
  });
}
