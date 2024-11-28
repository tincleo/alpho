import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ToastProps {
  variant?: 'default' | 'destructive';
  onClose?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export interface ToastActionElement {
  altText?: string;
  onClick: () => void;
  children: React.ReactNode;
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ className, variant = 'default', children, onClose }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-lg border p-4 pr-6 shadow-lg transition-all',
          variant === 'default' && 'bg-white text-gray-900',
          variant === 'destructive' && 'bg-red-600 text-white',
          className
        )}
      >
        <div className="flex-1">{children}</div>
        {onClose && (
          <button
            onClick={onClose}
            className="inline-flex h-6 w-6 items-center justify-center rounded-md hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }
);
Toast.displayName = 'Toast';

const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="fixed bottom-0 right-0 z-50 flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
      {children}
    </div>
  );
};

const ToastTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="text-sm font-semibold">{children}</div>
);

const ToastDescription: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="text-sm opacity-90">{children}</div>
);

export {
  type ToastActionElement,
  ToastProvider,
  Toast,
  ToastTitle,
  ToastDescription,
};
