import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import CheckoutSteps from '../components/checkout/CheckoutSteps';
import OrderSummary from '../components/checkout/OrderSummary';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import api from '../services/api';
import { CheckCircle2, PhoneCall, Truck, MapPin, User, Mail, CreditCard, ChevronRight } from 'lucide-react';
import type { Order } from '../mock/data';
import { useSettings } from '../hooks/useSettings';
import ImageWithFallback from '../components/common/ImageWithFallback';
import { visualAssets } from '../constants/visualAssets';
import PageTransition from '../components/common/PageTransition';

interface ShippingFormInput {
  customerName: string;
  phone: string;
  email: string;
  city: string;
  district: string;
  addressDetail: string;
  note?: string;
}

export default function Checkout() {
  const { settings } = useSettings();
  const navigate = useNavigate();
  const { items, clearCart, getTotals } = useCartStore();
  const { user } = useAuthStore();
  const { showSuccess, showError } = useToastStore();

  const [step, setStep] = useState(1);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Safe Settings Fallbacks
  const safeSettings = {
    shippingFee: settings?.shippingFee ?? 0,
    freeShippingThreshold: settings?.freeShippingThreshold ?? 5000000,
    hotline: settings?.hotline || '1900 247',
    zalo: settings?.zalo || '0900 000 247',
  };

  const { discount, shipping, total } = getTotals(safeSettings.shippingFee, safeSettings.freeShippingThreshold);

  // Redirect to products page if cart is empty, we are not in success screen, and order is not created yet
  useEffect(() => {
    if (items.length === 0 && step < 3 && !createdOrder) {
      navigate('/products');
    }
  }, [items, step, createdOrder, navigate]);

  // Form handling
  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<ShippingFormInput>({
    defaultValues: {
      customerName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '',
      phone: user?.phone || '',
      email: user?.email || '',
      city: user?.city || '',
      district: user?.district || '',
      addressDetail: user?.addressDetail || '',
      note: '',
    },
  });

  // Prefill form if user logs in later
  useEffect(() => {
    if (user) {
      setValue('customerName', `${user.firstName || ''} ${user.lastName || ''}`.trim());
      setValue('phone', user.phone || '');
      setValue('email', user.email || '');
      setValue('city', user.city || '');
      setValue('district', user.district || '');
      setValue('addressDetail', user.addressDetail || '');
    }
  }, [user, setValue]);

  const onShippingSubmit = () => {
    setStep(2);
  };

  const handlePlaceOrder = async () => {
    if (isSubmitting) return;
    const shippingInfo = getValues();
    setIsSubmitting(true);
    
    try {
      // Map cart items into payload
      const orderItems = items.map((item) => ({
        productId: item.product.id,
        name: item.product.name,
        sku: item.product.sku,
        price: item.product.salePrice || item.product.basePrice,
        quantity: item.quantity,
        imageUrl: item.product.images?.[0]?.url || '',
      }));

      const payload = {
        ...shippingInfo,
        paymentMethod: 'cod',
        shippingFee: shipping,
        discountAmount: discount,
        totalAmount: total,
        items: orderItems,
      };

      const response = await api.post('/orders', payload);
      if (response.data?.success) {
        setCreatedOrder(response.data.data);
        setStep(3);
        clearCart(); // Clear local zustand store and storage AFTER setting state to prevent race redirects
        showSuccess('Đặt hàng thành công! Mã đơn hàng của bạn đã được khởi tạo.');
      }
    } catch (err) {
      showError('Có lỗi xảy ra trong quá trình đặt hàng. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Checkout step line indicator */}
        <CheckoutSteps currentStep={step} />

        {/* Progress Text Indicator */}
        {step < 3 && (
          <div className="flex items-center gap-1.5 text-3xs font-extrabold uppercase text-slate-400 tracking-wider mb-6 ml-1">
            <Link to="/cart" className="hover:text-primary-605 transition-colors">Giỏ hàng</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className={step === 1 ? 'text-primary-600' : 'text-slate-400'}>Thông tin</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className={step === 2 ? 'text-primary-600' : 'text-slate-400'}>Thanh toán</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-400">Hoàn tất</span>
          </div>
        )}

        {step === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Step 1 Left: Shipping Information Form */}
            <div className="lg:col-span-8 bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-2xs flex flex-col gap-6">
              <div className="flex items-center gap-2 pb-3.5 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-black text-slate-900">
                  Thông tin nhận hàng
                </h2>
              </div>

              <form onSubmit={handleSubmit(onShippingSubmit)} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Họ tên người nhận (*)"
                    placeholder="Ví dụ: Nguyễn Văn A"
                    error={errors.customerName?.message}
                    className="py-3 px-4 text-xs rounded-xl"
                    {...register('customerName', {
                      required: 'Vui lòng nhập họ tên người nhận',
                      minLength: { value: 3, message: 'Họ tên tối thiểu 3 ký tự' },
                    })}
                  />

                  <Input
                    label="Số điện thoại nhận hàng (*)"
                    placeholder="Ví dụ: 0987654321"
                    type="tel"
                    error={errors.phone?.message}
                    className="py-3 px-4 text-xs rounded-xl"
                    {...register('phone', {
                      required: 'Vui lòng nhập số điện thoại',
                      pattern: {
                        value: /^(0[3|5|7|8|9])([0-9]{8})$/,
                        message: 'Số điện thoại Việt Nam không hợp lệ (10 số)',
                      },
                    })}
                  />
                </div>

                <Input
                  label="Địa chỉ Email (Để nhận hóa đơn đơn hàng)"
                  placeholder="Ví dụ: email@gmail.com"
                  type="email"
                  error={errors.email?.message}
                  className="py-3 px-4 text-xs rounded-xl"
                  {...register('email', {
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Địa chỉ email không hợp lệ',
                    },
                  })}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Tỉnh / Thành phố (*)"
                    placeholder="Ví dụ: Hà Nội"
                    error={errors.city?.message}
                    className="py-3 px-4 text-xs rounded-xl"
                    {...register('city', { required: 'Vui lòng nhập Tỉnh/Thành phố' })}
                  />

                  <Input
                    label="Quận / Huyện (*)"
                    placeholder="Ví dụ: Quận Cầu Giấy"
                    error={errors.district?.message}
                    className="py-3 px-4 text-xs rounded-xl"
                    {...register('district', { required: 'Vui lòng nhập Quận/Huyện' })}
                  />
                </div>

                <Input
                  label="Địa chỉ chi tiết (Số nhà, tên đường, ngõ hẻm...) (*)"
                  placeholder="Ví dụ: Số 12 Ngõ 34 Trần Thái Tông"
                  error={errors.addressDetail?.message}
                  className="py-3 px-4 text-xs rounded-xl"
                  {...register('addressDetail', { required: 'Vui lòng nhập địa chỉ chi tiết' })}
                />

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700">Ghi chú giao hàng & lắp đặt</label>
                  <textarea
                    placeholder="Ví dụ: Giao hàng vào giờ hành chính, lắp đặt cẩn thận..."
                    rows={3}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600 placeholder:text-slate-400 hover:border-slate-350"
                    {...register('note')}
                  />
                </div>

                <Button
                  variant="primary"
                  type="submit"
                  className="w-full sm:w-auto py-3.5 px-8 rounded-xl font-bold self-end mt-4 bg-slate-900 hover:bg-slate-800 text-white cursor-pointer transition-all active:scale-98"
                >
                  Tiếp tục: Thanh toán & Vận chuyển
                </Button>
              </form>
            </div>

            {/* Step 1 Right: Summary Card & Visual Trust */}
            <div className="lg:col-span-4 sticky top-28 flex flex-col gap-5">
              <OrderSummary showItems={true} />
              
              {/* Visual Trust Card */}
              <div className="relative overflow-hidden rounded-[2rem] shadow-xs border border-slate-100 h-48 flex items-end p-5">
                <div className="absolute inset-0 z-0">
                  <ImageWithFallback
                    src={visualAssets.checkoutTrust}
                    alt="Kỹ thuật viên Điện Lạnh 247"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#061527] via-[#061527]/75 to-transparent z-10" />
                </div>
                <div className="relative z-20">
                  <span className="text-[9px] font-black text-cyan-400 bg-cyan-950/60 border border-cyan-800/30 px-2 py-0.5 rounded uppercase tracking-wider mb-2 inline-block">
                    Giao lắp 2h
                  </span>
                  <h4 className="text-xs font-black text-white">Giao lắp chuẩn kỹ thuật trong 2h</h4>
                  <p className="text-[10px] text-slate-300 mt-1 leading-relaxed">
                    Kỹ thuật viên Điện Lạnh 247 sẽ liên hệ xác nhận trước khi giao hàng & thi công.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Step 2 Left: Delivery & Payment Methods selection */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              {/* Delivery details display */}
              <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-2xs flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3.5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <h2 className="text-sm font-black text-slate-900">
                      Địa chỉ nhận hàng
                    </h2>
                  </div>
                  <button
                    onClick={() => setStep(1)}
                    className="text-2xs font-extrabold text-primary-600 hover:text-primary-800 transition-colors cursor-pointer"
                  >
                    Thay đổi
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2.5 text-xs text-slate-650">
                  <p className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400" />
                    Họ tên: <strong className="text-slate-800 ml-1">{getValues('customerName')}</strong>
                  </p>
                  <p className="flex items-center gap-2">
                    <PhoneCall className="w-4 h-4 text-slate-400" />
                    Điện thoại: <strong className="text-slate-800 ml-1">{getValues('phone')}</strong>
                  </p>
                  <p className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400" />
                    Email: <strong className="text-slate-800 ml-1">{getValues('email') || '(Không có)'}</strong>
                  </p>
                  <p className="flex items-start gap-2 md:col-span-2">
                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                    <span>Địa chỉ: <strong className="text-slate-800 ml-1">{getValues('addressDetail')}, {getValues('district')}, {getValues('city')}</strong></span>
                  </p>
                  {getValues('note') && (
                    <p className="md:col-span-2 text-3xs text-slate-500 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-1">
                      * Ghi chú: "{getValues('note')}"
                    </p>
                  )}
                </div>
              </div>

              {/* Delivery Method Selection */}
              <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-2xs flex flex-col gap-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Truck className="w-4 h-4" />
                  </div>
                  <h2 className="text-sm font-black text-slate-900">
                    Phương thức vận chuyển & Lắp đặt
                  </h2>
                </div>
                
                <div className="p-4 rounded-2xl border-2 border-primary-500 bg-primary-50/10 flex gap-4 items-center">
                  <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div className="flex-grow">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-black text-slate-900">Giao lắp tiêu chuẩn siêu tốc</h4>
                      <span className="text-xs font-black text-slate-800">
                        {shipping === 0 ? 'Miễn phí' : `${new Intl.NumberFormat('vi-VN').format(shipping)}đ`}
                      </span>
                    </div>
                    <p className="text-3xs text-slate-500 mt-1 leading-relaxed">
                      Điện Lạnh 247 cử kỹ thuật viên chuyên nghiệp vận chuyển và hoàn thiện lắp đặt trong vòng 2 - 24 giờ.
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-2xs flex flex-col gap-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <h2 className="text-sm font-black text-slate-900">
                    Phương thức thanh toán
                  </h2>
                </div>
                
                <div className="flex flex-col gap-3.5">
                  {/* COD - Enabled */}
                  <label className="p-4 rounded-2xl border-2 border-[#06b6d4] bg-cyan-50/5 flex gap-4 items-center cursor-pointer select-none transition-all hover:bg-cyan-50/10">
                    <input type="radio" defaultChecked name="payment" className="w-4 h-4 text-cyan-600 focus:ring-cyan-500" />
                    <div className="flex-grow">
                      <h4 className="text-xs font-black text-slate-900">Thanh toán khi nhận hàng (COD)</h4>
                      <p className="text-3xs text-slate-500 mt-1 leading-relaxed">
                        Thanh toán bằng tiền mặt hoặc chuyển khoản ngân hàng trực tiếp cho nhân viên kỹ thuật sau khi nghiệm thu thiết bị hoạt động tốt.
                      </p>
                    </div>
                  </label>

                  {/* VNPay - Disabled */}
                  <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 opacity-60 flex gap-4 items-center select-none cursor-not-allowed">
                    <input type="radio" disabled name="payment" className="w-4 h-4" />
                    <div className="flex-grow">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-black text-slate-500">Thanh toán qua cổng VNPAY (QR Pay / Thẻ ATM)</h4>
                        <Badge variant="neutral" className="text-4xs px-1.5 py-0.5 bg-slate-200 text-slate-500">Sắp ra mắt</Badge>
                      </div>
                      <p className="text-3xs text-slate-400 mt-1">
                        Thanh toán bằng ứng dụng ngân hàng QR Pay hoặc thẻ thanh toán quốc tế Visa/Mastercard.
                      </p>
                    </div>
                  </div>

                  {/* MoMo - Disabled */}
                  <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 opacity-60 flex gap-4 items-center select-none cursor-not-allowed">
                    <input type="radio" disabled name="payment" className="w-4 h-4" />
                    <div className="flex-grow">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-black text-slate-500">Thanh toán qua Ví điện tử MoMo</h4>
                        <Badge variant="neutral" className="text-4xs px-1.5 py-0.5 bg-slate-200 text-slate-500">Sắp ra mắt</Badge>
                      </div>
                      <p className="text-3xs text-slate-400 mt-1">
                        Thanh toán chuyển tiền ví MoMo quét mã QR siêu tiện ích bảo mật.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Back & Submit buttons */}
              <div className="flex justify-between items-center mt-2.5">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="rounded-xl py-3 text-xs font-black cursor-pointer"
                >
                  Quay lại bước 1
                </Button>
                <Button
                  variant="primary"
                  onClick={handlePlaceOrder}
                  isLoading={isSubmitting}
                  className="py-3.5 px-8 rounded-xl font-black bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white border-0 shadow-lg shadow-orange-500/20 cursor-pointer text-xs uppercase tracking-wider transition-all active:scale-98"
                >
                  Đặt hàng COD ngay
                </Button>
              </div>
            </div>

            {/* Step 2 Right: Summary Card & Visual Trust */}
            <div className="lg:col-span-4 sticky top-28 flex flex-col gap-5">
              <OrderSummary showItems={true} />
              
              {/* Visual Trust Card */}
              <div className="relative overflow-hidden rounded-[2rem] shadow-xs border border-slate-100 h-48 flex items-end p-5">
                <div className="absolute inset-0 z-0">
                  <ImageWithFallback
                    src={visualAssets.checkoutTrust}
                    alt="Kỹ thuật viên Điện Lạnh 247"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#061527] via-[#061527]/75 to-transparent z-10" />
                </div>
                <div className="relative z-20">
                  <span className="text-[9px] font-black text-cyan-400 bg-cyan-950/60 border border-cyan-800/30 px-2 py-0.5 rounded uppercase tracking-wider mb-2 inline-block">
                    Giao lắp 2h
                  </span>
                  <h4 className="text-xs font-black text-white">Giao lắp chuẩn kỹ thuật trong 2h</h4>
                  <p className="text-[10px] text-slate-300 mt-1 leading-relaxed">
                    Kỹ thuật viên Điện Lạnh 247 sẽ liên hệ xác nhận trước khi giao hàng & thi công.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Order Success Screen */}
        {step === 3 && createdOrder && (
          <div className="max-w-3xl mx-auto flex flex-col gap-6">
            {/* Hero card in Deep Navy & Ice Cyan */}
            <div className="relative overflow-hidden bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-xl p-8 md:p-12 text-center flex flex-col items-center gap-5">
              {/* Glow backdrop effects */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl z-0" />
              <div className="absolute right-0 bottom-0 w-60 h-60 bg-blue-600/5 rounded-full blur-3xl z-0" />

              <div className="absolute right-0 top-0 bottom-0 w-1/3 hidden md:block z-0">
                <ImageWithFallback
                  src={visualAssets.orderSuccess}
                  alt="Lắp đặt thành công"
                  className="w-full h-full object-cover opacity-15"
                />
              </div>

              {/* Glowing Icon wrapper */}
              <div className="relative w-20 h-20 bg-cyan-950/60 border border-cyan-800/30 rounded-full flex items-center justify-center text-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.15)] z-10 animate-pulse">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              
              <div className="relative z-10">
                <h2 className="text-xl md:text-2xl font-black text-white leading-tight">
                  Đặt hàng thành công!
                </h2>
                <p className="text-2xs md:text-xs text-slate-300 mt-2.5 max-w-md mx-auto leading-relaxed">
                  Cảm ơn quý khách đã tin chọn Điện Lạnh 247. Nhân viên chăm sóc khách hàng sẽ liên hệ xác nhận trong thời gian sớm nhất.
                </p>
              </div>

              {/* Detailed Progress Timeline (4 Steps) */}
              <div className="relative z-10 w-full max-w-lg mt-4 px-4">
                <div className="relative flex items-center justify-between w-full">
                  {/* Timeline progress line */}
                  <div className="absolute top-3.5 left-6 right-6 h-0.5 bg-slate-800 z-0">
                    <div className="h-full w-1/4 bg-cyan-400 rounded-full" />
                  </div>

                  {/* Step 1 */}
                  <div className="flex flex-col items-center z-10">
                    <div className="w-7 h-7 rounded-full bg-cyan-400 text-[#061527] flex items-center justify-center text-xs font-extrabold shadow-sm shadow-cyan-400/20">
                      1
                    </div>
                    <span className="text-[9px] font-extrabold text-cyan-400 uppercase tracking-wider mt-1.5">Chờ xác nhận</span>
                  </div>

                  {/* Step 2 */}
                  <div className="flex flex-col items-center z-10">
                    <div className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 border border-slate-700 flex items-center justify-center text-xs font-semibold">
                      2
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1.5">Đã xác nhận</span>
                  </div>

                  {/* Step 3 */}
                  <div className="flex flex-col items-center z-10">
                    <div className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 border border-slate-700 flex items-center justify-center text-xs font-semibold">
                      3
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1.5">Đang giao/lắp</span>
                  </div>

                  {/* Step 4 */}
                  <div className="flex flex-col items-center z-10">
                    <div className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 border border-slate-700 flex items-center justify-center text-xs font-semibold">
                      4
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1.5">Hoàn tất</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Order info details box */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Summary info card */}
              <div className="md:col-span-7 bg-white border border-slate-100 rounded-[2rem] p-6 shadow-2xs flex flex-col gap-4">
                <h3 className="text-xs font-black text-slate-900 border-b border-slate-100 pb-3">
                  Thông tin đơn hàng
                </h3>
                
                <div className="flex flex-col gap-3 text-xs">
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-slate-500">Mã đơn hàng:</span>
                    <strong className="text-primary-600 font-black tracking-wide">{createdOrder.id}</strong>
                  </div>
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-slate-500">Khách hàng nhận:</span>
                    <strong className="text-slate-800">{createdOrder.customerName}</strong>
                  </div>
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-slate-500">Số điện thoại:</span>
                    <strong className="text-slate-800">{createdOrder.phone}</strong>
                  </div>
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-slate-500">Thanh toán:</span>
                    <strong className="text-slate-800 uppercase">{createdOrder.paymentMethod} (Thanh toán COD)</strong>
                  </div>
                  <div className="flex justify-between items-center pt-3.5 border-t border-slate-100 font-bold text-slate-900">
                    <span>Tổng tiền thanh toán:</span>
                    <span className="text-primary-600 font-black text-sm md:text-base">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(createdOrder.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Call support card */}
              <div className="md:col-span-5 flex flex-col gap-4">
                <div className="bg-amber-50 border border-amber-200 rounded-[2rem] p-6 text-xs text-amber-900 leading-relaxed flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-amber-800 font-black">
                    <PhoneCall className="w-5 h-5 text-amber-500 flex-shrink-0 animate-bounce" />
                    <span>Hỗ trợ giao lắp 2h</span>
                  </div>
                  <p>
                    Kỹ thuật viên Điện Lạnh 247 sẽ chủ động gọi đến số điện thoại <strong className="text-amber-900">{createdOrder.phone}</strong> của quý khách để xác nhận địa chỉ, tư vấn đường ống đồng và chốt lịch thi công chuẩn xác nhất.
                  </p>
                  <div className="border-t border-amber-200 pt-3 flex flex-col gap-1 text-[11px] font-semibold">
                    <p>Hotline CSKH: <strong className="text-amber-900 font-bold">{safeSettings.hotline}</strong></p>
                    <p>Zalo OA: <strong className="text-amber-900 font-bold">{safeSettings.zalo}</strong></p>
                  </div>
                </div>

                {/* Return actions */}
                <div className="flex gap-3.5 mt-2">
                  <Link to="/products" className="flex-1">
                    <Button
                      variant="outline"
                      className="w-full rounded-xl py-3 text-3xs font-extrabold uppercase tracking-wider cursor-pointer transition-all active:scale-98"
                    >
                      Tiếp tục mua sắm
                    </Button>
                  </Link>
                  <Link to="/orders" className="flex-1">
                    <Button
                      variant="primary"
                      className="w-full rounded-xl py-3 text-3xs font-extrabold uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-white cursor-pointer transition-all active:scale-98 border-0 shadow-md shadow-slate-900/10"
                    >
                      Đơn hàng của tôi
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
