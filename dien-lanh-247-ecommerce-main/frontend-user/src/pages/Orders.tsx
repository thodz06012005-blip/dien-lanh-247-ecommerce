import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { ClipboardList, AlertCircle, ArrowLeft, PhoneCall, CheckCircle2, MapPin, User, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import type { Order } from '../mock/data';
import Breadcrumb from '../components/common/Breadcrumb';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Skeleton from '../components/ui/Skeleton';
import ImageWithFallback from '../components/common/ImageWithFallback';
import { visualAssets } from '../constants/visualAssets';
import PageTransition from '../components/common/PageTransition';
import { useSettings } from '../hooks/useSettings';

export default function Orders({ isEmbed = false }: { isEmbed?: boolean }) {
  const { settings } = useSettings();
  const { user } = useAuthStore();
  const { showSuccess, showError } = useToastStore();
  const navigate = useNavigate();

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [cancelModalOrderId, setCancelModalOrderId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [phoneLookup, setPhoneLookup] = useState<string>('');
  const [activePhone, setActivePhone] = useState<string>('');

  const currentPhone = user?.phone || activePhone;

  // Load user orders list
  const { data: ordersData, isLoading, error, refetch } = useQuery({
    queryKey: ['orders', currentPhone],
    queryFn: async () => {
      if (!currentPhone) {
        return { success: true, data: [] };
      }
      const res = await api.get('/orders', { params: { phone: currentPhone } });
      return res.data;
    },
    enabled: !!currentPhone,
  });

  const orders = (ordersData?.data as Order[] || []);
  
  // Find current selected order object from loaded orders list (strictly Order | null to narrow type check)
  const selectedOrder: Order | null = selectedOrderId ? (orders.find(o => o.id === selectedOrderId) || null) : null;

  const handleOpenCancelModal = (e: React.MouseEvent, orderId: string) => {
    e.stopPropagation();
    setCancelModalOrderId(orderId);
  };

  const handleConfirmCancel = async () => {
    if (!cancelModalOrderId) return;
    setIsCancelling(true);
    try {
      const res = await api.patch(`/orders/${cancelModalOrderId}/cancel`, null, {
        params: { phone: currentPhone },
      });
      if (res.data?.success) {
        showSuccess(`Hủy đơn hàng ${cancelModalOrderId} thành công!`);
        setCancelModalOrderId(null);
        refetch(); // Reload orders list
      } else {
        showError(res.data?.message || 'Không thể hủy đơn hàng.');
      }
    } catch (err: any) {
      showError(err.response?.data?.message || 'Có lỗi xảy ra khi hủy đơn hàng.');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToList = () => {
    setSelectedOrderId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearLookup = () => {
    setActivePhone('');
    setPhoneLookup('');
  };

  if (!currentPhone) {
    return (
      <PageTransition>
        <div className="max-w-md mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[50vh]">
          <div className="w-20 h-20 bg-blue-50/85 text-blue-600 rounded-[2rem] flex items-center justify-center mb-6 shadow-sm border border-blue-100">
            <ClipboardList className="w-9 h-9" />
          </div>
          
          <h2 className="text-xl font-bold text-slate-800 text-center">Tra cứu đơn hàng</h2>
          <p className="text-xs text-slate-500 mt-2 text-center max-w-sm leading-relaxed mb-6">
            Vui lòng đăng nhập tài khoản thành viên hoặc nhập số điện thoại đặt hàng để tra cứu lịch sử mua hàng.
          </p>

          <div className="w-full flex flex-col gap-4">
            <form onSubmit={(e) => {
              e.preventDefault();
              if (phoneLookup.trim()) {
                setActivePhone(phoneLookup.trim());
              } else {
                showError('Vui lòng nhập số điện thoại');
              }
            }} className="flex flex-col gap-3 p-5 bg-white border border-slate-100 rounded-2xl shadow-xs">
              <label className="text-3xs font-extrabold uppercase text-slate-400 tracking-wider">
                Tra cứu qua Số điện thoại
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nhập số điện thoại..."
                  value={phoneLookup}
                  onChange={(e) => setPhoneLookup(e.target.value)}
                  className="flex-1 px-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <Button type="submit" variant="primary" className="rounded-xl text-3xs font-extrabold uppercase py-2 px-4">
                  Tra cứu
                </Button>
              </div>
            </form>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-100"></div>
              <span className="flex-shrink mx-4 text-slate-400 text-3xs uppercase font-extrabold tracking-wider">Hoặc</span>
              <div className="flex-grow border-t border-slate-100"></div>
            </div>

            <Button
              variant="outline"
              className="w-full rounded-xl text-xs py-3 px-6 font-bold"
              onClick={() => navigate('/login')}
            >
              Đăng nhập tài khoản thành viên
            </Button>
          </div>
        </div>
      </PageTransition>
    );
  }

  const statusConfigs = {
    pending: { label: 'Chờ xác nhận', colorClass: 'bg-amber-50 text-amber-700 border-amber-200' },
    confirmed: { label: 'Đã xác nhận', colorClass: 'bg-blue-50 text-blue-700 border-blue-200' },
    processing: { label: 'Đang lắp đặt/xử lý', colorClass: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
    shipping: { label: 'Đang giao hàng', colorClass: 'bg-purple-50 text-purple-700 border-purple-200' },
    delivered: { label: 'Đã hoàn tất', colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    completed: { label: 'Đã hoàn tất', colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    cancelled: { label: 'Đã hủy', colorClass: 'bg-slate-100 text-slate-500 border-slate-200' },
  };

  const hotlineNumber = settings?.hotline || '1900 247';
  const zaloContact = settings?.zalo || '0900 000 247';

  const mainContent = (
    <div className={isEmbed ? "w-full" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"}>
      
      {/* Render Order History List */}
      {selectedOrder === null ? (
        <div>
          {/* Breadcrumbs */}
          {!isEmbed && <Breadcrumb items={[{ name: 'Đơn hàng của tôi' }]} />}

          {/* Premium Hero Banner */}
          {!isEmbed && (
            <div className="relative mb-10 overflow-hidden bg-slate-900 rounded-[2rem] shadow-xl border border-slate-800 p-6 md:p-10 flex flex-col justify-center min-h-[160px] md:min-h-[200px]">
              {/* Background gradient & image overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#061527] via-[#061527]/95 to-transparent z-10" />
              <div className="absolute right-0 top-0 bottom-0 w-1/2 hidden md:block z-0">
                <ImageWithFallback
                  src={visualAssets.orderHistoryHero}
                  alt="Order History Banner"
                  className="w-full h-full object-cover opacity-20"
                />
              </div>

              <div className="relative z-20 max-w-xl">
                <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest bg-cyan-950/60 border border-cyan-800/30 px-3 py-1 rounded-full inline-block mb-3">
                  Quản lý giao dịch
                </span>
                <h1 className="text-2xl md:text-3xl font-black text-white">
                  Đơn hàng của tôi
                </h1>
                <p className="text-2xs md:text-xs text-slate-300 mt-2 max-w-md leading-relaxed">
                  Theo dõi hành trình kỹ thuật giao lắp, bảo hành chính hãng và thông số thi công công trình.
                </p>
              </div>
            </div>
          )}

            {activePhone && (
              <div className="mb-8 p-5 bg-blue-50/50 border border-blue-100 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-3xs">
                <div className="flex items-center gap-2.5 text-xs text-slate-700">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                  <span className="font-bold">Đang hiển thị đơn hàng cho số điện thoại:</span>
                  <span className="bg-blue-100/80 text-blue-800 font-extrabold px-2.5 py-1 rounded-xl tracking-wide">{activePhone}</span>
                </div>
                <button 
                  onClick={handleClearLookup} 
                  className="text-3xs font-extrabold uppercase text-slate-500 hover:text-slate-800 border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2 rounded-xl transition-all cursor-pointer shadow-3xs w-fit"
                >
                  Thay đổi số điện thoại
                </button>
              </div>
            )}

            {isLoading ? (
              <div className="flex flex-col gap-4">
                <Skeleton className="h-24 w-full rounded-[2rem]" />
                <Skeleton className="h-24 w-full rounded-[2rem]" />
                <Skeleton className="h-24 w-full rounded-[2rem]" />
              </div>
            ) : error ? (
              <div className="text-center py-10 bg-white rounded-[2rem] border border-slate-100 p-6 shadow-2xs max-w-md mx-auto">
                <p className="text-red-500 font-bold text-xs">Có lỗi xảy ra khi tải dữ liệu đơn hàng.</p>
                <Button variant="outline" className="mt-4 rounded-xl text-3xs font-black uppercase" onClick={() => refetch()}>Thử lại</Button>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-[2.5rem] border border-slate-100 p-8 flex flex-col items-center max-w-xl mx-auto shadow-2xs">
                <div className="w-32 h-32 rounded-[2rem] overflow-hidden mb-6">
                  <ImageWithFallback
                    src={visualAssets.applianceSet}
                    alt="No orders"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Chưa có đơn hàng nào</h3>
                <p className="text-3xs text-slate-500 mt-2 max-w-xs leading-relaxed">
                  Lịch sử mua sắm của bạn trống. Hãy chọn sản phẩm điện lạnh phù hợp và đặt mua hàng COD ngay nhé!
                </p>
                <Button variant="primary" className="mt-6 rounded-xl text-3xs py-2.5 px-6 font-bold uppercase tracking-wider" onClick={() => navigate('/products')}>
                  Mua sắm ngay
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {orders.map((order) => {
                  const statusCfg = statusConfigs[order.status] || { label: order.status, colorClass: 'bg-slate-100 text-slate-500' };
                  const itemQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
                  const firstItem = order.items[0];

                  return (
                    <div
                      key={order.id}
                      onClick={() => handleSelectOrder(order.id)}
                      className="bg-white rounded-[2rem] border border-slate-100 hover:border-blue-100 shadow-2xs hover:shadow-xs transition-all overflow-hidden cursor-pointer p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5"
                    >
                      {/* Left: Thumbnail & Details */}
                      <div className="flex items-center gap-4 flex-grow min-w-0">
                        {firstItem && (
                          <div className="w-16 h-16 rounded-2xl overflow-hidden border border-slate-100 bg-white flex-shrink-0">
                            <ImageWithFallback
                              src={firstItem.imageUrl || visualAssets.fallback}
                              alt={firstItem.name}
                              className="w-full h-full object-contain p-1"
                            />
                          </div>
                        )}
                        <div className="min-w-0 flex-grow">
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mb-1">
                            <span className="text-xs font-black text-slate-900">{order.id}</span>
                            <span className="text-slate-300 hidden sm:inline">•</span>
                            <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {order.createdAt}
                            </span>
                            <span className="text-slate-300 hidden sm:inline">•</span>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${statusCfg.colorClass}`}>
                              {statusCfg.label}
                            </span>
                          </div>
                          <p className="text-3xs text-slate-500 line-clamp-1">
                            {firstItem ? firstItem.name : 'Chi tiết đơn hàng'} 
                            {order.items.length > 1 && ` và ${order.items.length - 1} sản phẩm khác`}
                          </p>
                          <span className="text-3xs text-slate-400 font-bold block mt-1">Số lượng thiết bị: {itemQuantity}</span>
                        </div>
                      </div>

                      {/* Right: Price & Action */}
                      <div className="flex items-center justify-between md:justify-end gap-5 w-full md:w-auto border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
                        <div className="text-left md:text-right">
                          <span className="text-4xs text-slate-400 block font-bold uppercase tracking-wider">Tổng thanh toán</span>
                          <strong className="text-sm font-black text-primary-600">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount)}
                          </strong>
                        </div>

                        <div className="flex items-center gap-2">
                          {order.status === 'pending' && (
                            <button
                              onClick={(e) => handleOpenCancelModal(e, order.id)}
                              className="px-3.5 py-2 text-3xs font-extrabold text-red-500 hover:bg-red-50 border border-transparent rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              Hủy đơn
                            </button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl font-bold py-2 text-3xs cursor-pointer"
                          >
                            Xem chi tiết
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Render Order Detail View */
          <div>
            {/* Breadcrumbs for detail */}
            {!isEmbed && (
              <Breadcrumb
                items={[
                  { name: 'Đơn hàng của tôi', path: '/orders', onClick: handleBackToList },
                  { name: `Đơn hàng ${selectedOrder.id}` },
                ]}
              />
            )}

            {/* Back to list button */}
            <button
              onClick={handleBackToList}
              className="inline-flex items-center gap-2 text-xs font-black text-slate-500 hover:text-primary-600 transition-colors mb-6 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại danh sách đơn hàng
            </button>

            {/* Detail Header Info */}
            <div className="bg-slate-900 text-white rounded-[2rem] border border-slate-800 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden mb-6">
              {/* glow overlay */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-400/5 rounded-full blur-3xl z-0" />
              
              <div className="relative z-10">
                <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest bg-cyan-950/60 border border-cyan-800/30 px-3 py-1 rounded-full inline-block mb-3">
                  THÔNG TIN CHI TIẾT
                </span>
                <h1 className="text-xl md:text-2xl font-black flex items-center gap-2.5">
                  Đơn hàng: <span className="text-cyan-400">{selectedOrder.id}</span>
                </h1>
                <p className="text-3xs text-slate-400 font-semibold mt-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  Đặt ngày: {selectedOrder.createdAt}
                </p>
              </div>

              <div className="flex items-center gap-3 relative z-10">
                <span className={`text-[10px] font-extrabold px-3.5 py-1.5 rounded-full border uppercase tracking-wider ${statusConfigs[selectedOrder.status]?.colorClass || 'bg-slate-800 text-slate-400'}`}>
                  {statusConfigs[selectedOrder.status]?.label || selectedOrder.status}
                </span>
                {selectedOrder.status === 'pending' && (
                  <button
                    onClick={(e) => handleOpenCancelModal(e, selectedOrder.id)}
                    className="px-4 py-2 text-2xs font-extrabold bg-red-600/10 border border-red-200 text-red-600 hover:bg-red-600/20 rounded-full transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    Hủy đơn hàng
                  </button>
                )}
              </div>
            </div>

            {/* Timeline Progress */}
            <div className="bg-white rounded-[2rem] border border-slate-100 p-6 md:p-8 shadow-2xs mb-8 flex flex-col gap-5">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2">Trạng thái giao lắp</h3>
              
              {selectedOrder.status === 'cancelled' ? (
                <div className="p-4 bg-red-50 text-red-800 border border-red-100 rounded-2xl flex items-center gap-3 text-xs leading-normal">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <div>
                    <strong>Đơn hàng đã hủy:</strong> Đơn hàng này đã bị hủy trên hệ thống. Mọi thắc mắc vui lòng liên hệ hotline để được giải đáp.
                  </div>
                </div>
              ) : (
                <div>
                  {/* Desktop Timeline (Horizontal) */}
                  <div className="hidden md:flex relative items-center justify-between w-full max-w-3xl mx-auto py-5">
                    {/* Progress Bar */}
                    {(() => {
                      const currentStatus = (selectedOrder.status === 'completed' ? 'delivered' : selectedOrder.status) as string;
                      
                      return (
                        <div className="absolute top-[37px] left-6 right-6 h-0.5 bg-slate-100 z-0">
                          <div 
                            className="h-full bg-cyan-500 rounded-full transition-all duration-500" 
                            style={{
                              width: 
                                currentStatus === 'pending' ? '0%' :
                                currentStatus === 'confirmed' ? '25%' :
                                currentStatus === 'processing' ? '50%' :
                                currentStatus === 'shipping' ? '75%' :
                                currentStatus === 'delivered' ? '100%' : '0%'
                            }}
                          />
                        </div>
                      );
                    })()}

                    {/* Nodes */}
                    {(() => {
                      const statusOrder = ['pending', 'confirmed', 'processing', 'shipping', 'delivered'];
                      const currentStatus = (selectedOrder.status === 'completed' ? 'delivered' : selectedOrder.status) as string;
                      const currentIdx = statusOrder.indexOf(currentStatus);

                      return [
                        { label: 'Chờ xác nhận', statusKey: 'pending', date: selectedOrder.createdAt },
                        { label: 'Đã xác nhận', statusKey: 'confirmed', date: currentIdx >= 1 ? 'Hôm nay' : '' },
                        { label: 'Đang lắp đặt', statusKey: 'processing', date: '' },
                        { label: 'Đang giao hàng', statusKey: 'shipping', date: '' },
                        { label: 'Hoàn tất', statusKey: 'delivered', date: currentStatus === 'delivered' ? 'Đã giao' : '' }
                      ].map((step, idx) => {
                        const isCompleted = currentIdx > idx || (currentStatus === 'delivered' && idx === 4);
                        const isActive = currentIdx === idx && currentStatus !== 'delivered';
                        
                        return (
                          <div key={idx} className="flex flex-col items-center z-10 flex-1 relative">
                            <div 
                              className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 ${
                                isCompleted 
                                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/10'
                                  : isActive
                                  ? 'bg-cyan-500 text-white ring-4 ring-cyan-100 shadow-md shadow-cyan-500/20'
                                  : 'bg-slate-50 text-slate-400 border border-slate-200'
                              }`}
                            >
                              {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-wider mt-3 whitespace-nowrap ${isActive ? 'text-cyan-600' : isCompleted ? 'text-emerald-600' : 'text-slate-400'}`}>
                              {step.label}
                            </span>
                            {step.date && (
                              <span className="text-[9px] text-slate-400 font-medium mt-0.5 absolute -bottom-4">{step.date}</span>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>

                  {/* Mobile Timeline (Vertical) */}
                  <div className="flex md:hidden flex-col gap-5 pl-4 relative before:absolute before:left-6 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                    {(() => {
                      const statusOrder = ['pending', 'confirmed', 'processing', 'shipping', 'delivered'];
                      const currentStatus = (selectedOrder.status === 'completed' ? 'delivered' : selectedOrder.status) as string;
                      const currentIdx = statusOrder.indexOf(currentStatus);

                      return [
                        { label: 'Chờ xác nhận', statusKey: 'pending', desc: 'Đơn hàng mới tạo, đang chờ Điện Lạnh 247 gọi điện chốt lịch.' },
                        { label: 'Đã xác nhận', statusKey: 'confirmed', desc: 'Đã gọi xác nhận thành công và bàn giao linh kiện kỹ thuật.' },
                        { label: 'Đang xử lý / lắp đặt', statusKey: 'processing', desc: 'Kỹ thuật viên đang thiết kế sơ đồ đường ống và định vị máy.' },
                        { label: 'Đang vận chuyển', statusKey: 'shipping', desc: 'Thiết bị đang được kỹ thuật chuyển tới địa chỉ lắp ráp.' },
                        { label: 'Hoàn tất nghiệm thu', statusKey: 'delivered', desc: 'Đã hoàn thành lắp ráp chạy thử nghiệm thu máy và bàn giao.' }
                      ].map((step, idx) => {
                        const isCompleted = currentIdx > idx || (currentStatus === 'delivered' && idx === 4);
                        const isActive = currentIdx === idx && currentStatus !== 'delivered';

                        return (
                          <div key={idx} className="flex gap-4 items-start relative z-10">
                            <div className={`w-5.5 h-5.5 rounded-full flex items-center justify-center text-3xs font-extrabold flex-shrink-0 transition-all ${
                              isCompleted 
                                ? 'bg-emerald-500 text-white shadow'
                                : isActive
                                ? 'bg-cyan-500 text-white ring-2 ring-cyan-100 shadow'
                                : 'bg-slate-100 text-slate-400 border border-slate-200'
                            }`}>
                              {isCompleted ? '✓' : idx + 1}
                            </div>
                            <div>
                              <h4 className={`text-xs font-black ${isActive ? 'text-cyan-600' : isCompleted ? 'text-emerald-600' : 'text-slate-800'}`}>
                                {step.label}
                              </h4>
                              <p className="text-[10px] text-slate-500 mt-0.5 leading-normal max-w-xs">{step.desc}</p>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}
            </div>

            {/* Layout 2 Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Full List of Products */}
              <div className="lg:col-span-8 bg-white border border-slate-100 rounded-[2rem] p-6 shadow-2xs flex flex-col gap-5">
                <h3 className="text-xs font-black text-slate-800 border-b border-slate-100 pb-3 uppercase tracking-wider">
                  Mặt hàng đã chọn
                </h3>

                <div className="flex flex-col gap-4">
                  {selectedOrder.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex gap-4 items-center p-3.5 rounded-2xl border border-slate-50 hover:bg-slate-50/20 transition-all"
                    >
                      <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-100 bg-white flex-shrink-0">
                        <ImageWithFallback
                          src={item.imageUrl || visualAssets.fallback}
                          alt={item.name}
                          className="w-full h-full object-contain p-1"
                        />
                      </div>
                      
                      <div className="flex-grow min-w-0">
                        <h4 className="text-xs font-black text-slate-900 line-clamp-2 leading-relaxed">
                          {item.name}
                        </h4>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-3xs text-slate-400 mt-1 font-semibold">
                          <span>SKU: {item.sku}</span>
                          <span>|</span>
                          <span>Số lượng: {item.quantity}</span>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <span className="text-[10px] text-slate-400 block">
                          Đơn giá: {new Intl.NumberFormat('vi-VN').format(item.price)}đ
                        </span>
                        <strong className="text-xs font-black text-slate-800">
                          {new Intl.NumberFormat('vi-VN').format(item.price * item.quantity)}đ
                        </strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Order Summary Info & Help Card */}
              <div className="lg:col-span-4 flex flex-col gap-6">
                
                {/* Cost breakdown */}
                <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-2xs flex flex-col gap-4.5">
                  <h3 className="text-xs font-black text-slate-800 border-b border-slate-100 pb-3 uppercase tracking-wider">Chi phí thanh toán</h3>
                  
                  <div className="flex flex-col gap-3 text-xs text-slate-500">
                    <div className="flex justify-between items-center">
                      <span>Tạm tính hàng hóa:</span>
                      <span className="font-bold text-slate-800">
                        {new Intl.NumberFormat('vi-VN').format(selectedOrder.totalAmount - selectedOrder.shippingFee + selectedOrder.discountAmount)}đ
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-emerald-600">
                      <span>Giảm giá khuyến mãi:</span>
                      <span className="font-black">-{new Intl.NumberFormat('vi-VN').format(selectedOrder.discountAmount)}đ</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Phí vận chuyển & lắp đặt:</span>
                      <span className="font-bold text-slate-800">
                        {selectedOrder.shippingFee === 0 ? 'Miễn phí' : `${new Intl.NumberFormat('vi-VN').format(selectedOrder.shippingFee)}đ`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-t border-slate-100 pt-3.5 text-slate-900 font-bold text-sm">
                      <span>Tổng cộng (COD):</span>
                      <span className="text-primary-600 font-black text-base">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedOrder.totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Delivery and payment detail card */}
                <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-2xs flex flex-col gap-4.5">
                  <h3 className="text-xs font-black text-slate-800 border-b border-slate-100 pb-3 uppercase tracking-wider">Địa chỉ giao lắp</h3>
                  
                  <div className="flex flex-col gap-3 text-xs text-slate-500">
                    <p className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      Người nhận: <strong className="text-slate-800 ml-0.5">{selectedOrder.customerName}</strong>
                    </p>
                    <p className="flex items-center gap-2">
                      <PhoneCall className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      Điện thoại: <strong className="text-slate-800 ml-0.5">{selectedOrder.phone}</strong>
                    </p>
                    <p className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                      <span>Địa chỉ: <strong className="text-slate-800 ml-0.5">{selectedOrder.addressDetail}, {selectedOrder.district}, {selectedOrder.city}</strong></span>
                    </p>
                    {selectedOrder.note && (
                      <p className="text-3xs text-slate-500 italic bg-slate-50/50 p-2.5 rounded-xl border border-slate-100/50">
                        * Ghi chú: "{selectedOrder.note}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Technical support / Hotline & Zalo */}
                <div className="bg-amber-50/50 border border-amber-200/50 rounded-[2rem] p-6 flex flex-col gap-3 text-amber-900 text-xs">
                  <div className="flex items-center gap-2 font-black text-amber-800">
                    <PhoneCall className="w-5 h-5 text-amber-500 flex-shrink-0" />
                    <span>Hỗ trợ kỹ thuật 24/7</span>
                  </div>
                  <p className="leading-relaxed">
                    Nếu quý khách có yêu cầu dịch vụ đột xuất, thay đổi thời gian lắp đặt hoặc tư vấn vật tư, hãy liên hệ:
                  </p>
                  <div className="border-t border-amber-200/60 pt-3 flex flex-col gap-1 font-bold text-[11px]">
                    <p>Hotline: <strong className="text-amber-900">{hotlineNumber}</strong></p>
                    <p>Zalo hỗ trợ: <strong className="text-amber-900">{zaloContact}</strong></p>
                  </div>
                </div>

                {/* Right Column: Visual Trust Card */}
                <div className="relative overflow-hidden rounded-[2rem] shadow-xs border border-slate-100 h-48 flex items-end p-5">
                  <div className="absolute inset-0 z-0">
                    <ImageWithFallback
                      src={visualAssets.orderDetailTrust}
                      alt="Điện Lạnh 247"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#061527] via-[#061527]/75 to-transparent z-10" />
                  </div>
                  <div className="relative z-20">
                    <span className="text-[9px] font-black text-cyan-400 bg-cyan-950/60 border border-cyan-800/30 px-2 py-0.5 rounded uppercase tracking-wider mb-2 inline-block">
                      Dịch vụ lắp đặt
                    </span>
                    <h4 className="text-xs font-black text-white">Bảo hành kép chính hãng và thi công</h4>
                    <p className="text-[10px] text-slate-300 mt-1 leading-relaxed">
                      Điện Lạnh 247 cam kết lắp đặt chuẩn kỹ thuật điện máy ngành HVAC.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal for cancel order */}
        <Modal
          isOpen={cancelModalOrderId !== null}
          onClose={() => setCancelModalOrderId(null)}
          title="Xác nhận hủy đơn hàng"
        >
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-2">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Bạn chắc chắn muốn hủy đơn hàng này?</h4>
              <p className="text-2xs text-slate-500 mt-1 max-w-xs leading-normal">
                Đơn hàng <strong>{cancelModalOrderId}</strong> sẽ bị hủy vĩnh viễn trên hệ thống và không thể phục hồi.
              </p>
            </div>
            
            <div className="flex gap-3.5 w-full mt-4 justify-center">
              <button
                onClick={() => setCancelModalOrderId(null)}
                className="py-2.5 px-5 bg-white border border-slate-200 text-slate-500 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <Button
                variant="danger"
                isLoading={isCancelling}
                onClick={handleConfirmCancel}
                className="py-2.5 px-5 rounded-xl text-xs font-bold cursor-pointer"
              >
                Xác nhận hủy đơn
              </Button>
            </div>
          </div>
        </Modal>
    </div>
  );

  if (isEmbed) {
    return mainContent;
  }

  return (
    <PageTransition>
      {mainContent}
    </PageTransition>
  );
}
