import React, { forwardRef } from 'react';
import clsx from 'clsx';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { label: string; value: string | number }[];
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={id} className="text-[13px] font-medium text-slate-700">
            {label}
          </label>
        )}
        <select
          id={id}
          ref={ref}
          className={clsx(
            'w-full h-10 px-4 bg-white border rounded-xl text-sm transition-all focus:outline-none focus:ring-4 cursor-pointer appearance-none',
            error
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
              : 'border-slate-200 focus:border-primary-600 focus:ring-primary-500/10 hover:border-slate-300',
            className
          )}
          style={{
            backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 12px center',
            backgroundSize: '16px'
          }}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <span className="text-3xs text-red-500 font-semibold">{error}</span>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
