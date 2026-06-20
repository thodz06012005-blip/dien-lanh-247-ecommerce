import ProductCard from './ProductCard';
import Skeleton from '../ui/Skeleton';
import type { Product } from '../../mock/data';

interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
  skeletonCount?: number;
}

export default function ProductGrid({
  products,
  isLoading = false,
  skeletonCount = 8,
}: ProductGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[...Array(skeletonCount)].map((_, i) => (
          <div key={i} className="bg-white rounded-3xl p-5 border border-slate-105 shadow-sm flex flex-col gap-4">
            <Skeleton className="w-full aspect-square rounded-2xl" />
            <Skeleton className="h-4 w-1/3 rounded" />
            <Skeleton className="h-5 w-3/4 rounded" />
            <Skeleton className="h-4 w-1/2 rounded" />
            <div className="flex justify-between items-center mt-4">
              <Skeleton className="h-6 w-1/3 rounded" />
              <Skeleton className="h-10 w-10 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <div key={product.id}>
          <ProductCard product={product} />
        </div>
      ))}
    </div>
  );
}
