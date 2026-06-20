import React from 'react';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export default function Button({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-semibold transition-all rounded-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-primary-600 hover:bg-primary-750 text-white shadow-md shadow-primary-500/10 active:scale-[0.98]',
    secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-[0.98]',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-500/10 active:scale-[0.98]',
    outline: 'border border-slate-200 hover:border-slate-300 text-slate-700 bg-white hover:bg-slate-50 active:scale-[0.98]'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4.5 py-2.5 text-xs',
    lg: 'px-6 py-3.5 text-sm'
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={clsx(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
      {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  );
}
