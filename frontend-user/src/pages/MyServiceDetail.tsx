import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Calendar, ArrowLeft, PhoneCall, CheckCircle2, MapPin, User,
  AlertCircle, Clock, Sparkles, ShieldAlert
} from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import type { ServiceRequest, ServiceCategory } from '../types/service';
import Breadcrumb from '../components/common/Breadcrumb';
import PageTransition from '../components/common/PageTransition';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { useSettings } from '../hooks/useSettings';

const statusConfigs: Record<string, { label: string; colorClass: string; variant: 'warning' | 'info' | 'primary' | 'neutral' | 'success' }> = {
  pending: { label: 'Chờ xác nhận', colorClass: 'bg-amber-50 text-amber-700 border-amber-200', variant: 'warning' },
  confirmed: { label: 'Đã xác nhận', colorClass: 'bg-sky-50 text-sky-700 border-sky-200', variant: 'info' },
  assigned: { label: 'Đã phân công', colorClass: 'bg-primary-50 text-primary-700 border-primary-100', variant: 'primary' },
  cancelled: { label: 'Đã hủy', colorClass: 'bg-slate-100 text-slate-500 border-slate-200', variant: 'neutral' },
  completed: { label: 'Hoàn thành', colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200', variant: 'success' },
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

const formatDate = (isoString: string) => {
  try {
    const d = new Date(isoString);
    return d.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return isoString;
  }
};

const formatTimeOnly = (isoString: string) => {
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};

const formatDateOnly = (isoString: string) => {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  } catch {
    return '';
  }
};

export default function MyServiceDetail() {
  const { id } = useParams<{ id: string }>();
  useDocumentTitle(`Chi tiết yêu cầu ${id || ''}`);

  const navigate = useNavigate();
  const { settings } = useSettings();
  const { isAuthenticated, user } = useAuthStore();

  // Fetch service request details
  const { data: requestRes, isLoading: isRequestLoading, error: requestError } = useQuery({
    queryKey: ['service-request', id, user?.phone],
    queryFn: async () => {
      const res = await api.get(`/service-requests/${id}`, {
        params: { phone: user?.phone },
      });
      return res.data;
    },
    enabled: !!id && isAuthenticated && !!user?.phone,
  });

  // Fetch service categories to display names
  const { data: categoriesRes } = useQuery({
    queryKey: ['service-categories'],
    queryFn: async () => {
      const res = await api.get('/service-categories');
      return res.data;
    },
  });

  const request: ServiceRequest | undefined = requestRes?.data;
  const categories: ServiceCategory[] = categoriesRes?.data || [];
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  const isLoading = isRequestLoading;

  if (!isAuthenticated) {
    return (
      <PageTransition>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center flex flex-col items-center justify-center min-h-[50vh]">
          <div className="w-20 h-20 bg-slate-100 rounded-[2rem] flex items-center justify-center mb-6 text-slate-400 mx-auto">
            <ShieldAlert className="w-9 h-9" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Bạn chưa đăng nhập</h2>
          <p className="text-xs text-slate-500 mt-2 max-w-sm leading-relaxed mx-auto">
            Vui lòng đăng nhập để xem chi tiết yêu cầu dịch vụ sửa chữa.
          </p>
          <Button variant="primary" className="mt-6 rounded-xl text-xs py-2.5 px-6 font-bold" onClick={() => navigate('/login')}>
            Đăng nhập ngay
          </Button>
        </div>
      </PageTransition>
    );
  }

  if (isAuthenticated && !user?.phone) {
    return (
      <PageTransition>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center flex flex-col items-center justify-center min-h-[50vh]">
          <div className="w-20 h-20 bg-amber-50 rounded-[2rem] flex items-center justify-center mb-6 text-amber-500 border border-amber-100 mx-auto">
            <ShieldAlert className="w-9 h-9" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Chưa có số điện thoại</h2>
          <p className="text-xs text-slate-500 mt-2 max-w-sm leading-relaxed mx-auto">
            Tài khoản của bạn chưa cập nhật số điện thoại. Vui lòng cập nhật số điện thoại trong mục thông tin tài khoản để tra cứu chi tiết yêu cầu.
          </p>
          <Button variant="primary" className="mt-6 rounded-xl text-xs py-2.5 px-6 font-bold" onClick={() => navigate('/account?tab=profile')}>
            Cập nhật ngay
          </Button>
        </div>
      </PageTransition>
    );
  }

  if (isLoading) {
    return (
      <PageTransition>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Skeleton className="h-6 w-48 mb-6" />
          <Skeleton className="h-32 w-full rounded-[2rem] mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-64 w-full rounded-[2rem] lg:col-span-2" />
            <Skeleton className="h-64 w-full rounded-[2rem]" />
          </div>
        </div>
      </PageTransition>
    );
  }

  if (requestError || !request) {
    return (
      <PageTransition>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <div className="w-20 h-20 bg-red-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-red-500">
            <ShieldAlert className="w-9 h-9" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Không tìm thấy yêu cầu</h2>
          <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
            Yêu cầu dịch vụ sửa chữa này không tồn tại hoặc bạn không có quyền truy cập.
          </p>
          <Button variant="primary" className="mt-6 rounded-xl text-xs py-2.5 px-6 font-bold" onClick={() => navigate('/my-services')}>
            Quay lại lịch sử dịch vụ
          </Button>
        </div>
      </PageTransition>
    );
  }

  const statusCfg = statusConfigs[request.status] || { label: request.status, colorClass: 'bg-slate-100 text-slate-500', variant: 'neutral' as const };

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { name: 'Lịch sử sửa chữa', path: '/my-services' },
            { name: `Yêu cầu ${request.id}` },
          ]}
        />

        {/* Back navigation */}
        <div className="mb-6">
          <Link
            to="/my-services"
            className="inline-flex items-center gap-2 text-2xs font-extrabold text-slate-500 hover:text-primary-600 transition-colors uppercase tracking-wider"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại danh sách</span>
          </Link>
        </div>

        {/* Header detail card */}
        <div className="relative mb-8 overflow-hidden bg-slate-900 rounded-[2rem] shadow-xl border border-slate-800 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="absolute inset-0 bg-gradient-to-r from-[#061527] via-[#061527]/95 to-transparent z-10" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl z-0" />
          
          <div className="relative z-20">
            <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest bg-cyan-950/60 border border-cyan-800/30 px-3 py-1 rounded-full inline-flex items-center gap-1.5 mb-3">
              <Sparkles className="w-3 h-3" />
              Chi tiết yêu cầu
            </span>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl md:text-2xl font-black text-white">
                Mã yêu cầu: {request.id}
              </h1>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${statusCfg.colorClass}`}>
                {statusCfg.label}
              </span>
            </div>
            <p className="text-3xs text-slate-400 mt-2 font-medium">
              Ngày gửi yêu cầu: {formatDate(request.createdAt)}
            </p>
          </div>

          <div className="relative z-20 flex gap-3 self-start md:self-auto">
            <a
              href={`tel:${settings.hotline.replace(/\s+/g, '')}`}
              className="bg-white/10 hover:bg-white/15 border border-white/10 hover:border-white/20 text-white rounded-xl py-2 px-4.5 text-xs font-bold transition-all flex items-center gap-2"
            >
              <PhoneCall className="w-4 h-4 text-cyan-400" />
              <span>Hỗ trợ {settings.hotline}</span>
            </a>
          </div>
        </div>

        {/* Timeline Progress */}
        <div className="bg-white rounded-[2rem] border border-slate-100 p-6 md:p-8 shadow-2xs mb-8 flex flex-col gap-5">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2">Trạng thái xử lý yêu cầu</h3>

          {request.status === 'cancelled' ? (
            <div className="p-4 bg-red-50 text-red-800 border border-red-100 rounded-2xl flex items-center gap-3 text-xs leading-normal">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <div>
                <strong>Yêu cầu dịch vụ đã hủy:</strong> Yêu cầu dịch vụ này đã bị hủy. Mọi thắc mắc hoặc cần đặt lịch lại, vui lòng liên hệ hotline để được hỗ trợ tốt nhất.
              </div>
            </div>
          ) : (
            <div>
              {/* Desktop Timeline (Horizontal) */}
              <div className="hidden md:flex relative items-center justify-between w-full max-w-3xl mx-auto py-5 mb-4">
                {/* Progress Bar */}
                {(() => {
                  const currentStatus = request.status;
                  return (
                    <div className="absolute top-[37px] left-6 right-6 h-0.5 bg-slate-100 z-0">
                      <div
                        className="h-full bg-cyan-500 rounded-full transition-all duration-500"
                        style={{
                          width:
                            currentStatus === 'pending' ? '0%' :
                            currentStatus === 'confirmed' ? '33.33%' :
                            currentStatus === 'assigned' ? '66.66%' :
                            currentStatus === 'completed' ? '100%' : '0%'
                        }}
                      />
                    </div>
                  );
                })()}

                {/* Nodes */}
                {(() => {
                  const statusOrder = ['pending', 'confirmed', 'assigned', 'completed'];
                  const currentStatus = request.status;
                  const currentIdx = statusOrder.indexOf(currentStatus);

                  const getHistoryEntry = (statusKey: string) => {
                    return request.statusHistory?.find((h) => h.status === statusKey);
                  };

                  return [
                    { label: 'Gửi yêu cầu', statusKey: 'pending' },
                    { label: 'Đã xác nhận', statusKey: 'confirmed' },
                    { label: 'Đã phân công', statusKey: 'assigned' },
                    { label: 'Hoàn thành', statusKey: 'completed' }
                  ].map((step, idx) => {
                    const entry = getHistoryEntry(step.statusKey);
                    const isCompleted = currentIdx > idx || (currentStatus === 'completed' && idx === 3) || !!entry;
                    const isActive = currentIdx === idx && currentStatus !== 'completed';

                    const timeStr = entry ? formatTimeOnly(entry.createdAt) : '';
                    const dateStr = entry ? formatDateOnly(entry.createdAt) : '';

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
                        {timeStr && (
                          <div className="text-[9px] text-slate-400 font-medium mt-1 absolute -bottom-6 flex flex-col items-center leading-none">
                            <span>{timeStr}</span>
                            <span className="mt-0.5">{dateStr}</span>
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>

              {/* Mobile Timeline (Vertical) */}
              <div className="flex md:hidden flex-col gap-5 pl-4 relative before:absolute before:left-6 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                {(() => {
                  const statusOrder = ['pending', 'confirmed', 'assigned', 'completed'];
                  const currentStatus = request.status;
                  const currentIdx = statusOrder.indexOf(currentStatus);

                  const getHistoryEntry = (statusKey: string) => {
                    return request.statusHistory?.find((h) => h.status === statusKey);
                  };

                  return [
                    { label: 'Gửi yêu cầu', statusKey: 'pending', defaultDesc: 'Hệ thống đã tiếp nhận thông tin sự cố điện lạnh của khách hàng.' },
                    { label: 'Đã xác nhận', statusKey: 'confirmed', defaultDesc: 'Tổng đài viên đã kiểm tra thông tin và gọi điện chốt lịch hẹn sửa chữa.' },
                    { label: 'Đã phân công', statusKey: 'assigned', defaultDesc: 'Đã chỉ định kỹ thuật viên chuyên trách di chuyển đến địa chỉ sửa chữa.' },
                    { label: 'Hoàn tất dịch vụ', statusKey: 'completed', defaultDesc: 'Kiểm tra chạy thử ổn định, thanh toán và kích hoạt thời gian bảo hành.' }
                  ].map((step, idx) => {
                    const entry = getHistoryEntry(step.statusKey);
                    const isCompleted = currentIdx > idx || (currentStatus === 'completed' && idx === 3) || !!entry;
                    const isActive = currentIdx === idx && currentStatus !== 'completed';

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
                          <div className="flex items-center gap-2">
                            <h4 className={`text-xs font-black ${isActive ? 'text-cyan-600' : isCompleted ? 'text-emerald-600' : 'text-slate-800'}`}>
                              {step.label}
                            </h4>
                            {entry && (
                              <span className="text-[9px] text-slate-400 font-medium">
                                ({formatDate(entry.createdAt)})
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1 leading-normal max-w-xs">
                            {entry ? entry.note : step.defaultDesc}
                          </p>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}
        </div>

        {/* 2 Columns Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Client & Service Details */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Service & Problem details */}
            <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-2xs flex flex-col gap-5">
              <h3 className="text-xs font-black text-slate-800 border-b border-slate-100 pb-3 uppercase tracking-wider">
                Chi tiết sự cố & Lịch hẹn
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-xs">
                <div>
                  <span className="text-slate-400 block mb-1">Dịch vụ:</span>
                  <strong className="text-slate-800 font-bold">
                    {categoryMap.get(request.serviceCategoryId) || request.serviceCategoryId}
                  </strong>
                </div>

                <div>
                  <span className="text-slate-400 block mb-1">Thiết bị cần sửa:</span>
                  <strong className="text-slate-800 font-bold">{request.applianceType || 'Thiết bị điện lạnh'}</strong>
                </div>

                <div>
                  <span className="text-slate-400 block mb-1">Lịch hẹn mong muốn:</span>
                  <strong className="text-slate-800 font-bold flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-primary-600" />
                    {request.preferredDate} | {request.preferredTimeSlot}
                  </strong>
                </div>

                <div>
                  <span className="text-slate-400 block mb-1">Ghi chú từ khách hàng:</span>
                  <p className="text-slate-600 italic bg-slate-50 border border-slate-100 p-2.5 rounded-xl text-3xs leading-relaxed">
                    {request.note || 'Không có ghi chú thêm.'}
                  </p>
                </div>

                <div className="md:col-span-2">
                  <span className="text-slate-400 block mb-1">Mô tả chi tiết sự cố:</span>
                  <p className="text-slate-700 bg-blue-50/20 border border-blue-50/80 p-4 rounded-2xl leading-relaxed text-xs">
                    {request.issueDescription}
                  </p>
                </div>
              </div>
            </div>

            {/* Client address details */}
            <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-2xs flex flex-col gap-5">
              <h3 className="text-xs font-black text-slate-800 border-b border-slate-100 pb-3 uppercase tracking-wider">
                Địa điểm sửa chữa
              </h3>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900">{request.customerName}</h4>
                  <p className="text-3xs text-slate-400 mt-1 font-semibold">SĐT liên hệ: {request.customerPhone}</p>
                  <p className="text-xs text-slate-600 mt-2 font-medium leading-relaxed">
                    {request.customerAddress}, {request.district}, Hà Nội
                  </p>
                </div>
              </div>
            </div>

            {/* Technician assigned */}
            <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-2xs flex flex-col gap-5">
              <h3 className="text-xs font-black text-slate-800 border-b border-slate-100 pb-3 uppercase tracking-wider">
                Kỹ thuật viên phụ trách
              </h3>

              {request.technician ? (
                <div className="flex items-start gap-4">
                  <img
                    src={request.technician.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(request.technician.name)}&background=f1f5f9&color=0f172a`}
                    alt={request.technician.name}
                    className="w-12 h-12 rounded-full object-cover border border-slate-200 shrink-0 bg-slate-50"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(request.technician!.name)}&background=f1f5f9&color=0f172a`;
                    }}
                  />
                  <div className="flex-grow min-w-0">
                    <h4 className="text-xs font-black text-slate-900">{request.technician.name}</h4>
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <a
                        href={`tel:${request.technician.phone.replace(/\s+/g, '')}`}
                        className="text-primary-600 hover:text-primary-700 text-3xs font-bold flex items-center gap-1"
                      >
                        <PhoneCall className="w-3.5 h-3.5 text-primary-500" />
                        <span>{request.technician.phone}</span>
                      </a>
                      <span className="text-slate-300">|</span>
                      <div className="flex items-center gap-0.5">
                        <span className="text-[10px] text-slate-500 font-bold">{Number(request.technician.rating || 5).toFixed(1)}</span>
                        <span className="text-amber-400 font-bold">★</span>
                      </div>
                    </div>
                    {request.technician.skills && request.technician.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2.5">
                        {request.technician.skills.map((skill: string) => (
                          <span key={skill} className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {skill === 'sua-dieu-hoa' ? 'Sửa điều hòa' :
                             skill === 've-sinh-dieu-hoa' ? 'Vệ sinh điều hòa' :
                             skill === 'lap-dat-dieu-hoa' ? 'Lắp đặt điều hòa' :
                             skill === 'sua-tu-lanh' ? 'Sửa tủ lạnh' :
                             skill === 'sua-may-giat' ? 'Sửa máy giặt' :
                             skill === 'bao-tri-dinh-ky' ? 'Bảo trì định kỳ' : skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-700">Chưa phân công kỹ thuật viên</h4>
                    <p className="text-3xs text-slate-400 mt-1">
                      Hệ thống đang lựa chọn thợ di chuyển gần nhà bạn để xử lý nhanh nhất.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Pricing & History Log */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Costs details */}
            <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-2xs flex flex-col gap-4.5">
              <h3 className="text-xs font-black text-slate-800 border-b border-slate-100 pb-3 uppercase tracking-wider">
                Chi phí dịch vụ
              </h3>

              <div className="flex flex-col gap-3 text-xs text-slate-500">
                <div className="flex justify-between items-center">
                  <span>Giá dự kiến (ước lượng):</span>
                  <span className="font-bold text-slate-800">
                    {request.estimatedPrice > 0 ? formatCurrency(request.estimatedPrice) : 'Khảo sát báo giá sau'}
                  </span>
                </div>
                
                {request.finalPrice > 0 && (
                  <div className="flex justify-between items-center text-emerald-600">
                    <span>Chi phí nghiệm thu thực tế:</span>
                    <span className="font-black text-base">{formatCurrency(request.finalPrice)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center border-t border-slate-100 pt-3.5">
                  <span className="font-bold text-slate-700">Thanh toán:</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    request.paymentStatus === 'paid'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {request.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                  </span>
                </div>
              </div>
            </div>

            {/* Status History Log (Real from statusHistory) */}
            <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-2xs flex flex-col gap-4.5">
              <h3 className="text-xs font-black text-slate-800 border-b border-slate-100 pb-3 uppercase tracking-wider">
                Nhật ký hoạt động
              </h3>

              <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto pr-2 relative">
                {request.statusHistory && [...request.statusHistory].reverse().map((entry, idx) => {
                  const entryCfg = statusConfigs[entry.status] || { label: entry.status, colorClass: 'bg-slate-200 text-slate-600', variant: 'neutral' };
                  return (
                    <div key={idx} className="flex gap-3 items-start border-b border-slate-50/50 pb-3 last:border-0 last:pb-0">
                      <div className="w-7 h-7 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 mt-0.5 text-slate-400">
                        <Clock className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-grow">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 bg-white rounded border inline-block ${entryCfg.colorClass}`}>
                            {entryCfg.label}
                          </span>
                          <span className="text-[9px] text-slate-400 font-medium">
                            {formatDate(entry.createdAt).split(' ')[0]}
                          </span>
                        </div>
                        <p className="text-3xs text-slate-500 font-medium mt-1 leading-normal">
                          {entry.note}
                        </p>
                        <span className="text-[9px] text-slate-400 block mt-0.5 italic">
                          Cập nhật bởi: {entry.updatedBy === 'admin' ? 'Nhân viên 247' : entry.updatedBy === 'customer' ? 'Khách hàng' : 'Hệ thống'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
