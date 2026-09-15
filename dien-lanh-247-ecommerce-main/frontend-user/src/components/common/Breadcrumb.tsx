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
    <nav className="flex items-center space-x-2 text-3xs md:text-2xs text-slate-400 select-none pb-4">
      {/* Home link */}
      <Link to="/" className="flex items-center hover:text-primary-600 transition-colors">
        <Home className="w-3.5 h-3.5 mr-1" />
        <span>Trang chủ</span>
      </Link>
      
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <div key={index} className="flex items-center space-x-2">
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            {isLast || (!item.path && !item.onClick) ? (
              <span className="font-bold text-slate-700 truncate max-w-[150px] md:max-w-xs">
                {item.name}
              </span>
            ) : item.path ? (
              <Link
                to={item.path}
                onClick={item.onClick}
                className="hover:text-primary-600 transition-colors"
              >
                {item.name}
              </Link>
            ) : (
              <button
                onClick={item.onClick}
                className="hover:text-primary-600 transition-colors cursor-pointer bg-transparent border-0 p-0 text-left font-medium"
              >
                {item.name}
              </button>
            )}
          </div>
        );
      })}
    </nav>
  );
}
