import { ArrowUpDown } from 'lucide-react';

interface SortDropdownProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SortDropdown({ value, onChange }: SortDropdownProps) {
  const options = [
    { label: 'Mới nhất', value: 'newest' },
    { label: 'Bán chạy', value: 'bestSeller' },
    { label: 'Giá: Thấp đến Cao', value: 'priceAsc' },
    { label: 'Giá: Cao đến Thấp', value: 'priceDesc' },
    { label: 'Khuyến mãi hot', value: 'promoHot' },
  ];

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="product-sort" className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-slate-700">
        <ArrowUpDown aria-hidden="true" className="h-3.5 w-3.5" />
        Sắp xếp
      </label>
      <div className="relative">
        <select
          id="product-sort"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="cursor-pointer appearance-none rounded-xl border border-slate-300 bg-white py-2 pl-4 pr-8 text-xs font-bold text-slate-800 shadow-sm transition hover:border-slate-400 focus:border-primary-700 focus:outline-none focus:ring-4 focus:ring-primary-500/10"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <svg aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 fill-none stroke-current stroke-2 text-slate-600" viewBox="0 0 24 24">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
    </div>
  );
}
