import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Star, ShoppingCart, Check, HelpCircle, Phone, MessageCircle } from 'lucide-react';
import api from '../services/api';
import type { Product } from '../mock/data';
import Breadcrumb from '../components/common/Breadcrumb';
import ProductGallery from '../components/product/ProductGallery';
import ProductGrid from '../components/product/ProductGrid';
import Skeleton from '../components/ui/Skeleton';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import ImageWithFallback from '../components/common/ImageWithFallback';
import { useCartStore } from '../store/cartStore';
import { useToastStore } from '../store/toastStore';
import { useSettings } from '../hooks/useSettings';
import { visualAssets } from '../constants/visualAssets';

import useDocumentTitle from '../hooks/useDocumentTitle';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem } = useCartStore();
  const { showSuccess } = useToastStore();
  const { settings } = useSettings();

  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'warranty' | 'reviews'>('desc');

  // Load product details
  const { data: productData, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const res = await api.get(`/products/${id}`);
      return res.data;
    },
  });

  const product = productData?.data as Product | undefined;

  useDocumentTitle(product ? `${product.name} | Điện Lạnh 247` : 'Chi tiết sản phẩm', product?.description);

  // Load related products of same category
  const { data: relatedData } = useQuery({
    queryKey: ['products-related', product?.categoryId],
    queryFn: async () => {
      if (!product?.categoryId) return { data: [] };
      const res = await api.get('/products', {
        params: { categoryId: product.categoryId, limit: 5 },
      });
      return res.data;
    },
    enabled: !!product?.categoryId,
  });

  const relatedProducts = (relatedData?.data as Product[] || [])
    .filter((p) => p.id !== product?.id)
    .slice(0, 4);

  // Reset quantity when switching products
  useEffect(() => {
    setQuantity(1);
    window.scrollTo(0, 0);
  }, [id]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-10">
        <Skeleton className="h-6 w-1/3 rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-6">
            <Skeleton className="w-full aspect-square rounded-[2rem]" />
          </div>
          <div className="lg:col-span-6 flex flex-col gap-5">
            <Skeleton className="h-4 w-1/4 rounded" />
            <Skeleton className="h-10 w-3/4 rounded" />
            <Skeleton className="h-6 w-1/3 rounded" />
            <Skeleton className="h-32 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-xl font-bold text-slate-800">Không tìm thấy sản phẩm</h2>
        <p className="text-sm text-slate-500 mt-2">Sản phẩm có thể đã ngừng kinh doanh hoặc đường dẫn không đúng.</p>
        <Button variant="primary" className="mt-6 rounded-2xl" onClick={() => navigate('/products')}>
          Quay lại mua sắm
        </Button>
      </div>
    );
  }

  const price = product.salePrice || product.basePrice;
  const hasDiscount = !!product.salePrice && product.salePrice < product.basePrice;
  const discountPercent = hasDiscount
    ? Math.round(((product.basePrice - product.salePrice!) / product.basePrice) * 100)
    : 0;

  const handleAddToCart = () => {
    addItem(product, quantity);
    showSuccess(`Đã thêm ${quantity} sản phẩm "${product.name}" vào giỏ hàng thành công!`);
  };

  const handleBuyNow = () => {
    addItem(product, quantity);
    navigate('/checkout');
  };

  const categoryName = product.categoryId.charAt(0).toUpperCase() + product.categoryId.slice(1).replace('-', ' ');

  const breadcrumbItems = [
    { name: 'Sản phẩm', path: '/products' },
    { name: categoryName, path: `/products?categoryId=${product.categoryId}` },
    { name: product.name },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Breadcrumb */}
      <Breadcrumb items={breadcrumbItems} />

      {/* Main product block */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 bg-white p-6 md:p-10 rounded-[2rem] border border-slate-100/80 shadow-sm mb-12">
        {/* Left Column: Gallery */}
        <div className="lg:col-span-6">
          <ProductGallery images={product.images} name={product.name} />
        </div>

        {/* Right Column: Order details */}
        <div className="lg:col-span-6 flex flex-col justify-between">
          <div className="flex flex-col gap-5">
            <div className="flex justify-between items-center">
              <span className="text-4xs font-black text-slate-400 uppercase tracking-widest leading-none">
                Thương hiệu: <span className="text-primary-600 font-extrabold">{product.brandId.toUpperCase()}</span>
              </span>
              <span className="text-4xs font-bold text-slate-400 leading-none">
                SKU: {product.sku}
              </span>
            </div>

            <h1 className="text-lg md:text-xl lg:text-2xl font-black text-slate-900 leading-snug">
              {product.name}
            </h1>

            {/* Ratings summary */}
            <div className="flex items-center gap-2">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${
                      i < Math.floor(product.rating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-200'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs font-bold text-slate-700">{product.rating.toFixed(1)} / 5</span>
              <span className="text-slate-200">|</span>
              <span className="text-xs font-semibold text-slate-500">{product.reviewCount} Đánh giá</span>
            </div>

            {/* Badges container */}
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="primary" className="text-4xs uppercase px-2.5 py-1 font-extrabold tracking-wider">Chính hãng 100%</Badge>
              <Badge variant="success" className="text-4xs uppercase px-2.5 py-1 font-extrabold tracking-wider">Bảo hành kép</Badge>
              <Badge variant="info" className="text-4xs uppercase px-2.5 py-1 font-extrabold tracking-wider">Giao nhanh 2h</Badge>
              <Badge variant="neutral" className="text-4xs uppercase px-2.5 py-1 font-extrabold tracking-wider">Thanh toán COD</Badge>
            </div>

            {/* Price section */}
            <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100/80 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-4xs font-black text-slate-400 uppercase tracking-widest leading-none">Giá bán ưu đãi</span>
                <div className="flex items-baseline gap-2.5 mt-1">
                  <span className="text-xl md:text-2xl font-black text-[#F97316] leading-none">
                    {new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND',
                      maximumFractionDigits: 0
                    }).format(price)}
                  </span>
                  {hasDiscount && (
                    <span className="text-xs text-slate-400 line-through font-semibold">
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                        maximumFractionDigits: 0
                      }).format(product.basePrice)}
                    </span>
                  )}
                </div>
              </div>
              
              {hasDiscount && (
                <Badge variant="danger" className="text-3xs px-2.5 py-1 font-extrabold shadow-sm" pill>
                  Tiết kiệm {discountPercent}%
                </Badge>
              )}
            </div>

            {/* Short Description */}
            <p className="text-xs text-slate-600 leading-relaxed">
              {product.description}
            </p>

            {/* Stock status */}
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${product.inStock ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <span className="text-xs font-bold text-slate-700">
                {product.inStock ? `Còn hàng (Còn ${product.quantity} sản phẩm)` : 'Hết hàng'}
              </span>
            </div>

            {/* Configuration / Quantity Selector */}
            {product.inStock && (
              <div className="flex items-center gap-4 py-1">
                <span className="text-xs font-bold text-slate-700 select-none">Số lượng:</span>
                <div className="flex items-center border border-slate-200 rounded-xl bg-white shadow-2xs overflow-hidden">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-3.5 py-2.5 text-slate-600 hover:bg-slate-50 active:scale-90 transition-transform cursor-pointer font-bold text-xs"
                  >
                    -
                  </button>
                  <span className="px-5 text-xs font-extrabold text-slate-800">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(product.quantity, q + 1))}
                    className="px-3.5 py-2.5 text-slate-600 hover:bg-slate-50 active:scale-90 transition-transform cursor-pointer font-bold text-xs"
                  >
                    +
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Call-to-action buttons */}
          <div className="flex flex-col gap-3.5 mt-6 border-t border-slate-100 pt-6">
            {product.inStock ? (
              <>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="outline"
                    onClick={handleAddToCart}
                    leftIcon={<ShoppingCart className="w-4.5 h-4.5" />}
                    className="flex-1 py-3.5 rounded-2xl font-bold transition-all active:scale-98 cursor-pointer hover:border-[#2563EB] hover:text-[#2563EB]"
                  >
                    Thêm vào giỏ
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleBuyNow}
                    className="flex-1 py-3.5 rounded-2xl font-bold bg-gradient-to-r from-[#F97316] to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-0 shadow-lg shadow-orange-500/20 transition-all active:scale-98 cursor-pointer"
                  >
                    Mua ngay
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <a
                    href={`tel:${settings.hotline}`}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-slate-50 hover:bg-primary-50 text-slate-700 hover:text-[#2563EB] border border-slate-200/80 hover:border-blue-200 transition-all text-xs font-bold active:scale-98"
                  >
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span>Gọi tư vấn ({settings.hotline})</span>
                  </a>
                  <a
                    href={`https://zalo.me/${settings.zalo.replace(/\s+/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-slate-50 hover:bg-cyan-50 text-slate-700 hover:text-[#06B6D4] border border-slate-200/80 hover:border-cyan-200 transition-all text-xs font-bold active:scale-98"
                  >
                    <MessageCircle className="w-4 h-4 text-slate-400" />
                    <span>Chat Zalo</span>
                  </a>
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="p-4 bg-red-50/50 border border-red-100 rounded-2xl text-xs text-red-800 font-semibold leading-relaxed">
                  Sản phẩm hiện đang hết hàng. Vui lòng liên hệ tư vấn để được hỗ trợ sản phẩm thay thế.
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <a
                    href={`tel:${settings.hotline}`}
                    className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#2563EB] to-blue-700 text-white font-bold transition-all active:scale-98 text-xs shadow-lg shadow-blue-500/20"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Gọi tư vấn ({settings.hotline})</span>
                  </a>
                  <a
                    href={`https://zalo.me/${settings.zalo.replace(/\s+/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-[#06B6D4] hover:bg-[#0891b2] text-white font-bold transition-all active:scale-98 text-xs shadow-lg shadow-cyan-500/20"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Chat Zalo</span>
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Trust commitments grid */}
          <div className="grid grid-cols-2 gap-3 mt-6 pt-6 border-t border-slate-100">
            {[
              { title: 'Giao lắp 2h', desc: 'Nội thành siêu tốc', icon: '⚡' },
              { title: 'Chính hãng', desc: 'Bảo hành kép uy tín', icon: '🛡️' },
              { title: 'Thanh toán COD', desc: 'Nhận hàng kiểm tra', icon: '💵' },
              { title: 'Kỹ thuật 24/7', desc: 'Hỗ trợ kỹ thuật trọn đời', icon: '🛠️' },
            ].map((c, i) => (
              <div key={i} className="flex gap-2.5 p-3 rounded-2xl bg-slate-50/50 hover:bg-blue-50/30 border border-slate-100 hover:border-blue-100 transition-all hover:scale-102">
                <span className="text-sm">{c.icon}</span>
                <div className="flex flex-col">
                  <span className="text-3xs font-extrabold text-slate-800">{c.title}</span>
                  <span className="text-4xs text-slate-400 font-semibold">{c.desc}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Visual Trust Badge */}
          <div className="mt-4 p-3.5 rounded-2xl bg-cyan-50/30 border border-cyan-200 flex items-center gap-3">
            <ImageWithFallback
              src={visualAssets.productDetailTrust}
              alt="Trust Verification"
              className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
            />
            <span className="text-4xs font-bold text-cyan-800 leading-relaxed">
              Kỹ thuật viên Điện Lạnh 247 sẽ liên hệ xác nhận trước khi giao lắp.
            </span>
          </div>
        </div>
      </div>

      {/* Tabs description section */}
      <div className="bg-white rounded-[2rem] border border-slate-100/80 shadow-sm overflow-hidden mb-12">
        {/* Tabs header list */}
        <div className="flex border-b border-slate-100 bg-slate-50/50 overflow-x-auto">
          {[
            { label: 'Mô tả chi tiết', value: 'desc' },
            { label: 'Thông số kỹ thuật', value: 'specs' },
            { label: 'Chính sách bảo hành', value: 'warranty' },
            { label: 'Đánh giá khách hàng', value: 'reviews' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value as any)}
              className={`px-6 py-4.5 text-xs font-bold whitespace-nowrap transition-all border-b-2 cursor-pointer ${
                activeTab === tab.value
                  ? 'border-[#2563EB] text-[#2563EB] bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-950 hover:bg-slate-100/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab contents */}
        <div className="p-6 md:p-10">
          {activeTab === 'desc' && (
            <div className="prose max-w-none text-xs text-slate-600 leading-relaxed flex flex-col gap-4">
              <p className="font-bold text-slate-800">Thông tin chi tiết về sản phẩm {product.name}:</p>
              <p>{product.description}</p>
              <p>Hệ thống Điện Lạnh 247 cam kết lắp ráp và vận hành chuẩn mực chỉ trong ngày. Mọi sự cố phát sinh đều được kỹ thuật viên xử lý khẩn cấp nhanh gọn.</p>
              
              {product.features && (
                <div className="mt-4">
                  <h4 className="font-bold text-slate-900 mb-3 text-sm">Tính năng nổi bật:</h4>
                  <ul className="flex flex-col gap-2.5 pl-1">
                    {product.features.map((feat, i) => (
                      <li key={i} className="flex gap-2.5 items-start">
                        <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === 'specs' && (
            <div className="max-w-2xl">
              <h4 className="font-bold text-slate-900 mb-5 text-sm">Thông số kỹ thuật chi tiết:</h4>
              {!product.specifications || Object.keys(product.specifications).length === 0 ? (
                <p className="text-xs text-slate-500">Thông số kỹ thuật đang được cập nhật.</p>
              ) : (
                <table className="w-full text-xs text-left border-collapse">
                  <tbody>
                    {Object.entries(product.specifications).map(([key, val], idx) => (
                      <tr
                        key={key}
                        className={idx % 2 === 0 ? 'bg-slate-50/50' : 'bg-white'}
                      >
                        <td className="px-4 py-3 font-bold text-slate-700 border border-slate-100 w-1/3">
                          {key}
                        </td>
                        <td className="px-4 py-3 text-slate-600 border border-slate-100">
                          {val as string}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === 'warranty' && (
            <div className="prose max-w-none text-xs text-slate-600 leading-relaxed flex flex-col gap-4">
              <h4 className="font-bold text-slate-900 text-sm mb-2">Chính sách bảo hành sản phẩm Điện Lạnh 247</h4>
              <p>Tất cả sản phẩm bán ra đều được áp dụng chính sách bảo hành kép cực kỳ uy tín:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Bảo hành chính hãng:</strong> Kích hoạt bảo hành điện tử chính hãng theo số seri máy nén/dàn lạnh từ Daikin, Panasonic, LG, Samsung. Hỗ trợ liên hệ và làm việc với trạm bảo hành chính hãng.</li>
                <li><strong>Bảo hành kỹ thuật lắp ráp:</strong> Cam kết bảo hành các sự cố chảy nước dàn lạnh, rò rỉ gas do kỹ thuật kết nối của thợ trong vòng 1 năm. Xử lý miễn phí hoàn toàn nếu phát sinh sự cố trong thời gian bảo hành.</li>
                <li><strong>Đổi trả linh hoạt:</strong> Lỗi 1 đổi 1 trong 7 ngày nếu máy bị lỗi sản xuất nghiêm trọng.</li>
              </ul>
              <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl text-amber-800 text-2xs mt-2 flex gap-3">
                <HelpCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Lưu ý:</strong> Chúng tôi chỉ bảo hành cho sản phẩm do thợ Điện Lạnh 247 trực tiếp lắp ráp kết nối. Hóa đơn và phiếu nghiệm thu kỹ thuật là bằng chứng bảo hành.
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="flex flex-col gap-6">
              {!product.reviewCount ? (
                <p className="text-xs text-slate-500">Đánh giá sản phẩm đang được cập nhật.</p>
              ) : (
                <>
                  <div className="flex items-center gap-4">
                    <div className="text-center bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col gap-1 w-32">
                      <span className="text-3xl font-black text-slate-900">{product.rating}</span>
                      <div className="text-amber-400 text-sm">★ ★ ★ ★ ★</div>
                      <span className="text-3xs text-slate-400">({product.reviewCount} đánh giá)</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs">Đánh giá từ khách hàng đã mua</h4>
                      <p className="text-3xs text-slate-400 mt-1 max-w-sm">Tất cả đánh giá đều đến từ khách hàng đã đặt hàng COD hoặc sử dụng dịch vụ lắp ráp của Điện Lạnh 247.</p>
                    </div>
                  </div>
                  
                  <div className="border-t border-slate-100 pt-6 flex flex-col gap-5">
                    <div className="flex gap-4 p-4 rounded-2xl border border-slate-50">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-sm">
                        N
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-slate-900">Nguyễn Văn Bình</h5>
                        <div className="text-amber-400 text-2xs mt-0.5">★★★★★</div>
                        <p className="text-xs text-slate-600 mt-2">"Máy chạy siêu êm, mát lạnh nhanh và sâu. Dàn đồng nhìn rất cứng cáp. Thợ lắp gọn gàng, hút chân không cẩn thận trước khi sạc gas."</p>
                        <span className="text-3xs text-slate-400 mt-2 block">Cầu Giấy, Hà Nội | 12/06/2026</span>
                      </div>
                    </div>
                    <div className="flex gap-4 p-4 rounded-2xl border border-slate-50">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-sm">
                        T
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-slate-900">Trần Minh Quân</h5>
                        <div className="text-amber-400 text-2xs mt-0.5">★★★★☆</div>
                        <p className="text-xs text-slate-600 mt-2">"Dịch vụ chuyên nghiệp, giao hàng đúng giờ hẹn. Điều hòa làm lạnh tốt, chế độ gió Coanda dễ chịu cho em bé nằm không lo bị ho."</p>
                        <span className="text-3xs text-slate-400 mt-2 block">Quận 3, TP.HCM | 08/06/2026</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="w-full">
          <div className="mb-6">
            <h2 className="text-base md:text-lg font-black text-slate-950">Sản phẩm liên quan</h2>
            <p className="text-3xs text-slate-400 mt-0.5">Những lựa chọn tương tự được khách hàng quan tâm.</p>
          </div>
          <ProductGrid products={relatedProducts} />
        </section>
      )}
    </div>
  );
}
