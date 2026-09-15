import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Plus, Minus, ShoppingBag, ShieldCheck } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useNavigate } from 'react-router-dom';
import Button from '../ui/Button';
import ImageWithFallback from '../common/ImageWithFallback';
import { visualAssets } from '../../constants/visualAssets';

interface MiniCartProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MiniCart({ isOpen, onClose }: MiniCartProps) {
  const { items, removeItem, updateQuantity, getTotals } = useCartStore();
  const { subtotal } = getTotals();
  const navigate = useNavigate();

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Prevent background scrolling
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleCheckoutClick = () => {
    onClose();
    navigate('/checkout');
  };

  const handleCartClick = () => {
    onClose();
    navigate('/cart');
  };

  const handleContinueShopping = () => {
    onClose();
    navigate('/products');
  };

  const handleConfirmDelete = (productId: string) => {
    removeItem(productId);
    setConfirmDeleteId(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop with premium blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
          />

          {/* Sidebar Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
            className="relative w-full max-w-md h-full bg-[#f8fafc] shadow-2xl flex flex-col z-10"
          >
            {/* Header: Deep Navy & Ice Cyan combo */}
            <div className="bg-[#061527] text-white px-6 py-5 flex justify-between items-center relative overflow-hidden">
              {/* Subtle Cyan background glow */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#06b6d4]/10 rounded-full blur-2xl z-0" />
              
              <div className="flex items-center gap-2.5 relative z-10">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shadow-md shadow-blue-500/10">
                  <ShoppingBag className="w-4.5 h-4.5 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="font-black text-sm uppercase tracking-wide">Giỏ hàng</span>
                  <span className="text-4xs text-cyan-300 font-bold uppercase tracking-widest mt-0.5">Điện Lạnh 247</span>
                </div>
                <span className="ml-1.5 bg-cyan-950 text-cyan-400 border border-cyan-800/30 text-3xs font-black px-2.5 py-0.5 rounded-full">
                  {items.reduce((acc, item) => acc + item.quantity, 0)}
                </span>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer relative z-10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Item List Container */}
            <div className="flex-grow overflow-y-auto px-5 py-5 flex flex-col gap-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12 px-4">
                  <div className="w-32 h-32 rounded-[2rem] overflow-hidden mb-6">
                    <ImageWithFallback
                      src={visualAssets.emptyCart}
                      alt="Giỏ trống"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">Giỏ hàng trống</h4>
                  <p className="text-3xs text-slate-500 max-w-[220px] mt-2 leading-relaxed">
                    Chưa có thiết bị điện lạnh nào được thêm. Hãy bắt đầu chọn sản phẩm để nhận ưu đãi lắp đặt 2h!
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    className="mt-6 rounded-xl text-3xs py-2.5 px-4 bg-[#061527] hover:bg-slate-900 border-0"
                    onClick={handleContinueShopping}
                  >
                    Tiếp tục mua sắm
                  </Button>
                </div>
              ) : (
                items.map((item) => {
                  const price = item.product.salePrice || item.product.basePrice;
                  const isConfirmingDelete = confirmDeleteId === item.product.id;

                  return (
                    <div
                      key={item.product.id}
                      className="bg-white rounded-2xl p-3.5 border border-slate-100 hover:border-blue-50/80 shadow-2xs transition-all flex gap-3.5 relative overflow-hidden"
                    >
                      {/* Inline Confirm Delete Overlay */}
                      {isConfirmingDelete && (
                        <div className="absolute inset-0 bg-white/95 z-10 flex flex-col items-center justify-center p-3 text-center animate-fadeIn">
                          <p className="text-[10px] font-bold text-slate-800 mb-2.5">Xóa sản phẩm này khỏi giỏ?</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-3 py-1.5 bg-slate-100 text-slate-600 text-4xs font-black rounded-lg transition-all cursor-pointer"
                            >
                              Hủy
                            </button>
                            <button
                              onClick={() => handleConfirmDelete(item.product.id)}
                              className="px-3 py-1.5 bg-red-500 text-white text-4xs font-black rounded-lg shadow-sm transition-all cursor-pointer"
                            >
                              Xóa
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Product Thumbnail */}
                      <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-100 flex-shrink-0 bg-white">
                        <ImageWithFallback
                          src={item.product.images?.[0]?.url || visualAssets.fallback}
                          alt={item.product.name}
                          className="w-full h-full object-contain p-1"
                        />
                      </div>

                      {/* Product details */}
                      <div className="flex-grow flex flex-col justify-between min-w-0">
                        <div>
                          <h5 className="text-[11px] font-black text-slate-900 line-clamp-1 leading-normal">
                            {item.product.name}
                          </h5>
                          <span className="text-[9px] text-slate-400 font-semibold block mt-0.5">
                            SKU: {item.product.sku}
                          </span>
                          {item.product.quantity <= 10 && (
                            <span className="text-[9px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded mt-1 inline-block w-fit">
                              Chỉ còn {item.product.quantity} sản phẩm
                            </span>
                          )}
                        </div>

                        <div className="flex justify-between items-center mt-2.5">
                          {/* Quantity Selector */}
                          <div className="flex items-center border border-slate-200 rounded-lg p-0.5 bg-slate-50/50">
                            <button
                              onClick={() => updateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                              className="w-5.5 h-5.5 flex items-center justify-center text-slate-500 hover:text-primary-600 hover:bg-white rounded transition-all active:scale-75 cursor-pointer"
                            >
                              <Minus className="w-2.5 h-2.5" />
                            </button>
                            <span className="px-2 text-3xs font-extrabold text-slate-800">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              disabled={item.quantity >= item.product.quantity}
                              className="w-5.5 h-5.5 flex items-center justify-center text-slate-500 hover:text-primary-600 hover:bg-white rounded transition-all active:scale-75 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <Plus className="w-2.5 h-2.5" />
                            </button>
                          </div>

                          {/* Price */}
                          <div className="text-right">
                            <span className="text-xs font-black text-slate-900">
                              {new Intl.NumberFormat('vi-VN', {
                                style: 'currency',
                                currency: 'VND',
                              }).format(price * item.quantity)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Delete icon button */}
                      <div className="flex-shrink-0 flex items-start">
                        <button
                          onClick={() => setConfirmDeleteId(item.product.id)}
                          className="text-slate-300 hover:text-red-500 p-1 rounded-full hover:bg-red-50 transition-colors cursor-pointer"
                          title="Xóa sản phẩm"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Sticky Footer Summary */}
            {items.length > 0 && (
              <div className="border-t border-slate-100 px-6 py-6 bg-white flex flex-col gap-4 shadow-lg shadow-slate-900/5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500">Tạm tính hàng hóa:</span>
                  <span className="text-lg font-black text-primary-600">
                    {new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND',
                    }).format(subtotal)}
                  </span>
                </div>
                
                {/* Mini trust statement */}
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 bg-emerald-50 p-2 rounded-xl border border-emerald-100/50">
                  <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="font-semibold">Miễn phí giao lắp & COD khi nhận máy</span>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-1.5">
                  <Button
                    variant="outline"
                    onClick={handleCartClick}
                    className="w-full py-2.5 rounded-xl text-3xs font-black uppercase tracking-wider transition-all active:scale-98"
                  >
                    Xem giỏ hàng
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleCheckoutClick}
                    className="w-full py-2.5 rounded-xl text-3xs font-black uppercase tracking-wider bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 border-0 shadow-md shadow-orange-500/10 transition-all active:scale-98"
                  >
                    Thanh toán
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
