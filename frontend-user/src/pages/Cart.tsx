import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowLeft, Ticket, ShieldCheck, CheckCircle2, RefreshCw, PhoneCall } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useToastStore } from '../store/toastStore';
import { vouchers } from '../mock/data';
import Breadcrumb from '../components/common/Breadcrumb';
import OrderSummary from '../components/checkout/OrderSummary';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useState } from 'react';
import { useSettings } from '../hooks/useSettings';
import ImageWithFallback from '../components/common/ImageWithFallback';
import { visualAssets } from '../constants/visualAssets';
import PageTransition from '../components/common/PageTransition';
import TrustBadges from '../components/common/TrustBadges';

export default function Cart() {
  const { settings } = useSettings();
  const { items, updateQuantity, removeItem, voucher, applyVoucher, getTotals } = useCartStore();
  const { showSuccess, showError } = useToastStore();
  const navigate = useNavigate();

  const [voucherCodeInput, setVoucherCodeInput] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Safe Settings Fallbacks
  const safeSettings = {
    shippingFee: settings?.shippingFee ?? 0,
    freeShippingThreshold: settings?.freeShippingThreshold ?? 5000000,
  };
  
  const { subtotal } = getTotals(safeSettings.shippingFee, safeSettings.freeShippingThreshold);

  const handleApplyVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    const code = voucherCodeInput.trim().toUpperCase();
    if (!code) return;

    const found = vouchers.find((v) => v.code === code);
    if (found) {
      if (subtotal < found.minOrderValue) {
        showError(
          `Mã ${code} yêu cầu đơn hàng tối thiểu ${new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
          }).format(found.minOrderValue)}`
        );
      } else {
        applyVoucher(found);
        showSuccess(`Áp dụng mã giảm giá ${code} thành công!`);
        setVoucherCodeInput('');
      }
    } else {
      showError('Mã giảm giá không tồn tại hoặc đã hết hạn!');
    }
  };

  const handleVoucherClick = (code: string) => {
    const found = vouchers.find((v) => v.code === code);
    if (found) {
      if (subtotal < found.minOrderValue) {
        showError(
          `Mã ${code} yêu cầu đơn hàng tối thiểu ${new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
          }).format(found.minOrderValue)}`
        );
      } else {
        applyVoucher(found);
        showSuccess(`Áp dụng mã giảm giá ${code} thành công!`);
      }
    }
  };

  const handleConfirmDelete = (productId: string) => {
    const item = items.find((i) => i.product.id === productId);
    if (item) {
      removeItem(productId);
      showSuccess(`Đã xóa "${item.product.name}" khỏi giỏ hàng!`);
    }
    setConfirmDeleteId(null);
  };

  // If cart is empty
  if (items.length === 0) {
    return (
      <PageTransition>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Breadcrumb items={[{ name: 'Giỏ hàng' }]} />
          
          <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm text-center max-w-3xl mx-auto mt-6">
            <div className="w-48 h-48 mb-8 overflow-hidden rounded-[2rem]">
              <ImageWithFallback
                src={visualAssets.emptyCart}
                alt="Giỏ hàng trống"
                className="w-full h-full object-cover"
              />
            </div>
            
            <h1 className="text-xl md:text-2xl font-black text-slate-900">
              Giỏ hàng đang trống
            </h1>
            <p className="text-xs md:text-sm text-slate-500 mt-3 max-w-md leading-relaxed">
              Khám phá điều hòa, tủ lạnh, máy giặt chính hãng và dịch vụ lắp đặt siêu tốc của Điện Lạnh 247.
            </p>
            
            <Link to="/products" className="mt-8">
              <Button
                variant="primary"
                size="lg"
                className="px-8 py-3.5 rounded-2xl font-extrabold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white border-0 shadow-lg shadow-orange-500/20 active:scale-95 transition-transform"
              >
                Mua sắm ngay
              </Button>
            </Link>

            <div className="mt-16 w-full pt-8 border-t border-slate-100">
              <p className="text-3xs font-extrabold uppercase text-slate-400 tracking-wider mb-4">Cam kết dịch vụ từ Điện Lạnh 247</p>
              <TrustBadges />
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumbs */}
        <Breadcrumb items={[{ name: 'Giỏ hàng' }]} />

        {/* Premium Banner Header */}
        <div className="relative mb-10 overflow-hidden bg-slate-900 rounded-[2rem] shadow-xl border border-slate-800 p-6 md:p-10 flex flex-col justify-center min-h-[160px] md:min-h-[200px]">
          {/* Background gradient & image overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#061527] via-[#061527]/95 to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-1/2 hidden md:block z-0">
            <ImageWithFallback
              src={visualAssets.cartHero}
              alt="Cart Banner"
              className="w-full h-full object-cover opacity-25"
            />
          </div>

          <div className="relative z-20 max-w-2xl">
            <span className="text-3xs font-black text-cyan-400 uppercase tracking-widest bg-cyan-950 border border-cyan-800 px-3 py-1 rounded-full inline-block mb-3.5">
              ĐIỆN LẠNH 247 SHOPPING CART
            </span>
            <h1 className="text-2xl md:text-3xl font-black text-white">
              Giỏ hàng của bạn
            </h1>
            <p className="text-2xs md:text-xs text-slate-300 mt-2 max-w-xl leading-relaxed">
              Kiểm tra sản phẩm, số lượng và áp dụng các chương trình ưu đãi trước khi tiến hành thanh toán.
            </p>

            {/* Mini Trust Badges inside Banner */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 mt-6 pt-5 border-t border-slate-800 text-[10px] md:text-xs text-slate-300 font-semibold">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                Giao lắp siêu tốc 2h
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                COD Nhận hàng kiểm tra
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                Bảo hành chính hãng
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Cart Items & Vouchers */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              {items.map((item) => {
                const price = item.product.salePrice || item.product.basePrice;
                const originalPrice = item.product.salePrice ? item.product.basePrice : null;
                const isConfirmingDelete = confirmDeleteId === item.product.id;

                return (
                  <div
                    key={item.product.id}
                    className="bg-white rounded-[2rem] p-5 md:p-6 border border-slate-100 hover:border-blue-100 shadow-2xs hover:shadow-xs transition-all relative flex flex-col sm:flex-row gap-5 overflow-hidden"
                  >
                    {/* Inline Delete Confirmation Overlay */}
                    {isConfirmingDelete && (
                      <div className="absolute inset-0 bg-white/95 backdrop-blur-3xs z-10 flex flex-col items-center justify-center p-4 text-center animate-fadeIn">
                        <p className="text-xs font-bold text-slate-900 mb-3">
                          Xác nhận xóa <span className="text-primary-600">"{item.product.name}"</span> khỏi giỏ hàng?
                        </p>
                        <div className="flex gap-3">
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-3xs font-black rounded-xl transition-all cursor-pointer"
                          >
                            Hủy bỏ
                          </button>
                          <button
                            onClick={() => handleConfirmDelete(item.product.id)}
                            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-3xs font-black rounded-xl shadow-sm transition-all cursor-pointer"
                          >
                            Xác nhận xóa
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Product Thumbnail */}
                    <div className="w-24 h-24 bg-white rounded-2xl border border-slate-100 overflow-hidden flex-shrink-0 mx-auto sm:mx-0">
                      <ImageWithFallback
                        src={item.product.images?.[0]?.url || visualAssets.fallback}
                        alt={item.product.name}
                        className="w-full h-full object-contain p-1"
                      />
                    </div>

                    {/* Details Info */}
                    <div className="flex-grow flex flex-col justify-between text-center sm:text-left">
                      <div>
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
                          <span className="text-[10px] font-black text-primary-600 bg-primary-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                            {item.product.brandId}
                          </span>
                          <span className="text-3xs font-semibold text-slate-400">
                            SKU: {item.product.sku}
                          </span>
                        </div>
                        <Link
                          to={`/products/${item.product.slug}`}
                          className="text-xs md:text-sm font-black text-slate-900 hover:text-primary-600 transition-colors line-clamp-2"
                        >
                          {item.product.name}
                        </Link>
                        {item.product.quantity <= 10 && (
                          <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md mt-1.5 inline-block w-fit">
                            Chỉ còn {item.product.quantity} sản phẩm
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-end justify-between mt-5 gap-4">
                        {/* Quantity Selector */}
                        <div className="flex items-center justify-center border border-slate-200 rounded-xl w-fit mx-auto sm:mx-0 p-1 bg-slate-50/50">
                          <button
                            onClick={() => updateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                            className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-primary-600 hover:bg-white rounded-lg transition-all active:scale-90 cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-4 text-xs font-bold text-slate-800">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            disabled={item.quantity >= item.product.quantity}
                            className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-primary-600 hover:bg-white rounded-lg transition-all active:scale-90 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Pricing details */}
                        <div className="flex flex-col items-center sm:items-end justify-center">
                          <div className="flex items-center gap-1.5">
                            {originalPrice && (
                              <span className="text-3xs text-slate-400 line-through">
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(originalPrice)}
                              </span>
                            )}
                            <span className="text-3xs text-slate-500 font-medium">Đơn giá:</span>
                            <span className="text-xs font-bold text-slate-800">
                              {new Intl.NumberFormat('vi-VN', {
                                style: 'currency',
                                currency: 'VND',
                              }).format(price)}
                            </span>
                          </div>
                          
                          <div className="text-sm font-black text-slate-900 mt-1">
                            Tổng: {new Intl.NumberFormat('vi-VN', {
                              style: 'currency',
                              currency: 'VND',
                            }).format(price * item.quantity)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Remove button */}
                    <button
                      onClick={() => setConfirmDeleteId(item.product.id)}
                      className="absolute top-4 right-4 text-slate-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors cursor-pointer"
                      title="Xóa sản phẩm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Voucher Card */}
            <div className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-2xs flex flex-col gap-5">
              <h3 className="font-black text-slate-900 text-xs flex items-center gap-2">
                <Ticket className="w-5 h-5 text-primary-600" />
                Mã giảm giá & Khuyến mãi (Voucher)
              </h3>
              
              <form onSubmit={handleApplyVoucher} className="flex flex-col sm:flex-row gap-3">
                <Input
                  placeholder="Nhập mã voucher (ví dụ: DIENLANH247)"
                  value={voucherCodeInput}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVoucherCodeInput(e.target.value)}
                  className="py-3 px-4 text-xs rounded-xl"
                  containerClassName="flex-grow max-w-md"
                />
                <Button
                  type="submit"
                  className="px-6 py-3 rounded-xl text-xs font-black h-[42px] bg-slate-900 hover:bg-slate-800 text-white cursor-pointer"
                >
                  Áp dụng
                </Button>
              </form>

              {/* Suggestions */}
              <div className="flex flex-col gap-3 mt-2">
                <span className="text-3xs font-extrabold text-slate-400 uppercase tracking-wider">
                  Mã giảm giá phù hợp với giỏ hàng:
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {vouchers.map((v) => {
                    const isDisabled = subtotal < v.minOrderValue;
                    const isCurrent = voucher?.code === v.code;
                    return (
                      <button
                        key={v.code}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => handleVoucherClick(v.code)}
                        className={`text-left p-4 rounded-2xl border flex flex-col gap-1 transition-all ${
                          isCurrent
                            ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/10'
                            : isDisabled
                            ? 'opacity-50 bg-slate-50 border-slate-200 cursor-not-allowed'
                            : 'bg-white border-slate-200 hover:border-primary-400 hover:bg-primary-50/10 cursor-pointer'
                        }`}
                      >
                        <div className="flex justify-between items-center w-full">
                          <span className={`text-xs font-black tracking-wide ${isCurrent ? 'text-emerald-700' : 'text-slate-900'}`}>
                            {v.code}
                          </span>
                          {isCurrent ? (
                            <span className="text-[9px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                              Đang áp dụng
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold text-slate-400">
                              Đơn tối thiểu: {new Intl.NumberFormat('vi-VN').format(v.minOrderValue)}đ
                            </span>
                          )}
                        </div>
                        <p className="text-3xs text-slate-500 mt-1 leading-relaxed">
                          {v.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <Link
              to="/products"
              className="inline-flex items-center gap-2 text-xs font-black text-primary-600 hover:text-primary-700 transition-all w-fit mt-2 ml-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại danh sách sản phẩm
            </Link>
          </div>

          {/* Right Column: Order Summary & Checkout CTA */}
          <div className="lg:col-span-4 lg:sticky lg:top-28 flex flex-col gap-5">
            {/* Wrap in wrapper containing rounded-[2rem] styling if needed or customized */}
            <OrderSummary showItems={false} />
            
            <Button
              variant="primary"
              size="lg"
              className="w-full py-4 rounded-2xl font-black bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white border-0 shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-all text-xs tracking-wider uppercase cursor-pointer"
              onClick={() => navigate('/checkout')}
            >
              Tiến hành thanh toán
            </Button>

            {/* Visual commitments card */}
            <div className="bg-slate-50 rounded-[2rem] border border-slate-100 p-5 flex flex-col gap-3.5">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                Yên tâm mua sắm cùng Điện Lạnh 247
              </span>
              <div className="flex flex-col gap-3 text-3xs font-semibold text-slate-500">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <span>Miễn phí lắp đặt, bao test 7 ngày 1 đổi 1</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                    <RefreshCw className="w-3.5 h-3.5" />
                  </div>
                  <span>Thanh toán COD linh hoạt khi bàn giao máy</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                    <PhoneCall className="w-3.5 h-3.5" />
                  </div>
                  <span>Kỹ thuật viên tư vấn giải pháp tối ưu công suất</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
