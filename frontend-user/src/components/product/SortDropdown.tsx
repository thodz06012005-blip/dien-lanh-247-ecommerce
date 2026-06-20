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
      <span className="text-3xs font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
        Sắp xếp:
      </span>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none pr-8 pl-4 py-2 bg-white border border-slate-200/80 rounded-xl text-xs font-bold text-slate-700 hover:border-slate-350 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-600 transition-all cursor-pointer shadow-2xs"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
          <svg className="w-3 h-3 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </div>
    </div>
  );
}
