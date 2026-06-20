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

  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ duration: 0.22, ease: [0.34, 1.56, 0.64, 1] }}
      className={`category-card-premium group cursor-pointer ${
        featured
          ? 'ring-2 ring-blue-500/30 shadow-lg shadow-blue-500/10'
          : ''
      }`}
    >
      <Link to={`/products?categoryId=${id}`} className="flex flex-col items-center text-center p-5 gap-3.5">
        {/* Icon wrapper */}
        <div
          className={`
            w-14 h-14 rounded-2xl flex items-center justify-center shrink-0
            transition-all duration-300
            ${featured
              ? 'bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-500/20'
              : 'bg-gradient-to-br from-slate-50 to-blue-50/60 text-blue-600 group-hover:from-blue-600 group-hover:to-cyan-500 group-hover:text-white group-hover:shadow-md group-hover:shadow-blue-500/20'
            }
          `}
        >
          <IconComponent className="w-6 h-6" />
        </div>

        {/* Name */}
        <h3 className={`text-[0.72rem] font-bold leading-snug transition-colors
          ${featured ? 'text-blue-700' : 'text-slate-800 group-hover:text-blue-600'}`}>
          {name}
        </h3>

        {/* Count pill */}
        <span className={`
          inline-block px-2.5 py-0.5 rounded-full text-[0.58rem] font-extrabold uppercase tracking-wider
          transition-all duration-300
          ${featured
            ? 'bg-blue-100 text-blue-700'
            : 'bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600'
          }
        `}>
          {productCount} SP
        </span>
      </Link>
    </motion.div>
  );
}
