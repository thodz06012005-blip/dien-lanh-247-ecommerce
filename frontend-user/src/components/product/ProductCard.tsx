import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
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

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, 1);
    showSuccess(`Đã thêm "${product.name}" vào giỏ hàng!`);
  };

  const imageUrl = product.images?.[0]?.url || '/placeholder-product.png';
  const rating = product.rating !== undefined ? product.rating : 4.8;
  const reviewCount = product.reviewCount !== undefined ? product.reviewCount : 15;
  const brand = product.brandId || 'Điện lạnh';

  // Determine primary badge
  const primaryBadge = product.isBestSeller
    ? { label: 'Bán chạy', icon: <Flame className="w-2.5 h-2.5" />, cls: 'bg-gradient-to-r from-orange-500 to-red-500 shadow-orange-500/30' }
    : product.isNewArrival
    ? { label: 'Mới về', icon: <Sparkles className="w-2.5 h-2.5" />, cls: 'bg-gradient-to-r from-blue-600 to-cyan-500 shadow-blue-500/30' }
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.35 }}
      className="product-card-premium flex flex-col h-full group relative hover:border-blue-200/80 hover:shadow-xl hover:shadow-blue-500/4"
    >
      {/* ── Image Zone ──────────────────────────────────────────── */}
      <Link
        to={`/products/${product.slug}`}
        className="relative block overflow-hidden flex-shrink-0 rounded-t-[1.5rem]"
        style={{ height: '220px' }}
      >
        {/* Product stage background */}
        <div className="absolute inset-0 product-stage transition-opacity duration-300 group-hover:opacity-90" />

        <ImageWithFallback
          src={imageUrl}
          alt={product.name}
          className="relative z-10 w-full h-full object-contain p-6 transition-transform duration-500 ease-out group-hover:scale-[1.08]"
          loading="lazy"
        />

        {/* Soft bottom fade */}
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white/60 to-transparent z-20 pointer-events-none" />

        {/* Badge stack */}
        <div className="absolute top-3.5 left-3.5 z-30 flex flex-col gap-1.5 pointer-events-none">
          {primaryBadge && (
            <span className={`sale-badge ${primaryBadge.cls} flex items-center gap-1 shadow-lg`}>
              {primaryBadge.icon}
              {primaryBadge.label}
            </span>
          )}
          {hasDiscount && (
            <span className="sale-badge flex items-center gap-1 shadow-lg bg-gradient-to-r from-red-500 to-pink-500">
              <BadgePercent className="w-2.5 h-2.5" />
              Giảm {discountPercent}%
            </span>
          )}
          {!product.inStock && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-600/90 text-white text-[0.6rem] font-bold uppercase tracking-wide">
              Tạm hết hàng
            </span>
          )}
        </div>

        {/* Quick-add hover overlay */}
        <div className="absolute inset-0 z-20 bg-blue-950/0 group-hover:bg-blue-950/4 transition-colors duration-300 pointer-events-none" />
      </Link>

      {/* ── Info Zone ──────────────────────────────────────────── */}
      <div className="p-5 flex flex-col flex-grow">
        {/* Brand */}
        <span className="text-[0.62rem] font-black text-blue-600/80 uppercase tracking-widest mb-1.5 leading-none">
          {brand}
        </span>

        {/* Product name */}
        <Link to={`/products/${product.slug}`} className="block mb-2.5">
          <h3
            className="text-[11.5px] font-bold text-slate-800 group-hover:text-blue-600 transition-colors leading-snug line-clamp-2"
            title={product.name}
            style={{ minHeight: '2.4rem' }}
          >
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-1.5 mb-4">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-3 h-3 ${
                  i < Math.floor(rating)
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-slate-200 fill-slate-200'
                }`}
              />
            ))}
          </div>
          <span className="text-[9px] font-bold text-slate-400">
            {rating.toFixed(1)} ({reviewCount} đánh giá)
          </span>
        </div>

        {/* Price + Cart */}
        <div className="mt-auto pt-3.5 border-t border-slate-100 flex items-end justify-between gap-3">
          <div className="flex flex-col min-w-0">
            {hasDiscount && (
              <span className="text-[10px] text-slate-400 line-through font-medium leading-none mb-1">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.basePrice)}
              </span>
            )}
            <span className="text-sm font-black leading-none bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
              {new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
                maximumFractionDigits: 0,
              }).format(price)}
            </span>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={!product.inStock}
            title="Thêm vào giỏ hàng"
            className="
              w-9 h-9 rounded-xl shrink-0
              flex items-center justify-center
              transition-all duration-250 cursor-pointer
              bg-slate-100 text-slate-500
              hover:bg-gradient-to-r hover:from-blue-600 hover:to-cyan-500 hover:text-white
              hover:scale-108 hover:shadow-md hover:shadow-blue-500/20
              disabled:bg-slate-100 disabled:text-slate-300 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none
            "
          >
            <ShoppingCart className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
