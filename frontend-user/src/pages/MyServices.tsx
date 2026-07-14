import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CalendarDays, ClipboardList, Search, Sparkles, Wrench } from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import type { ServiceRequest, ServiceRequestStatus } from '../types/service';
import Breadcrumb from '../components/common/Breadcrumb';
import PageTransition from '../components/common/PageTransition';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import useDocumentTitle from '../hooks/useDocumentTitle';

const statusLabels: Record<ServiceRequestStatus, string> = {
  NEW: 'Mới tiếp nhận', CONFIRMED: 'Đã xác nhận', ASSIGNED: 'Đã phân công', IN_PROGRESS: 'Đang sửa chữa',
  WAITING_PARTS: 'Chờ linh kiện', COMPLETED: 'Hoàn thành', WARRANTY: 'Bảo hành', CLOSED: 'Đã đóng',
  CANCELLED: 'Đã hủy', REJECTED: 'Từ chối', RESCHEDULED: 'Đã hẹn lại',
};

const statusClasses: Record<ServiceRequestStatus, string> = {
  NEW: 'bg-amber-50 text-amber-700 border-amber-200', CONFIRMED: 'bg-blue-50 text-blue-700 border-blue-200',
  ASSIGNED: 'bg-indigo-50 text-indigo-700 border-indigo-200', IN_PROGRESS: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  WAITING_PARTS: 'bg-orange-50 text-orange-700 border-orange-200', COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  WARRANTY: 'bg-violet-50 text-violet-700 border-violet-200', CLOSED: 'bg-slate-100 text-slate-700 border-slate-200',
  CANCELLED: 'bg-red-50 text-red-700 border-red-200', REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
  RESCHEDULED: 'bg-yellow-50 text-yellow-700 border-yellow-200',
};

const formatCurrency = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

export default function MyServices() {
  useDocumentTitle('Lịch sử sửa chữa', 'Theo dõi các yêu cầu sửa chữa gắn với tài khoản của bạn.');
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['my-service-requests'],
    queryFn: async () => (await api.get('/my-service-requests')).data,
    enabled: isAuthenticated,
  });
  const requests: ServiceRequest[] = data?.data || [];

  if (!isAuthenticated) return <Centered title="Bạn chưa đăng nhập" description="Đăng nhập để xem các yêu cầu dịch vụ gắn với số điện thoại trong tài khoản." action="Đăng nhập" onAction={() => navigate('/login')} />;
  if (!user?.phone) return <Centered title="Chưa có số điện thoại" description="Cập nhật số điện thoại trong hồ sơ để hệ thống liên kết đúng lịch sử sửa chữa." action="Cập nhật hồ sơ" onAction={() => navigate('/account?tab=profile')} />;

  return (
    <PageTransition>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Breadcrumb items={[{ name: 'Lịch sử sửa chữa' }]} />
        <section className="relative mb-8 overflow-hidden rounded-[2rem] bg-slate-950 p-7 text-white shadow-xl sm:p-10"><div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-cyan-500/15 blur-3xl" /><div className="relative"><span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300"><Sparkles className="h-3.5 w-3.5" /> Hồ sơ dịch vụ</span><h1 className="mt-4 text-3xl font-black">Lịch sử sửa chữa</h1><p className="mt-2 max-w-xl text-sm leading-7 text-slate-300">Danh sách này chỉ khả dụng sau khi đăng nhập. Tra cứu công khai luôn yêu cầu đồng thời mã yêu cầu và số điện thoại.</p><Button className="mt-5" variant="outline" leftIcon={<Search className="h-4 w-4" />} onClick={() => navigate('/service-lookup')}>Tra cứu bằng mã</Button></div></section>

        {isLoading ? <div className="space-y-4"><Skeleton className="h-32 rounded-3xl" /><Skeleton className="h-32 rounded-3xl" /></div> : error ? <Centered title="Không thể tải dữ liệu" description="Kết nối tới hệ thống dịch vụ đang gián đoạn." action="Thử lại" onAction={() => refetch()} /> : requests.length === 0 ? <Centered title="Chưa có yêu cầu nào" description="Tạo yêu cầu đầu tiên để kỹ thuật viên hỗ trợ thiết bị của bạn." action="Đặt lịch sửa chữa" onAction={() => navigate('/service-booking')} /> : <div className="space-y-4">{requests.map((request, index) => <motion.article key={request.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }} onClick={() => navigate(`/my-services/${request.id}`)} className="cursor-pointer rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-md"><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-start gap-4"><div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary-600"><Wrench className="h-6 w-6" /></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><strong className="font-mono text-sm text-slate-950">{request.code || request.id}</strong><span className={`rounded-full border px-2.5 py-1 text-[10px] font-black ${statusClasses[request.status]}`}>{statusLabels[request.status]}</span></div><p className="mt-2 text-sm font-bold text-slate-800">{request.serviceCategory?.name || 'Dịch vụ điện lạnh'} · {request.applianceType}</p><p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500"><CalendarDays className="h-3.5 w-3.5" />{request.preferredDate} · {request.preferredTimeSlot}</p></div></div><div className="flex items-center justify-between gap-5 border-t border-slate-100 pt-4 sm:border-0 sm:pt-0"><div><span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">Chi phí</span><strong className="mt-1 block text-sm text-primary-700">{request.finalPrice > 0 ? formatCurrency(request.finalPrice) : request.estimatedPrice > 0 ? formatCurrency(request.estimatedPrice) : 'Chờ báo giá'}</strong></div><Button variant="outline" size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>Chi tiết</Button></div></div></motion.article>)}</div>}
      </div>
    </PageTransition>
  );
}

function Centered({ title, description, action, onAction }: { title: string; description: string; action: string; onAction: () => void }) {
  return <PageTransition><div className="mx-auto flex min-h-[50vh] max-w-7xl flex-col items-center justify-center px-4 py-12 text-center"><div className="flex h-20 w-20 items-center justify-center rounded-[2rem] bg-slate-100 text-slate-400"><ClipboardList className="h-9 w-9" /></div><h2 className="mt-5 text-xl font-black text-slate-900">{title}</h2><p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">{description}</p><Button className="mt-6" onClick={onAction}>{action}</Button></div></PageTransition>;
}
