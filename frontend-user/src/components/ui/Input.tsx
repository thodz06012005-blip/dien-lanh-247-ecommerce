import React, { forwardRef, type ReactNode } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  containerClassName?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, containerClassName, id, type = 'text', leftIcon, rightIcon, ...props }, ref) => {
    const inputId = id || Math.random().toString(36).substring(2, 9);

    return (
      <div className={twMerge(clsx('flex w-full flex-col gap-1.5', containerClassName))}>
        {label && (
          <label htmlFor={inputId} className="select-none text-sm font-semibold text-slate-700">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">{leftIcon}</span>}
          <input
            id={inputId}
            type={type}
            ref={ref}
            className={twMerge(
              clsx(
                'w-full rounded-xl border bg-white px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400',
                leftIcon && 'pl-10',
                rightIcon && 'pr-10',
                error
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                  : 'border-slate-200 hover:border-slate-300 focus:border-primary-600 focus:ring-primary-500/20',
              ),
              className,
            )}
            {...props}
          />
          {rightIcon && <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">{rightIcon}</span>}
        </div>
        {error && <span className="text-xs font-medium text-red-500">{error}</span>}
        {!error && helperText && <span className="text-xs text-slate-400">{helperText}</span>}
      </div>
    );
  },
);

Input.displayName = 'Input';

export default Input;
