import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wrench, Calendar, ClipboardList, ArrowRight, Sparkles } from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import type { ServiceRequest } from '../types/service';
import Breadcrumb from '../components/common/Breadcrumb';
import PageTransition from '../components/common/PageTransition';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import useDocumentTitle from '../hooks/useDocumentTitle';

const statusConfigs: Record<string, { label: string; colorClass: string; variant: 'warning' | 'info' | 'primary' | 'neutral' | 'success' }> = {
  pending: { label: 'Chờ xác nhận', colorClass: 'bg-amber-50 text-amber-700 border-amber-200', variant: 'warning' },
  confirmed: { label: 'Đã xác nhận', colorClass: 'bg-sky-50 text-sky-700 border-sky-200', variant: 'info' },
  assigned: { label: 'Đã phân công', colorClass: 'bg-primary-50 text-primary-700 border-primary-100', variant: 'primary' },
  cancelled: { label: 'Đã hủy', colorClass: 'bg-slate-100 text-slate-500 border-slate-200', variant: 'neutral' },
  completed: { label: 'Hoàn thành', colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200', variant: 'success' },
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

export default function MyServices() {
  useDocumentTitle('Lịch sử sửa chữa', 'Xem lịch sử yêu cầu sửa chữa thiết bị điện lạnh tại Điện Lạnh 247.');

  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();

  const { data: requestsData, isLoading, error, refetch } = useQuery({
    queryKey: ['my-service-requests', user?.phone],
    queryFn: async () => {
      const res = await api.get('/my-service-requests', {
        params: { phone: user?.phone },
      });
      return res.data;
    },
    enabled: isAuthenticated && !!user?.phone,
  });

  const requests: ServiceRequest[] = requestsData?.data || [];

  if (!isAuthenticated) {
    return (
      <PageTransition>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center flex flex-col items-center justify-center min-h-[50vh]">
          <div className="w-20 h-20 bg-slate-100 rounded-[2rem] flex items-center justify-center mb-6 text-slate-400">
            <ClipboardList className="w-9 h-9" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Bạn chưa đăng nhập</h2>
          <p className="text-xs text-slate-500 mt-2 max-w-sm leading-relaxed">
            Vui lòng đăng nhập để xem lịch sử yêu cầu sửa chữa và theo dõi trạng thái dịch vụ.
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
          <div className="w-20 h-20 bg-amber-50 rounded-[2rem] flex items-center justify-center mb-6 text-amber-500 border border-amber-100">
            <ClipboardList className="w-9 h-9" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Chưa có số điện thoại</h2>
          <p className="text-xs text-slate-500 mt-2 max-w-sm leading-relaxed">
            Tài khoản của bạn chưa cập nhật số điện thoại. Vui lòng cập nhật số điện thoại trong mục thông tin tài khoản để tra cứu lịch sử sửa chữa.
          </p>
          <Button variant="primary" className="mt-6 rounded-xl text-xs py-2.5 px-6 font-bold" onClick={() => navigate('/account?tab=profile')}>
            Cập nhật ngay
          </Button>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <Breadcrumb items={[{ name: 'Lịch sử sửa chữa' }]} />

        {/* Premium Hero Banner */}
        <div className="relative mb-10 overflow-hidden bg-slate-900 rounded-[2rem] shadow-xl border border-slate-800 p-6 md:p-10 flex flex-col justify-center min-h-[160px] md:min-h-[200px]">
          <div className="absolute inset-0 bg-gradient-to-r from-[#061527] via-[#061527]/95 to-transparent z-10" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/8 rounded-full blur-3xl z-0" />
          <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-primary-600/8 rounded-full blur-3xl z-0" />

          <div className="relative z-20 max-w-xl">
            <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest bg-cyan-950/60 border border-cyan-800/30 px-3 py-1 rounded-full inline-flex items-center gap-1.5 mb-3">
              <Sparkles className="w-3 h-3" />
              Quản lý dịch vụ
            </span>
            <h1 className="text-2xl md:text-3xl font-black text-white">
              Lịch sử sửa chữa
            </h1>
            <p className="text-2xs md:text-xs text-slate-300 mt-2 max-w-md leading-relaxed">
              Theo dõi trạng thái các yêu cầu sửa chữa thiết bị điện lạnh và lịch hẹn kỹ thuật viên.
            </p>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-28 w-full rounded-[2rem]" />
            <Skeleton className="h-28 w-full rounded-[2rem]" />
            <Skeleton className="h-28 w-full rounded-[2rem]" />
          </div>
        ) : error ? (
          <div className="text-center py-10 bg-white rounded-[2rem] border border-slate-100 p-6 shadow-2xs max-w-md mx-auto">
            <p className="text-red-500 font-bold text-xs">Có lỗi xảy ra khi tải dữ liệu yêu cầu sửa chữa.</p>
            <Button variant="outline" className="mt-4 rounded-xl text-3xs font-black uppercase" onClick={() => refetch()}>Thử lại</Button>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-[2.5rem] border border-slate-100 p-8 flex flex-col items-center max-w-xl mx-auto shadow-2xs">
            <div className="w-20 h-20 rounded-[2rem] bg-slate-50 flex items-center justify-center mb-6 text-slate-300">
              <Wrench className="w-9 h-9" />
            </div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Chưa có yêu cầu nào</h3>
            <p className="text-3xs text-slate-500 mt-2 max-w-xs leading-relaxed">
              Bạn chưa gửi yêu cầu sửa chữa nào. Đặt lịch ngay để kỹ thuật viên hỗ trợ bạn!
            </p>
            <Button
              variant="primary"
              className="mt-6 rounded-xl text-3xs py-2.5 px-6 font-bold uppercase tracking-wider"
              onClick={() => navigate('/service-booking')}
            >
              Đặt lịch sửa chữa
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {requests.map((request, idx) => {
              const statusCfg = statusConfigs[request.status] || { label: request.status, colorClass: 'bg-slate-100 text-slate-500', variant: 'neutral' as const };

              return (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.06 }}
                  onClick={() => navigate(`/my-services/${request.id}`)}
                  className="bg-white rounded-[2rem] border border-slate-100 hover:border-blue-100 shadow-2xs hover:shadow-xs transition-all overflow-hidden cursor-pointer p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5"
                >
                  {/* Left: Icon & Details */}
                  <div className="flex items-center gap-4 flex-grow min-w-0">
                    <div className="w-14 h-14 rounded-2xl bg-primary-50 border border-primary-100 flex items-center justify-center flex-shrink-0">
                      <Wrench className="w-6 h-6 text-primary-600" />
                    </div>
                    <div className="min-w-0 flex-grow">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mb-1">
                        <span className="text-xs font-black text-slate-900">{request.id}</span>
                        <span className="text-slate-300 hidden sm:inline">•</span>
                        <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {request.preferredDate} | {request.preferredTimeSlot}
                        </span>
                        <span className="text-slate-300 hidden sm:inline">•</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${statusCfg.colorClass}`}>
                          {statusCfg.label}
                        </span>
                      </div>
                      <p className="text-3xs text-slate-500 line-clamp-1">
                        {request.applianceType || 'Thiết bị điện lạnh'} — {request.issueDescription}
                      </p>
                    </div>
                  </div>

                  {/* Right: Price & Action */}
                  <div className="flex items-center justify-between md:justify-end gap-5 w-full md:w-auto border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
                    <div className="text-left md:text-right">
                      <span className="text-4xs text-slate-400 block font-bold uppercase tracking-wider">Dự kiến</span>
                      <strong className="text-sm font-black text-primary-600">
                        {request.estimatedPrice > 0 ? formatCurrency(request.estimatedPrice) : 'Liên hệ'}
                      </strong>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl font-bold py-2 text-3xs"
                      rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                    >
                      Xem chi tiết
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
