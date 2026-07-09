'use client';

import { forwardRef, type MouseEvent } from 'react';
import { cn } from '@/lib/utils';

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, helperText, className, onClick, ...props }, ref) => {
    const openPicker = (event: MouseEvent<HTMLInputElement>) => {
      onClick?.(event);

      if (event.defaultPrevented || !['date', 'time', 'datetime-local'].includes(String(props.type))) {
        return;
      }

      try {
        (event.currentTarget as HTMLInputElement & { showPicker?: () => void }).showPicker?.();
      } catch {
        // Browsers can reject showPicker outside direct user activation.
      }
    };

    return (
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-white">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <input
          ref={ref}
          className={cn(
            'w-full h-12 px-4 rounded-md bg-[#050505] text-white border-2 border-white/25 hover:border-white/60 focus:outline-none focus:ring-2 focus:ring-[#CCFF00]/70 focus:border-[#CCFF00] transition-colors placeholder:opacity-100 placeholder:text-gray-500',
            ['date', 'time', 'datetime-local'].includes(String(props.type)) && 'date-input cursor-pointer',
            error && 'border-red-500 focus:border-red-600 focus:ring-red-200',
            className
          )}
          onClick={openPicker}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-sm text-gray-300 font-medium">{helperText}</p>
        )}
      </div>
    );
  }
);

FormField.displayName = 'FormField';












