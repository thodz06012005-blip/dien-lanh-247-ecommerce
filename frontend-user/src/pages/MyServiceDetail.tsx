import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CalendarDays, Clock3, Image as ImageIcon, MapPin, PhoneCall, ShieldAlert, Sparkles, Star, UserRound, Wrench } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Breadcrumb from '@/components/common/Breadcrumb';
import PageTransition from '@/components/common/PageTransition';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import { useSettings } from '@/hooks/useSettings';
import api, { getApiErrorMessage } from '@/services/api';
import { useToastStore } from '@/store/toastStore';
import type { ServiceRequestStatus, ServiceRequestTimelineEvent, ServiceRequestMedia } from '@/types/service';

interface OwnerServiceRequest {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  customerAddress: string;
  district: string;
  status: ServiceRequestStatus;
  priority: string;
  applianceType: string;
  issueDescription: string;
  preferredDate: string;
  preferredTimeSlot: string;
  note?: string | null;
  estimatedPrice: number;
  finalPrice: number;
  paymentStatus: string;
  createdAt: string;
  updatedAt: string;
  serviceCategoryName: string;
  technicianName?: string | null;
  technicianAvatar?: string | null;
  timeline: ServiceRequestTimelineEvent[];
  media: ServiceRequestMedia[];
  review?: { rating: number; comment?: string | null; createdAt: string; updatedAt: string } | null;
}

const statusLabels: Record<ServiceRequestStatus, string> = {
  NEW: 'Mới tiếp nhận', CONFIRMED: 'Đã xác nhận', ASSIGNED: 'Đã phân công', IN_PROGRESS: 'Đang sửa chữa',
  WAITING_PARTS: 'Chờ linh kiện', COMPLETED: 'Hoàn thành', WARRANTY: 'Bảo hành', CLOSED: 'Đã đóng',
  CANCELLED: 'Đã hủy', REJECTED: 'Từ chối', RESCHEDULED: 'Đã hẹn lại',
};
const statusClass: Record<ServiceRequestStatus, string> = {
  NEW: 'bg-amber-50 text-amber-700 border-amber-200', CONFIRMED: 'bg-blue-50 text-blue-700 border-blue-200',
  ASSIGNED: 'bg-indigo-50 text-indigo-700 border-indigo-200', IN_PROGRESS: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  WAITING_PARTS: 'bg-orange-50 text-orange-700 border-orange-200', COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  WARRANTY: 'bg-violet-50 text-violet-700 border-violet-200', CLOSED: 'bg-slate-100 text-slate-700 border-slate-200',
  CANCELLED: 'bg-red-50 text-red-700 border-red-200', REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
  RESCHEDULED: 'bg-yellow-50 text-yellow-700 border-yellow-200',
};
const formatCurrency = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value || 0));

export default function MyServiceDetail() {
  const { id = '' } = useParams<{ id: string }>();
  useDocumentTitle(`Chi tiết yêu cầu ${id}`);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { settings } = useSettings();
  const { showSuccess, showError } = useToastStore();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const detailQuery = useQuery({
    queryKey: ['account-service-request', id],
    queryFn: async () => (await api.get(`/account/service-requests/${id}`)).data.data as OwnerServiceRequest,
    enabled: Boolean(id),
  });
  const request = detailQuery.data;
  const reviewMutation = useMutation({
    mutationFn: () => api.post(`/account/service-requests/${id}/review`, { rating, comment: comment.trim() || undefined }),
    onSuccess: () => { showSuccess('Cảm ơn bạn đã đánh giá dịch vụ.'); void queryClient.invalidateQueries({ queryKey: ['account-service-request', id] }); },
    onError: (error) => showError(getApiErrorMessage(error)),
  });

  if (detailQuery.isLoading) return <PageTransition><div className="mx-auto max-w-7xl space-y-5 px-4 py-8"><Skeleton className="h-36 rounded-3xl" /><Skeleton className="h-80 rounded-3xl" /></div></PageTransition>;
  if (detailQuery.isError || !request) return <Centered title="Không tìm thấy yêu cầu" description="Yêu cầu không thuộc tài khoản hiện tại hoặc đã bị xóa." action="Quay lại" onAction={() => navigate('/my-services')} />;
  const canReview = ['COMPLETED', 'WARRANTY', 'CLOSED'].includes(request.status);

  return (
    <PageTransition>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Breadcrumb items={[{ name: 'Lịch sử sửa chữa', path: '/my-services' }, { name: request.id }]} />
        <Link to="/my-services" className="mb-5 inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500 hover:text-primary-600"><ArrowLeft className="h-4 w-4" />Quay lại danh sách</Link>
        <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-7 text-white shadow-xl sm:p-9"><div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-cyan-500/15 blur-3xl" /><div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300"><ShieldAlert className="h-3.5 w-3.5" /> Dữ liệu chỉ dành cho chủ tài khoản</span><h1 className="mt-4 font-mono text-2xl font-black sm:text-3xl">{request.id}</h1><p className="mt-2 text-sm text-slate-400">Tạo lúc {new Date(request.createdAt).toLocaleString('vi-VN')}</p></div><div className="flex flex-wrap gap-3"><span className={`rounded-full border px-3 py-1.5 text-xs font-black ${statusClass[request.status]}`}>{statusLabels[request.status]}</span><a href={`tel:${settings.hotline.replace(/\s+/g, '')}`} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold hover:bg-white/10"><PhoneCall className="h-4 w-4 text-cyan-400" />{settings.hotline}</a></div></div></section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><h2 className="text-lg font-black text-slate-950">Thông tin dịch vụ</h2><div className="mt-5 grid gap-3 sm:grid-cols-2"><Info icon={UserRound} label="Khách hàng" value={request.customerName} /><Info icon={Wrench} label="Dịch vụ" value={`${request.serviceCategoryName} · ${request.applianceType}`} /><Info icon={MapPin} label="Địa chỉ" value={`${request.customerAddress}, ${request.district}`} /><Info icon={CalendarDays} label="Ngày mong muốn" value={request.preferredDate} /><Info icon={Clock3} label="Khung giờ" value={request.preferredTimeSlot} /><Info icon={Wrench} label="Kỹ thuật viên" value={request.technicianName || 'Chưa phân công'} /></div><div className="mt-4 rounded-2xl bg-slate-50 p-4"><span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Mô tả sự cố</span><p className="mt-2 text-sm leading-7 text-slate-600">{request.issueDescription}</p></div></section>
            {request.media.length > 0 && <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center gap-2"><ImageIcon className="h-5 w-5 text-primary-600" /><h2 className="text-lg font-black text-slate-950">Ảnh trước và sau sửa chữa</h2></div><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">{request.media.map((item) => <a key={item.id} href={item.url} target="_blank" rel="noreferrer" className="overflow-hidden rounded-2xl border border-slate-200"><img src={item.url} alt={item.caption || 'Ảnh dịch vụ'} className="aspect-square w-full object-cover" /><div className="p-2 text-[10px] font-black text-slate-500">{item.stage.replaceAll('_', ' ')}</div></a>)}</div></section>}
            {canReview && <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-orange-500" /><h2 className="text-lg font-black text-slate-950">Đánh giá dịch vụ</h2></div>{request.review && <p className="mt-2 text-sm text-emerald-700">Bạn đã đánh giá {request.review.rating}/5 sao. Có thể cập nhật lại bất cứ lúc nào.</p>}<div className="mt-5 flex gap-2">{[1,2,3,4,5].map((value) => <button type="button" key={value} onClick={() => setRating(value)} className="rounded-xl p-2 hover:bg-orange-50" aria-label={`${value} sao`}><Star className={`h-6 w-6 ${value <= rating ? 'fill-orange-400 text-orange-400' : 'text-slate-300'}`} /></button>)}</div><textarea value={comment} onChange={(event) => setComment(event.target.value)} className="mt-4 min-h-28 w-full rounded-2xl border border-slate-200 p-4 text-sm outline-none focus:border-primary-500 focus:ring-4 focus:ring-blue-100" placeholder={request.review?.comment || 'Chia sẻ trải nghiệm của bạn...'} /><div className="mt-4 flex justify-end"><Button isLoading={reviewMutation.isPending} onClick={() => reviewMutation.mutate()}>Gửi đánh giá</Button></div></section>}
          </div>
          <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><h2 className="text-lg font-black text-slate-950">Tiến độ xử lý</h2><div className="mt-5">{request.timeline.map((event, index) => <div key={event.id} className="relative flex gap-4 pb-6 last:pb-0"><div className="relative z-10 mt-1 h-3 w-3 shrink-0 rounded-full bg-primary-500 ring-4 ring-primary-50" />{index < request.timeline.length - 1 && <div className="absolute left-[5px] top-4 h-full w-px bg-slate-200" />}<div><strong className="text-sm text-slate-900">{statusLabels[event.toStatus]}</strong><p className="mt-1 text-[10px] text-slate-400">{new Date(event.createdAt).toLocaleString('vi-VN')}</p>{event.note && <p className="mt-2 text-xs leading-5 text-slate-500">{event.note}</p>}</div></div>)}</div></section>
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><h2 className="text-lg font-black text-slate-950">Chi phí</h2><div className="mt-4 space-y-3 text-sm"><div className="flex justify-between"><span className="text-slate-500">Ước tính</span><strong>{request.estimatedPrice > 0 ? formatCurrency(request.estimatedPrice) : 'Chờ báo giá'}</strong></div><div className="flex justify-between border-t border-slate-100 pt-3"><span className="text-slate-500">Thực tế</span><strong className="text-primary-700">{request.finalPrice > 0 ? formatCurrency(request.finalPrice) : 'Chưa có'}</strong></div></div></section>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

function Info({ icon: Icon, label, value }: { icon: typeof UserRound; label: string; value: string }) {
  return <div className="rounded-2xl border border-slate-200 p-4"><div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-400"><Icon className="h-3.5 w-3.5" />{label}</div><strong className="mt-2 block text-sm leading-6 text-slate-900">{value}</strong></div>;
}
function Centered({ title, description, action, onAction }: { title: string; description: string; action: string; onAction: () => void }) {
  return <PageTransition><div className="mx-auto flex min-h-[50vh] max-w-7xl flex-col items-center justify-center px-4 py-12 text-center"><div className="flex h-20 w-20 items-center justify-center rounded-[2rem] bg-slate-100 text-slate-400"><ShieldAlert className="h-9 w-9" /></div><h2 className="mt-5 text-xl font-black text-slate-900">{title}</h2><p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">{description}</p><Button className="mt-6" onClick={onAction}>{action}</Button></div></PageTransition>;
}
