import { Link } from 'react-router-dom';
import { ShoppingCart, Star, Flame, Sparkles, BadgePercent } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useToastStore } from '../../store/toastStore';
import type { Product } from '../../mock/data';
import ImageWithFallback from '../common/ImageWithFallback';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCartStore();
  const { showSuccess } = useToastStore();

  if (!product) return null;

  const price = product.salePrice || product.basePrice;
  const hasDiscount = !!product.salePrice && product.salePrice < product.basePrice;
  const discountPercent = hasDiscount
    ? Math.round(((product.basePrice - product.salePrice!) / product.basePrice) * 100)
    : 0;

  const handleAddToCart = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    addItem(product, 1);
    showSuccess(`Đã thêm "${product.name}" vào giỏ hàng!`);
  };

  const imageUrl = product.images?.[0]?.url || '/placeholder-product.png';
  const rating = product.rating !== undefined ? product.rating : 4.8;
  const reviewCount = product.reviewCount !== undefined ? product.reviewCount : 15;
  const brand = product.brandId || 'Điện lạnh';

  const primaryBadge = product.isBestSeller
    ? {
        label: 'Bán chạy',
        icon: <Flame className="h-2.5 w-2.5" />,
        cls: 'bg-gradient-to-r from-orange-700 to-red-600 shadow-orange-500/30',
      }
    : product.isNewArrival
      ? {
          label: 'Mới về',
          icon: <Sparkles className="h-2.5 w-2.5" />,
          cls: 'bg-gradient-to-r from-blue-700 to-cyan-600 shadow-blue-500/30',
        }
      : null;

  return (
    <article className="product-card-premium group relative flex h-full flex-col transition duration-300 hover:-translate-y-1 hover:border-blue-200/80 hover:shadow-xl hover:shadow-blue-500/5">
      <Link
        to={`/products/${product.slug}`}
        className="relative block h-[220px] flex-shrink-0 overflow-hidden rounded-t-[1.5rem]"
      >
        <div className="product-stage absolute inset-0 transition-opacity duration-300 group-hover:opacity-90" />
        <ImageWithFallback
          src={imageUrl}
          alt={product.name}
          width={440}
          height={440}
          className="relative z-10 h-full w-full object-contain p-6 transition-transform duration-500 ease-out group-hover:scale-[1.06]"
          loading="lazy"
          decoding="async"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-12 bg-gradient-to-t from-white/60 to-transparent" />

        <div className="pointer-events-none absolute left-3.5 top-3.5 z-30 flex flex-col gap-1.5">
          {primaryBadge && (
            <span className={`sale-badge ${primaryBadge.cls} flex items-center gap-1 shadow-lg`}>
              {primaryBadge.icon}
              {primaryBadge.label}
            </span>
          )}
          {hasDiscount && (
            <span className="sale-badge flex items-center gap-1 bg-gradient-to-r from-red-600 to-pink-600 shadow-lg">
              <BadgePercent className="h-2.5 w-2.5" />
              Giảm {discountPercent}%
            </span>
          )}
          {!product.inStock && (
            <span className="inline-flex items-center rounded-md bg-slate-700/95 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-white">
              Tạm hết hàng
            </span>
          )}
        </div>
        <div className="pointer-events-none absolute inset-0 z-20 bg-blue-950/0 transition-colors duration-300 group-hover:bg-blue-950/5" />
      </Link>

      <div className="flex flex-grow flex-col p-5">
        <span className="mb-1.5 text-[0.62rem] font-black uppercase leading-none tracking-widest text-blue-700">
          {brand}
        </span>

        <Link to={`/products/${product.slug}`} className="mb-2.5 block">
          <h3
            className="line-clamp-2 min-h-[2.4rem] text-[11.5px] font-bold leading-snug text-slate-800 transition-colors group-hover:text-blue-700"
            title={product.name}
          >
            {product.name}
          </h3>
        </Link>

        <div className="mb-4 flex items-center gap-1.5">
          <div role="img" aria-label={`${rating.toFixed(1)} trên 5 sao`} className="flex">
            {[...Array(5)].map((_, index) => (
              <Star
                key={index}
                aria-hidden="true"
                className={`h-3 w-3 ${
                  index < Math.floor(rating)
                    ? 'fill-amber-400 text-amber-400'
                    : 'fill-slate-200 text-slate-200'
                }`}
              />
            ))}
          </div>
          <span className="text-[10px] font-bold text-slate-500">
            {rating.toFixed(1)} ({reviewCount} đánh giá)
          </span>
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-slate-100 pt-3.5">
          <div className="flex min-w-0 flex-col">
            {hasDiscount && (
              <span className="mb-1 text-[10px] font-medium leading-none text-slate-500 line-through">
                {new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: 'VND',
                }).format(product.basePrice)}
              </span>
            )}
            <span className="bg-gradient-to-r from-orange-700 to-red-600 bg-clip-text text-sm font-black leading-none text-transparent">
              {new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
                maximumFractionDigits: 0,
              }).format(price)}
            </span>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!product.inStock}
            aria-label={`Thêm ${product.name} vào giỏ hàng`}
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition duration-200 hover:scale-105 hover:bg-gradient-to-r hover:from-blue-700 hover:to-cyan-600 hover:text-white hover:shadow-md hover:shadow-blue-500/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-300 disabled:shadow-none"
          >
            <ShoppingCart aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}
