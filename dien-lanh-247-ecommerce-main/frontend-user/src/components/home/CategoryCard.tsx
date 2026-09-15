import * as Icons from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface CategoryCardProps {
  id: string;
  name: string;
  iconName: string;
  productCount: number;
  featured?: boolean;
}

export default function CategoryCard({ id, name, iconName, productCount, featured = false }: CategoryCardProps) {
  const IconComponent = (Icons[iconName as keyof typeof Icons] as React.ElementType) || Icons.HelpCircle;
  const isService = id === 'dich-vu';

  let displayName = name;
  if (name === 'Máy lọc không khí') displayName = 'Lọc không khí';
  else if (name === 'Linh kiện điện lạnh') displayName = 'Linh kiện';
  else if (name === 'Dịch vụ lắp đặt & sửa chữa') displayName = 'Dịch vụ kỹ thuật';

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.03 }}
      transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
      className={`category-card-premium group cursor-pointer relative overflow-hidden h-[165px] flex flex-col justify-center ${
        isService
          ? 'border-orange-100 bg-orange-50/20 ring-1 ring-orange-500/10'
          : featured
          ? 'ring-2 ring-blue-500/25 shadow-lg shadow-blue-500/8 border-blue-100'
          : 'border-slate-100'
      }`}
    >
      {isService && (
        <span className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-orange-500 text-[8px] font-black uppercase text-white tracking-wide scale-90 pointer-events-none">
          Dịch vụ
        </span>
      )}
      
      <Link to={`/products?categoryId=${id}`} className="flex flex-col items-center text-center p-4 gap-2.5">
        {/* Icon wrapper */}
        <div
          className={`
            w-14 h-14 rounded-2xl flex items-center justify-center shrink-0
            transition-all duration-300
            ${isService
              ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-md shadow-orange-500/20'
              : featured
              ? 'bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-500/20'
              : 'bg-gradient-to-br from-slate-50 to-blue-50/40 text-blue-600 group-hover:from-blue-600 group-hover:to-cyan-500 group-hover:text-white group-hover:shadow-md group-hover:shadow-blue-500/20'
            }
          `}
        >
          <IconComponent className="w-6 h-6" />
        </div>

        {/* Name */}
        <h3 className={`text-sm font-extrabold leading-snug transition-colors line-clamp-1
          ${isService 
            ? 'text-orange-700 group-hover:text-orange-600'
            : featured 
            ? 'text-blue-700' 
            : 'text-slate-800 group-hover:text-blue-600'
          }`}
        >
          {displayName}
        </h3>

        {/* Count pill */}
        <span className={`
          inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider
          transition-all duration-300
          ${isService
            ? 'bg-orange-100 text-orange-700'
            : featured
            ? 'bg-blue-50 text-blue-700'
            : 'bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600'
          }
        `}>
          {productCount} {isService ? 'Gói' : 'SP'}
        </span>
      </Link>
    </motion.div>
  );
}
