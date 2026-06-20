import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'rect' | 'circle';
}

export default function Skeleton({
  className,
  variant = 'rect',
  ...props
}: SkeletonProps) {
  const baseClass = 'animate-pulse bg-slate-200';

  const variants = {
    text: 'h-4 w-full rounded',
    rect: 'rounded-xl',
    circle: 'rounded-full',
  };

  return (
    <div
      className={twMerge(clsx(baseClass, variants[variant], className))}
      {...props}
    />
  );
}
