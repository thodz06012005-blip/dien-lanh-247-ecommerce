import { useDeferredValue, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  PackageSearch,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRoundCheck,
  Wrench,
} from 'lucide-react';
import type { AxiosError } from 'axios';
import api from '@/services/api';
import { listServiceRequests, updateServiceRequestStatus } from '@/services/serviceRequestApi';
import type { ServiceCategory, ServiceRequest, ServiceRequestStatus } from '@/features/service-requests/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import LoadingState from '@/components/ui/LoadingState';
import EmptyState from '@/components/ui/EmptyState';

const statusLabels: Record<string, string> = {
  NEW: 'Mới tiếp nhận', CONFIRMED: 'Đã xác nhận', ASSIGNED: 'Đã phân công', IN_PROGRESS: 'Đang sửa chữa',
  WAITING_PARTS: 'Chờ linh kiện', COMPLETED: 'Hoàn thành', WARRANTY: 'Bảo hành', CLOSED: 'Đã đóng',
  CANCELLED: 'Đã hủy', REJECTED: 'Từ chối', RESCHEDULED: 'Hẹn lại',
};

const statusClasses: Record<string, string> = {
  NEW: 'bg-amber-50 text-amber-700 border-amber-200', CONFIRMED: 'bg-blue-50 text-blue-700 border-blue-200',
  ASSIGNED: 'bg-indigo-50 text-indigo-700 border-indigo-200', IN_PROGRESS: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  WAITING_PARTS: 'bg-orange-50 text-orange-700 border-orange-200', COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  WARRANTY: 'bg-violet-50 text-violet-700 border-violet-200', CLOSED: 'bg-slate-100 text-slate-700 border-slate-200',
  CANCELLED: 'bg-red-50 text-red-700 border-red-200', REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
  RESCHEDULED: 'bg-yellow-50 text-yellow-700 border-yellow-200',
};

const priorityLabels: Record<string, string> = { low: 'Thông thường', medium: 'Cần sớm', high: 'Khẩn cấp', urgent: 'Rất khẩn cấp' };
const priorityClasses: Record<string, string> = { low: 'text-slate-600', medium: 'text-blue-700', high: 'text-orange-700', urgent: 'text-red-700' };

const quickFilters = [
  { id: 'new', label: 'Mới tiếp nhận', stat: 'newCount', icon: Clock3, className: 'text-amber-700 bg-amber-50 border-amber-200' },
  { id: 'unassigned', label: 'Chưa phân công', stat: 'unassignedCount', icon: UserRoundCheck, className: 'text-blue-700 bg-blue-50 border-blue-200' },
  { id: 'active', label: 'Đang xử lý', stat: 'activeCount', icon: Wrench, className: 'text-cyan-700 bg-cyan-50 border-cyan-200' },
  { id: 'waiting-parts', label: 'Chờ linh kiện', stat: 'waitingPartsCount', icon: PackageSearch, className: 'text-orange-700 bg-orange-50 border-orange-200' },
  { id: 'overdue', label: 'Quá lịch', stat: 'overdueCount', icon: AlertTriangle, className: 'text-red-700 bg-red-50 border-red-200' },
  { id: 'warranty', label: 'Bảo hành', stat: 'warrantyCount', icon: ShieldCheck, className: 'text-violet-700 bg-violet-50 border-violet-200' },
] as const;

export default function ServiceRequests() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchText, setSearchText] = useState('');
  const deferredSearch = useDeferredValue(searchText.trim());
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [category, setCategory] = useState('');
  const [quickFilter, setQuickFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const filters = {
    page,
    limit: 20,
    q: deferredSearch || undefined,
    status: status || undefined,
    priority: priority || undefined,
    serviceCategoryId: category || undefined,
    quickFilter: quickFilter === 'all' ? undefined : quickFilter,
    sortBy: 'createdAt',
    sortOrder: 'desc' as const,
  };

  const listQuery = useQuery({
    queryKey: ['admin-service-requests', filters],
    queryFn: () => listServiceRequests(filters),
    refetchInterval: 15_000,
    refetchIntervalInBackground: true,
  });

  const categoryQuery = useQuery({
    queryKey: ['service-categories'],
    queryFn: async () => (await api.get('/service-categories')).data,
  });
  const categories: ServiceCategory[] = categoryQuery.data?.data || [];

  const confirmMutation = useMutation({
    mutationFn: (id: string) => updateServiceRequestStatus(id, { status: 'CONFIRMED', note: 'Xác nhận nhanh từ danh sách vận hành' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-service-requests'] });
      setToast({ message: 'Đã xác nhận yêu cầu.', type: 'success' });
      setTimeout(() => setToast(null), 3500);
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      setToast({ message: error.response?.data?.message || 'Không thể xác nhận yêu cầu.', type: 'error' });
      setTimeout(() => setToast(null), 3500);
    },
  });

  const data = listQuery.data;
  const requests = data?.data || [];
  const stats = data?.stats;

  const resetPage = (action: () => void) => {
    action();
    setPage(1);
  };

  if (listQuery.isLoading) return <LoadingState message="Đang tải trung tâm điều phối yêu cầu..." />;
  if (listQuery.isError || !data?.success) return <EmptyState message="Không thể tải yêu cầu" subMessage="Kiểm tra backend, migration Giai đoạn 6 và phiên đăng nhập quản trị." />;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div><div className="flex items-center gap-2"><h1 className="text-2xl font-black tracking-tight text-slate-950">Trung tâm yêu cầu dịch vụ</h1><span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-700"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />Live 15s</span></div><p className="mt-1 text-sm leading-6 text-slate-500">Tiếp nhận, xác nhận, điều phối và theo dõi SLA trên một luồng thống nhất.</p></div>
        <Button variant="outline" size="sm" onClick={() => listQuery.refetch()} isLoading={listQuery.isRefetching}><RefreshCw className="mr-2 h-4 w-4" />Làm mới</Button>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {quickFilters.map((filter) => {
          const Icon = filter.icon;
          const count = Number(stats?.[filter.stat] || 0);
          const active = quickFilter === filter.id;
          return <button key={filter.id} type="button" onClick={() => resetPage(() => setQuickFilter(active ? 'all' : filter.id))} className={`rounded-2xl border p-4 text-left shadow-sm transition hover:-translate-y-0.5 ${filter.className} ${active ? 'ring-4 ring-primary-500/10' : ''}`}><div className="flex items-center justify-between"><Icon className="h-5 w-5" /><strong className="text-2xl font-black">{count}</strong></div><span className="mt-3 block text-xs font-black">{filter.label}</span></button>;
        })}
      </div>

      <Card className="p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-4">
          <div className="relative"><Input value={searchText} onChange={(event) => resetPage(() => setSearchText(event.target.value))} placeholder="Mã, tên, SĐT hoặc email..." className="pl-10" /><Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" /></div>
          <Select value={status} onChange={(event) => resetPage(() => { setStatus(event.target.value); setQuickFilter('all'); })} options={[{ value: '', label: 'Tất cả trạng thái' }, ...Object.entries(statusLabels).map(([value, label]) => ({ value, label }))]} />
          <Select value={priority} onChange={(event) => resetPage(() => setPriority(event.target.value))} options={[{ value: '', label: 'Tất cả mức ưu tiên' }, ...Object.entries(priorityLabels).map(([value, label]) => ({ value, label }))]} />
          <Select value={category} onChange={(event) => resetPage(() => setCategory(event.target.value))} options={[{ value: '', label: 'Tất cả dịch vụ' }, ...categories.map((item) => ({ value: item.id, label: item.name }))]} />
        </div>
      </Card>

      <Card noPadding className="overflow-hidden shadow-sm">
        {requests.length === 0 ? <div className="p-12 text-center"><CheckCircle2 className="mx-auto h-10 w-10 text-slate-300" /><h2 className="mt-4 font-black text-slate-900">Không có yêu cầu phù hợp</h2><p className="mt-2 text-sm text-slate-500">Thay đổi bộ lọc hoặc chờ yêu cầu mới được gửi.</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[1100px] text-left text-sm"><thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-4">Yêu cầu</th><th className="px-5 py-4">Khách hàng</th><th className="px-5 py-4">Dịch vụ</th><th className="px-5 py-4">Ưu tiên</th><th className="px-5 py-4">Trạng thái</th><th className="px-5 py-4">Kỹ thuật viên</th><th className="px-5 py-4">Lịch mong muốn</th><th className="px-5 py-4 text-right">Thao tác</th></tr></thead><tbody className="divide-y divide-slate-100">{requests.map((request) => <RequestRow key={request.id} request={request} confirming={confirmMutation.isPending} onConfirm={() => confirmMutation.mutate(request.id)} onOpen={() => navigate(`/service-requests/${request.id}`)} />)}</tbody></table></div>}
        <div className="flex flex-col gap-3 border-t border-slate-200 p-4 text-sm sm:flex-row sm:items-center sm:justify-between"><span className="text-slate-500">Hiển thị {requests.length} / {data.meta.total} yêu cầu</span><div className="flex items-center gap-3"><Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Trước</Button><span className="font-bold text-slate-700">{data.meta.page}/{Math.max(data.meta.totalPages, 1)}</span><Button size="sm" variant="outline" disabled={page >= data.meta.totalPages} onClick={() => setPage((value) => value + 1)}>Sau</Button></div></div>
      </Card>

      {toast && <div className={`fixed bottom-5 right-5 z-50 rounded-xl border px-4 py-3 text-sm font-bold shadow-xl ${toast.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-800'}`}>{toast.message}</div>}
    </div>
  );
}

function RequestRow({ request, confirming, onConfirm, onOpen }: { request: ServiceRequest; confirming: boolean; onConfirm: () => void; onOpen: () => void }) {
  const overdue = new Date(`${request.preferredDate}T23:59:59`) < new Date() && !['COMPLETED', 'CLOSED', 'CANCELLED', 'REJECTED'].includes(String(request.status));
  return <tr className="transition hover:bg-slate-50"><td className="px-5 py-4"><strong className="font-mono text-xs text-slate-950">{request.id}</strong><span className="mt-1 block text-[10px] text-slate-400">{new Date(request.createdAt).toLocaleString('vi-VN')}</span></td><td className="px-5 py-4"><strong className="block text-slate-900">{request.customerName}</strong><span className="mt-1 block text-xs text-slate-500">{request.customerPhone}</span></td><td className="px-5 py-4"><strong className="block max-w-48 truncate text-slate-800">{request.serviceCategoryName}</strong><span className="mt-1 block max-w-48 truncate text-xs text-slate-500">{request.applianceType}</span></td><td className={`px-5 py-4 text-xs font-black ${priorityClasses[request.priority]}`}>{priorityLabels[request.priority]}</td><td className="px-5 py-4"><span className={`rounded-full border px-2.5 py-1 text-[10px] font-black ${statusClasses[String(request.status)] || 'border-slate-200 bg-slate-100 text-slate-700'}`}>{statusLabels[String(request.status)] || request.status}</span></td><td className="px-5 py-4 text-xs text-slate-600">{request.technicianName || <span className="font-bold text-amber-600">Chưa phân công</span>}</td><td className="px-5 py-4"><span className={`text-xs font-bold ${overdue ? 'text-red-700' : 'text-slate-700'}`}>{request.preferredDate}</span><span className="mt-1 block text-[10px] text-slate-400">{request.preferredTimeSlot}</span></td><td className="px-5 py-4"><div className="flex justify-end gap-2">{request.status === 'NEW' && <Button size="sm" isLoading={confirming} onClick={onConfirm}>Xác nhận</Button>}<Button size="sm" variant="outline" onClick={onOpen}>Chi tiết <ArrowRight className="ml-1 h-3.5 w-3.5" /></Button></div></td></tr>;
}
