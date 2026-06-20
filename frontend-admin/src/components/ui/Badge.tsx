import clsx from 'clsx';
import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  pill?: boolean;
  className?: string;
  dot?: boolean;
}

export default function Badge({ children, variant = 'neutral', pill = false, className, dot = false }: BadgeProps) {
  const baseClasses = "inline-flex items-center gap-1.5 font-bold uppercase tracking-wide border";
  
  const sizeClasses = pill 
    ? "px-2.5 py-1 text-[10px] rounded-full" 
    : "px-2 py-0.5 text-[9px] rounded-lg";

  const variants = {
    primary: "bg-blue-50 text-blue-700 border-blue-200/50",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200/50",
    warning: "bg-amber-50 text-amber-700 border-amber-200/50",
    danger: "bg-red-50 text-red-700 border-red-200/50",
    info: "bg-cyan-50 text-cyan-700 border-cyan-200/50",
    neutral: "bg-slate-50 text-slate-600 border-slate-200/50",
  };

  const dotColors = {
    primary: "bg-blue-500",
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    danger: "bg-red-500",
    info: "bg-cyan-500",
    neutral: "bg-slate-400",
  };

  return (
    <span className={clsx(baseClasses, sizeClasses, variants[variant], className)}>
      {dot && <span className={clsx("status-dot", dotColors[variant])} />}
      {children}
    </span>
  );
}
