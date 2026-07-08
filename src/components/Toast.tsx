'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  description?: string;
  duration?: number;
  onClose: (id: string) => void;
}

export interface ToastData {
  type: 'success' | 'error' | 'info';
  title: string;
  description?: string;
  duration?: number;
}

export function Toast({ id, type, title, description, duration = 5000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(id), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(id), 300);
  };

  const icons = {
    success: CheckCircle,
    error: XCircle,
    info: CheckCircle,
  };

  const colors = {
    success: 'bg-white/80 backdrop-blur-sm border-[#000000] text-[#000000]',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-white backdrop-blur-sm border-[#000000]/60 text-[#000000]',
  };

  const Icon = icons[type];

  return (
    <div
      className={cn(
        'relative w-full bg-white/90 backdrop-blur-sm border border-[#000000]/20 rounded-lg shadow-lg transform transition-all duration-300',
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0',
        colors[type]
      )}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <Icon className="h-5 w-5" />
          </div>
          <div className="ml-3 min-w-0 flex-1">
            <p className="text-sm font-medium break-words">{title}</p>
            {description && (
              <p className="mt-1 text-sm opacity-90 break-words">{description}</p>
            )}
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              className="rounded-md inline-flex text-[#666666] hover:text-[#000000] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#CCFF00] p-1 hover:bg-[#000000]/5 transition-colors"
              onClick={handleClose}
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ToastContainer({ toasts, onClose }: { toasts: ToastProps[]; onClose: (id: string) => void }) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 w-[320px] max-w-[90vw]">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={onClose} />
      ))}
    </div>
  );
}












