// Toast utility component for notifications
import React, { createContext, useContext, useState } from 'react';

interface Toast {
  id: string;
  title: string;
  description?: string;
  duration?: number;
  type?: 'default' | 'success' | 'error' | 'warning' | 'info';
}

interface ToastContextType {
  toasts: Toast[];
  toast: (toast: Omit<Toast, 'id'>) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = ({ title, description, duration = 3000, type = 'default' }: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, description, duration, type }]);

    if (duration !== Infinity) {
      setTimeout(() => {
        dismiss(id);
      }, duration);
    }
  };

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

function ToastContainer() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-0 right-0 p-4 space-y-2 max-w-md z-50">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 flex items-start gap-3 border-l-4 ${
            toast.type === 'error' ? 'border-red-500' :
            toast.type === 'success' ? 'border-green-500' :
            toast.type === 'warning' ? 'border-yellow-500' :
            toast.type === 'info' ? 'border-blue-500' : 'border-gray-500'
          }`}
        >
          <div className="flex-1">
            <h4 className="font-medium text-sm">{toast.title}</h4>
            {toast.description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{toast.description}</p>
            )}
          </div>
          <button
            onClick={() => dismiss(toast.id)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <span className="sr-only">Close</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}

// Simple export for direct import usage
export const toast = {
  success: (props: { title: string; description?: string; duration?: number }) => ({
    ...props,
    type: 'success',
  }),
  error: (props: { title: string; description?: string; duration?: number }) => ({
    ...props,
    type: 'error',
  }),
  warning: (props: { title: string; description?: string; duration?: number }) => ({
    ...props,
    type: 'warning',
  }),
  info: (props: { title: string; description?: string; duration?: number }) => ({
    ...props,
    type: 'info',
  }),
};