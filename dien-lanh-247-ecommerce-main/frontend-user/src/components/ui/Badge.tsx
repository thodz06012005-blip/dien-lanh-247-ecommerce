import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  pill?: boolean;
}

export default function Badge({
  children,
  className,
  variant = 'primary',
  pill = false,
  ...props
}: BadgeProps) {
  const baseStyles = 'inline-flex items-center px-2.5 py-0.5 text-xs font-semibold select-none';

  const variants = {
    primary: 'bg-primary-50 text-primary-700 border border-primary-100',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    warning: 'bg-amber-50 text-amber-700 border border-amber-100',
    danger: 'bg-red-50 text-red-700 border border-red-100',
    info: 'bg-sky-50 text-sky-700 border border-sky-100',
    neutral: 'bg-slate-100 text-slate-700 border border-slate-200',
  };

  const shapes = pill ? 'rounded-full' : 'rounded-md';

  return (
    <span
      className={twMerge(
        clsx(baseStyles, variants[variant], shapes, className)
      )}
      {...props}
    >
      {children}
    </span>
  );
}
