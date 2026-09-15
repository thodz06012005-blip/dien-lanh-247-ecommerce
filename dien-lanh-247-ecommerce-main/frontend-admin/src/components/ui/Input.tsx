import React, { forwardRef } from 'react';
import clsx from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, type = 'text', id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={id} className="text-[13px] font-medium text-slate-700">
            {label}
          </label>
        )}
        <input
          id={id}
          type={type}
          ref={ref}
          className={clsx(
            'w-full h-10 px-4 bg-white border rounded-xl text-sm transition-all focus:outline-none focus:ring-4',
            error
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
              : 'border-slate-200 focus:border-primary-600 focus:ring-primary-500/10 hover:border-slate-300',
            className
          )}
          {...props}
        />
        {error && (
          <span className="text-3xs text-red-500 font-semibold">{error}</span>
        )}
        {!error && helperText && (
          <span className="text-3xs text-slate-400 font-semibold">{helperText}</span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
