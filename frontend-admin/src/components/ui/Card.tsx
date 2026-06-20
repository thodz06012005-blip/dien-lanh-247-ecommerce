import clsx from 'clsx';
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  headerRight?: React.ReactNode;
  noPadding?: boolean;
}

export default function Card({ 
  children, 
  className, 
  onClick, 
  title, 
  subtitle, 
  headerRight,
  noPadding = false 
}: CardProps) {
  const isInteractive = !!onClick;
  const hasHeader = !!title || !!subtitle || !!headerRight;

  return (
    <div
      onClick={onClick}
      className={clsx(
        'admin-card flex flex-col',
        isInteractive && 'admin-card-hover cursor-pointer',
        className
      )}
    >
      {hasHeader && (
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="flex flex-col">
            {title && <h3 className="text-[15px] font-bold text-slate-800 leading-tight">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
          </div>
          {headerRight && <div className="shrink-0">{headerRight}</div>}
        </div>
      )}
      <div className={clsx('flex-grow', !noPadding && 'p-6')}>
        {children}
      </div>
    </div>
  );
}
