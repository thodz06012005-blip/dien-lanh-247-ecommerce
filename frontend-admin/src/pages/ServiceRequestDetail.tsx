import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import type { AxiosError } from 'axios';
import {
  Activity,
  ArrowLeft,
  CalendarDays,
  Camera,
  CheckCircle2,
  Clock3,
  FileClock,
  History,
  Image as ImageIcon,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  UploadCloud,
  UserRound,
  UserRoundCheck,
  Wrench,
  X,
} from 'lucide-react';
import api from '@/services/api';
import {
  assignServiceRequestTechnician,
  getServiceRequest,
  updateServiceRequestStatus,
  uploadServiceRequestMedia,
} from '@/services/serviceRequestApi';
import type { ServiceRequestStatus } from '@/features/service-requests/types';
import type { Technician } from '@/features/technicians/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import LoadingState from '@/components/ui/LoadingState';
import EmptyState from '@/components/ui/EmptyState';

const statusLabels: Record<string, string> = {
  NEW: 'Mới tiếp nhận',
  CONFIRMED: 'Đã xác nhận',
  ASSIGNED: 'Đã phân công',
  IN_PROGRESS: 'Đang sửa chữa',
  WAITING_PARTS: 'Chờ linh kiện',
  COMPLETED: 'Hoàn thành',
  WARRANTY: 'Bảo hành',
  CLOSED: 'Đã đóng',
  CANCELLED: 'Đã hủy',
  REJECTED: 'Từ chối',
  RESCHEDULED: 'Hẹn lại',
};

const statusClasses: Record<string, string> = {
  NEW: 'border-amber-200 bg-amber-50 text-amber-700',
  CONFIRMED: 'border-blue-200 bg-blue-50 text-blue-700',
  ASSIGNED: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  IN_PROGRESS: 'border-cyan-200 bg-cyan-50 text-cyan-700',
  WAITING_PARTS: 'border-orange-200 bg-orange-50 text-orange-700',
  COMPLETED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  WARRANTY: 'border-violet-200 bg-violet-50 text-violet-700',
  CLOSED: 'border-slate-200 bg-slate-100 text-slate-700',
  CANCELLED: 'border-red-200 bg-red-50 text-red-700',
  REJECTED: 'border-rose-200 bg-rose-50 text-rose-700',
  RESCHEDULED: 'border-yellow-200 bg-yellow-50 text-yellow-700',
};

const mediaStages = [
  { value: 'BEFORE', label: 'Trước sửa chữa' },
  { value: 'DIAGNOSTIC', label: 'Chẩn đoán' },
  { value: 'AFTER', label: 'Sau sửa chữa' },
  { value: 'WARRANTY', label: 'Bảo hành' },
] as const;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);

export default function ServiceRequestDetail() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [nextStatus, setNextStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [finalPrice, setFinalPrice] = useState('');
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleSlot, setRescheduleSlot] = useState('');
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [mediaStage, setMediaStage] = useState<'BEFORE' | 'DIAGNOSTIC' | 'AFTER' | 'WARRANTY'>('BEFORE');
  const [mediaCaption, setMediaCaption] = useState('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [activeTab, setActiveTab] = useState<'timeline' | 'media' | 'audit'>('timeline');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const detailQuery = useQuery({
    queryKey: ['admin-service-request', id],
    queryFn: () => getServiceRequest(id),
    enabled: Boolean(id),
    refetchInterval: 20_000,
  });

  const technicianQuery = useQuery({
    queryKey: ['admin-technicians'],
    queryFn: async () => (await api.get('/admin/technicians')).data,
  });

  const request = detailQuery.data?.data;
  const technicians = useMemo<Technician[]>(() => technicianQuery.data?.data || [], [technicianQuery.data]);
  const compatibleTechnicians = useMemo(
    () => technicians.filter((technician) =>
      technician.skills?.includes(request?.serviceCategoryId || '') &&
      technician.workingAreas?.includes(request?.district || '') &&
      (technician.status === 'available' || technician.id === request?.assignedTechnicianId),
    ),
    [request, technicians],
  );

  const notify = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 4000);
  };

  const refreshRequest = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-service-request', id] });
    queryClient.invalidateQueries({ queryKey: ['admin-service-requests'] });
  };

  const statusMutation = useMutation({
    mutationFn: () => updateServiceRequestStatus(id, {
      status: nextStatus as ServiceRequestStatus,
      note: statusNote.trim() || undefined,
      ...(nextStatus === 'COMPLETED' ? { finalPrice: Number(finalPrice) } : {}),
      ...(nextStatus === 'RESCHEDULED' ? { preferredDate: rescheduleDate, preferredTimeSlot: rescheduleSlot } : {}),
    }),
    onSuccess: () => {
      refreshRequest();
      setNextStatus('');
      setStatusNote('');
      setFinalPrice('');
      setRescheduleDate('');
      setRescheduleSlot('');
      notify('success', 'Cập nhật trạng thái thành công.');
    },
    onError: (error: AxiosError<{ message?: string }>) =>
      notify('error', error.response?.data?.message || 'Không thể cập nhật trạng thái.'),
  });

  const assignMutation = useMutation({
    mutationFn: () => assignServiceRequestTechnician(id, selectedTechnician),
    onSuccess: () => {
      refreshRequest();
      queryClient.invalidateQueries({ queryKey: ['admin-technicians'] });
      setSelectedTechnician('');
      notify('success', 'Phân công kỹ thuật viên thành công.');
    },
    onError: (error: AxiosError<{ message?: string }>) =>
      notify('error', error.response?.data?.message || 'Không thể phân công kỹ thuật viên.'),
  });

  const mediaMutation = useMutation({
    mutationFn: () => uploadServiceRequestMedia(id, mediaFiles, mediaStage, mediaCaption.trim() || undefined),
    onSuccess: () => {
      refreshRequest();
      setMediaFiles([]);
      setMediaCaption('');
      notify('success', 'Ảnh đã được lưu vào hồ sơ yêu cầu.');
    },
    onError: (error: AxiosError<{ message?: string }>) =>
      notify('error', error.response?.data?.message || 'Không thể tải ảnh.'),
  });

  const submitStatus = () => {
    if (!nextStatus) return notify('error', 'Vui lòng chọn trạng thái tiếp theo.');
    if (nextStatus === 'COMPLETED' && (!finalPrice || Number(finalPrice) < 0)) {
      return notify('error', 'Vui lòng nhập chi phí thực tế hợp lệ.');
    }
    if (nextStatus === 'RESCHEDULED' && (!rescheduleDate || !rescheduleSlot)) {
      return notify('error', 'Vui lòng nhập ngày và khung giờ hẹn mới.');
    }
    statusMutation.mutate();
  };

  if (detailQuery.isLoading) return <LoadingState message="Đang tải hồ sơ yêu cầu dịch vụ..." />;
  if (detailQuery.isError || !request) {
    return <EmptyState message="Không tìm thấy yêu cầu" subMessage="Yêu cầu không tồn tại hoặc phiên quản trị không còn hiệu lực." />;
  }

  const allowedTransitions = request.allowedTransitions || [];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <button type="button" onClick={() => navigate('/service-requests')} className="mt-1 rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50"><ArrowLeft className="h-5 w-5" /></button>
          <div><div className="flex flex-wrap items-center gap-3"><h1 className="font-mono text-2xl font-black text-slate-950">{request.id}</h1><span className={`rounded-full border px-3 py-1 text-xs font-black ${statusClasses[String(request.status)] || 'border-slate-200 bg-slate-100 text-slate-700'}`}>{statusLabels[String(request.status)] || request.status}</span></div><p className="mt-1 text-sm text-slate-500">Tạo {new Date(request.createdAt).toLocaleString('vi-VN')} · phiên bản {request.requestVersion}</p></div>
        </div>
        <Button variant="outline" onClick={() => detailQuery.refetch()} isLoading={detailQuery.isRefetching}><RefreshCw className="mr-2 h-4 w-4" />Làm mới hồ sơ</Button>
      </header>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <Card className="p-0 overflow-hidden">
            <div className="bg-slate-950 p-6 text-white"><div className="flex items-center gap-2"><UserRound className="h-5 w-5 text-cyan-400" /><h2 className="text-lg font-black">Khách hàng và địa điểm</h2></div></div>
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <Info icon={UserRound} label="Họ tên" value={request.customerName} />
              <Info icon={Phone} label="Số điện thoại" value={request.customerPhone} />
              <Info icon={Mail} label="Email" value={request.customerEmail || 'Không có'} />
              <Info icon={MapPin} label="Khu vực" value={request.district} />
              <div className="sm:col-span-2"><Info icon={MapPin} label="Địa chỉ chi tiết" value={request.customerAddress} /></div>
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            <div className="flex items-center gap-2"><Wrench className="h-5 w-5 text-primary-600" /><h2 className="text-lg font-black text-slate-950">Nội dung yêu cầu</h2></div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2"><Info icon={Wrench} label="Dịch vụ" value={request.serviceCategoryName || request.serviceCategoryId} /><Info icon={Wrench} label="Thiết bị" value={request.applianceType} /><Info icon={CalendarDays} label="Ngày mong muốn" value={request.preferredDate} /><Info icon={Clock3} label="Khung giờ" value={request.preferredTimeSlot} /></div>
            <div className="mt-4 rounded-2xl bg-slate-50 p-4"><span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Mô tả sự cố</span><p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">{request.issueDescription}</p></div>
            {request.note && <div className="mt-3 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm leading-6 text-amber-800"><strong>Ghi chú:</strong> {request.note}</div>}
          </Card>

          <Card className="p-5 sm:p-6">
            <div className="flex items-center justify-between"><div className="flex items-center gap-2"><ImageIcon className="h-5 w-5 text-primary-600" /><h2 className="text-lg font-black text-slate-950">Ảnh trước/sau sửa chữa</h2></div><span className="text-xs font-bold text-slate-400">{request.media?.length || 0} ảnh</span></div>
            <div className="mt-5 grid gap-4 md:grid-cols-[0.8fr_1.2fr]">
              <div className="space-y-3"><Select label="Giai đoạn" value={mediaStage} onChange={(event) => setMediaStage(event.target.value as typeof mediaStage)} options={mediaStages.map((item) => ({ value: item.value, label: item.label }))} /><Input label="Chú thích" value={mediaCaption} onChange={(event) => setMediaCaption(event.target.value)} placeholder="Ví dụ: Dàn lạnh trước vệ sinh" /><label className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-4 text-center hover:border-primary-300"><UploadCloud className="h-7 w-7 text-primary-500" /><strong className="mt-2 text-xs text-slate-800">Chọn tối đa 5 ảnh</strong><span className="mt-1 text-[10px] text-slate-400">Mỗi ảnh không quá 5 MB</span><input type="file" accept="image/*" multiple className="sr-only" onChange={(event) => setMediaFiles(Array.from(event.target.files || []).slice(0, 5))} /></label>{mediaFiles.length > 0 && <div className="flex flex-wrap gap-2">{mediaFiles.map((file, index) => <span key={`${file.name}-${index}`} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">{file.name}<button type="button" onClick={() => setMediaFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))}><X className="h-3 w-3" /></button></span>)}</div>}<Button disabled={!mediaFiles.length} isLoading={mediaMutation.isPending} onClick={() => mediaMutation.mutate()} leftIcon={<Camera className="h-4 w-4" />}>Tải ảnh</Button></div>
              <div>{(request.media?.length || 0) === 0 ? <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl bg-slate-50 text-center"><ImageIcon className="h-9 w-9 text-slate-300" /><p className="mt-3 text-sm font-bold text-slate-700">Chưa có hình ảnh</p><p className="mt-1 text-xs text-slate-400">Ảnh khách hàng và kỹ thuật viên tải lên sẽ xuất hiện tại đây.</p></div> : <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{request.media?.map((item) => <a key={String(item.id)} href={item.url} target="_blank" rel="noreferrer" className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><img src={item.url} alt={item.caption || 'Ảnh hồ sơ'} className="aspect-square w-full object-cover" /><div className="p-2"><strong className="block text-[10px] text-slate-700">{item.stage.replaceAll('_', ' ')}</strong><span className="mt-1 block truncate text-[9px] text-slate-400">{item.caption || 'Không có chú thích'}</span></div></a>)}</div>}</div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-5 sm:p-6">
            <div className="flex items-center gap-2"><Activity className="h-5 w-5 text-primary-600" /><h2 className="text-lg font-black text-slate-950">Thao tác trạng thái</h2></div>
            {allowedTransitions.length === 0 ? <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600"><CheckCircle2 className="mr-2 inline h-4 w-4 text-emerald-600" />Yêu cầu đang ở trạng thái kết thúc, không còn bước chuyển hợp lệ.</div> : <div className="mt-5 space-y-4"><Select label="Trạng thái tiếp theo" value={nextStatus} onChange={(event) => setNextStatus(event.target.value)} options={[{ value: '', label: 'Chọn trạng thái' }, ...allowedTransitions.map((item) => ({ value: item, label: statusLabels[item] || item }))]} />{nextStatus === 'COMPLETED' && <Input label="Chi phí thực tế (VND)" type="number" min="0" value={finalPrice} onChange={(event) => setFinalPrice(event.target.value)} placeholder="0" />}{nextStatus === 'RESCHEDULED' && <div className="grid gap-3 sm:grid-cols-2"><Input label="Ngày hẹn mới" type="date" value={rescheduleDate} onChange={(event) => setRescheduleDate(event.target.value)} /><Input label="Khung giờ mới" value={rescheduleSlot} onChange={(event) => setRescheduleSlot(event.target.value)} placeholder="08:00 - 10:00" /></div>}<div><label className="text-[13px] font-medium text-slate-700">Ghi chú thao tác</label><textarea rows={3} value={statusNote} onChange={(event) => setStatusNote(event.target.value)} placeholder="Lý do hoặc kết quả xử lý..." className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-primary-600 focus:ring-4 focus:ring-primary-500/10" /></div><Button onClick={submitStatus} isLoading={statusMutation.isPending} fullWidth>Áp dụng trạng thái</Button></div>}
          </Card>

          <Card className="p-5 sm:p-6">
            <div className="flex items-center gap-2"><UserRoundCheck className="h-5 w-5 text-primary-600" /><h2 className="text-lg font-black text-slate-950">Điều phối kỹ thuật viên</h2></div>
            <div className="mt-4 rounded-2xl bg-slate-50 p-4"><span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Đang phụ trách</span><strong className="mt-2 block text-sm text-slate-900">{request.technicianName || 'Chưa phân công'}</strong></div>
            <div className="mt-4 space-y-3"><Select label="Kỹ thuật viên phù hợp" value={selectedTechnician} onChange={(event) => setSelectedTechnician(event.target.value)} options={[{ value: '', label: compatibleTechnicians.length ? 'Chọn kỹ thuật viên' : 'Không có kỹ thuật viên phù hợp' }, ...compatibleTechnicians.map((item) => ({ value: item.id, label: `${item.name} · ${item.status}` }))]} /><p className="text-[10px] leading-5 text-slate-400">Danh sách đã lọc theo kỹ năng, khu vực và trạng thái sẵn sàng.</p><Button variant="outline" disabled={!selectedTechnician} isLoading={assignMutation.isPending} onClick={() => assignMutation.mutate()} fullWidth>Phân công kỹ thuật viên</Button></div>
          </Card>

          <Card className="p-0 overflow-hidden">
            <div className="flex border-b border-slate-200 bg-slate-50">{([{ id: 'timeline', label: 'Lịch sử', icon: History }, { id: 'media', label: 'Ảnh', icon: Camera }, { id: 'audit', label: 'Audit', icon: FileClock }] as const).map((tab) => { const Icon = tab.icon; return <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`flex flex-1 items-center justify-center gap-1.5 px-3 py-3 text-xs font-black transition ${activeTab === tab.id ? 'border-b-2 border-primary-600 bg-white text-primary-700' : 'text-slate-500'}`}><Icon className="h-4 w-4" />{tab.label}</button>; })}</div>
            <div className="max-h-[480px] overflow-y-auto p-5">{activeTab === 'timeline' && <Timeline items={request.timeline || []} />}{activeTab === 'media' && <CompactMedia items={request.media || []} />}{activeTab === 'audit' && <AuditList items={request.audits || []} />}</div>
          </Card>

          <Card className="p-5"><h2 className="text-sm font-black text-slate-900">Chi phí</h2><div className="mt-4 space-y-3 text-sm"><div className="flex justify-between"><span className="text-slate-500">Ước tính</span><strong>{formatCurrency(request.estimatedPrice)}</strong></div><div className="flex justify-between border-t border-slate-100 pt-3"><span className="text-slate-500">Thực tế</span><strong className="text-primary-700">{formatCurrency(request.finalPrice)}</strong></div><div className="flex justify-between border-t border-slate-100 pt-3"><span className="text-slate-500">Thanh toán</span><strong>{request.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}</strong></div></div></Card>
        </div>
      </div>

      {toast && <div className={`fixed bottom-5 right-5 z-50 rounded-xl border px-4 py-3 text-sm font-bold shadow-xl ${toast.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-800'}`}>{toast.message}</div>}
    </div>
  );
}

function Info({ icon: Icon, label, value }: { icon: typeof UserRound; label: string; value: string }) {
  return <div className="rounded-2xl border border-slate-200 p-4"><div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-400"><Icon className="h-3.5 w-3.5" />{label}</div><strong className="mt-2 block text-sm leading-6 text-slate-900">{value}</strong></div>;
}

function Timeline({ items }: { items: Array<{ id: string | number; fromStatus?: string | null; toStatus: string; note?: string | null; actorType: string; actorName?: string | null; createdAt: string }> }) {
  if (!items.length) return <p className="text-center text-xs text-slate-400">Chưa có lịch sử chuẩn hóa.</p>;
  return <div>{items.map((item, index) => <div key={String(item.id)} className="relative flex gap-3 pb-5 last:pb-0"><div className="relative z-10 mt-1 h-3 w-3 shrink-0 rounded-full bg-primary-500 ring-4 ring-primary-50" />{index < items.length - 1 && <div className="absolute left-[5px] top-4 h-full w-px bg-slate-200" />}<div><strong className="text-xs text-slate-900">{statusLabels[item.toStatus] || item.toStatus}</strong><p className="mt-1 text-[10px] text-slate-400">{new Date(item.createdAt).toLocaleString('vi-VN')} · {item.actorName || item.actorType}</p>{item.note && <p className="mt-2 text-xs leading-5 text-slate-500">{item.note}</p>}</div></div>)}</div>;
}

function CompactMedia({ items }: { items: Array<{ id: string | number; stage: string; url: string; caption?: string | null }> }) {
  if (!items.length) return <p className="text-center text-xs text-slate-400">Chưa có hình ảnh.</p>;
  return <div className="grid grid-cols-2 gap-2">{items.map((item) => <a key={String(item.id)} href={item.url} target="_blank" rel="noreferrer" className="overflow-hidden rounded-xl border border-slate-200"><img src={item.url} alt={item.caption || 'Ảnh hồ sơ'} className="aspect-square w-full object-cover" /><span className="block p-2 text-[9px] font-bold text-slate-500">{item.stage}</span></a>)}</div>;
}

function AuditList({ items }: { items: Array<{ id: string | number; action: string; actorType: string; actorName?: string | null; createdAt: string }> }) {
  if (!items.length) return <p className="text-center text-xs text-slate-400">Chưa có audit log.</p>;
  return <div className="space-y-3">{items.map((item) => <div key={String(item.id)} className="rounded-xl border border-slate-200 p-3"><strong className="text-xs text-slate-900">{item.action}</strong><p className="mt-1 text-[10px] text-slate-400">{item.actorName || item.actorType} · {new Date(item.createdAt).toLocaleString('vi-VN')}</p></div>)}</div>;
}
