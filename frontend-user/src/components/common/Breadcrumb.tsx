import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  name: string;
  path?: string;
  onClick?: () => void;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Đường dẫn trang" className="mb-4 inline-flex max-w-full items-center gap-2 overflow-x-auto rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-sm text-slate-700 shadow-sm backdrop-blur">
      <Link to="/" className="flex shrink-0 items-center font-semibold transition-colors hover:text-primary-800">
        <Home aria-hidden="true" className="mr-1 h-3.5 w-3.5" />
        <span>Trang chủ</span>
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <div key={`${item.name}-${index}`} className="flex min-w-0 items-center gap-2">
            <ChevronRight aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-slate-500" />
            {isLast || (!item.path && !item.onClick) ? (
              <span aria-current={isLast ? 'page' : undefined} className="max-w-[150px] truncate font-bold text-slate-950 md:max-w-xs">
                {item.name}
              </span>
            ) : item.path ? (
              <Link to={item.path} onClick={item.onClick} className="font-semibold transition-colors hover:text-primary-800">
                {item.name}
              </Link>
            ) : (
              <button type="button" onClick={item.onClick} className="cursor-pointer border-0 bg-transparent p-0 text-left font-semibold transition-colors hover:text-primary-800">
                {item.name}
              </button>
            )}
          </div>
        );
      })}
    </nav>
  );
}
