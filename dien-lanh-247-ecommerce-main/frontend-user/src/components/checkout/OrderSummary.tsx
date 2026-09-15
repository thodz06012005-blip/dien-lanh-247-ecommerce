import { useCartStore } from '../../store/cartStore';
import { Tag, X } from 'lucide-react';
import { useSettings } from '../../hooks/useSettings';
import ImageWithFallback from '../common/ImageWithFallback';
import { visualAssets } from '../../constants/visualAssets';

interface OrderSummaryProps {
  showItems?: boolean;
}

export default function OrderSummary({ showItems = true }: OrderSummaryProps) {
  const { settings } = useSettings();
  const { items, voucher, applyVoucher, getTotals } = useCartStore();

  // Safe Settings Fallbacks
  const safeSettings = {
    shippingFee: settings?.shippingFee ?? 0,
    freeShippingThreshold: settings?.freeShippingThreshold ?? 5000000,
  };

  const { subtotal, discount, shipping, total } = getTotals(safeSettings.shippingFee, safeSettings.freeShippingThreshold);

  const handleRemoveVoucher = () => {
    applyVoucher(null);
  };

  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 flex flex-col gap-5">
      <h3 className="font-bold text-slate-900 text-sm pb-3.5 border-b border-slate-100">
        Tóm tắt đơn hàng
      </h3>

      {/* Items List (optional) */}
      {showItems && items.length > 0 && (
        <div className="flex flex-col gap-3.5 max-h-60 overflow-y-auto pr-1">
          {items.map((item) => {
            const price = item.product.salePrice || item.product.basePrice;
            return (
              <div key={item.product.id} className="flex gap-3 items-center text-xs">
                <ImageWithFallback
                  src={item.product.images?.[0]?.url || visualAssets.fallback}
                  alt={item.product.name}
                  className="w-11 h-11 object-contain bg-white p-1 rounded-lg border border-slate-100 flex-shrink-0"
                />
                <div className="flex-grow">
                  <h4 className="font-bold text-slate-800 line-clamp-1">{item.product.name}</h4>
                  <span className="text-3xs text-slate-400 mt-0.5 block">
                    SL: {item.quantity} x {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)}
                  </span>
                </div>
                <div className="flex-shrink-0 font-extrabold text-slate-800">
                  {new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND',
                  }).format(price * item.quantity)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Price breakdown */}
      <div className="flex flex-col gap-3 border-t border-slate-50 pt-4 text-xs">
        <div className="flex justify-between items-center text-slate-500">
          <span>Tạm tính hàng hóa</span>
          <span className="font-bold text-slate-800">
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(subtotal)}
          </span>
        </div>

        {/* Voucher Applied */}
        {voucher && (
          <div className="flex justify-between items-center text-emerald-600 bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
            <span className="flex items-center gap-1.5 font-bold">
              <Tag className="w-3.5 h-3.5" />
              Mã: {voucher.code}
            </span>
            <div className="flex items-center gap-1.5">
              <span className="font-black">
                -{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(discount)}
              </span>
              <button
                onClick={handleRemoveVoucher}
                className="w-5 h-5 rounded-full hover:bg-emerald-100 flex items-center justify-center text-emerald-500 cursor-pointer"
                title="Gỡ mã giảm giá"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center text-slate-500">
          <span>Phí vận chuyển & lắp đặt</span>
          <span className="font-bold text-slate-800">
            {shipping === 0 ? (
              <span className="text-emerald-600">Miễn phí</span>
            ) : (
              new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(shipping)
            )}
          </span>
        </div>
      </div>

      {/* Grand Total */}
      <div className="border-t border-slate-100 pt-4 flex justify-between items-center">
        <span className="text-xs font-bold text-slate-800">Tổng cộng thanh toán</span>
        <span className="text-lg md:text-xl font-black text-primary-600 leading-none">
          {new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
          }).format(total)}
        </span>
      </div>

      <div className="text-3xs text-slate-400 leading-normal border-t border-slate-50 pt-3">
        {subtotal < safeSettings.freeShippingThreshold ? (
          <p>* Miễn phí vận chuyển cho đơn hàng từ <strong>{safeSettings.freeShippingThreshold.toLocaleString('vi-VN')}đ</strong>.</p>
        ) : (
          <p className="text-emerald-600 font-bold">* Chúc mừng! Đơn hàng của bạn đủ điều kiện miễn phí giao lắp 2h.</p>
        )}
      </div>
    </div>
  );
}
