import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  CalendarClock,
  ClipboardCheck,
  CreditCard,
  Gauge,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Smartphone,
  UserRound,
  Users,
  WalletCards,
  Wrench,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useCallback, useMemo, useState, type ReactNode } from 'react';
import AdminDataTable, { type AdminDataColumn } from '@/components/admin/AdminDataTable';
import { getApiErrorMessage } from '@/services/api';
import {
  addOperationsNote,
  createCompletionReport,
  createCustomerDevice,
  createServiceQuote,
  createTechnicianSchedule,
  createWarranty,
  dispatchTechnician,
  evaluateSla,
  getOperationsCustomers,
  getOperationsOverview,
  getOperationsTechnicians,
  getOperationsWorkspace,
  getSlaAlerts,
  getSlaPolicies,
  recordServicePayment,
  rescheduleRequest,
  saveSlaPolicy,
  type OperationsWorkspace,
} from '@/services/operationsApi';
import { useAdminAuthStore } from '@/store/adminAuthStore';

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
const dateTime = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
const inputClass = 'min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100';

type Tab = 'overview' | 'customers' | 'technicians' | 'sla' | 'workspace';
type DrawerType = 'device' | 'schedule' | 'dispatch' | 'quote' | 'payment' | 'completion' | 'warranty' | 'note' | 'reschedule' | 'sla';
type WorkspaceAction = Extract<DrawerType, 'dispatch' | 'quote' | 'payment' | 'completion' | 'warranty' | 'note' | 'reschedule'>;
type AnyRow = Record<string, unknown>;
type QuoteLine = { lineType: string; description: string; quantity: string; unit: string; unitPrice: string };

function text(value: unknown) { return String(value ?? ''); }
function num(value: unknown) { return Number(value ?? 0); }
function fmtDate(value: unknown) { return value ? dateTime.format(new Date(String(value))) : '—'; }
function statusTone(value: unknown) {
  const status = text(value).toUpperCase();
  if (['COMPLETED', 'CLOSED', 'ACTIVE', 'ACCEPTED', 'PAID'].includes(status)) return 'border-emerald-100 bg-emerald-50 text-emerald-700';
  if (['BREACHED', 'REJECTED', 'CANCELLED', 'OVERDUE'].includes(status)) return 'border-red-100 bg-red-50 text-red-700';
  if (['WAITING_PARTS', 'SENT', 'PARTIAL', 'WARRANTY'].includes(status)) return 'border-amber-100 bg-amber-50 text-amber-700';
  return 'border-blue-100 bg-blue-50 text-blue-700';
}

function Badge({ children }: { children: ReactNode }) {
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${statusTone(children)}`}>{children}</span>;
}

function MetricCard({ label, value, icon: Icon, tone = 'blue' }: { label: string; value: ReactNode; icon: LucideIcon; tone?: 'blue' | 'cyan' | 'amber' | 'emerald' | 'red' }) {
  const classes = { blue: 'from-blue-600 to-indigo-600', cyan: 'from-cyan-500 to-blue-500', amber: 'from-amber-500 to-orange-500', emerald: 'from-emerald-500 to-teal-500', red: 'from-red-500 to-rose-600' };
  return <article className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm"><div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${classes[tone]} text-white shadow-lg`}><Icon className="h-5 w-5" /></div><p className="mt-5 text-xs font-black uppercase tracking-[0.16em] text-slate-400">{label}</p><strong className="mt-2 block text-2xl font-black tracking-tight text-slate-950">{value}</strong></article>;
}

function Drawer({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return <div className="fixed inset-0 z-[80] flex justify-end bg-slate-950/60 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={title}><button className="absolute inset-0" onClick={onClose} aria-label="Đóng" /><aside className="relative h-full w-full max-w-2xl overflow-y-auto bg-slate-50 shadow-2xl"><header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur"><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">Operations Workspace</p><h2 className="mt-1 text-xl font-black text-slate-950">{title}</h2></div><button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-slate-100" aria-label="Đóng"><X className="h-5 w-5" /></button></header><div className="p-5 sm:p-7">{children}</div></aside></div>;
}

export default function Operations() {
  const queryClient = useQueryClient();
  const permissions = useAdminAuthStore((state) => state.permissions);
  const canManage = permissions.includes('operations.manage');
  const [tab, setTab] = useState<Tab>('overview');
  const [workspaceId, setWorkspaceId] = useState('');
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [drawer, setDrawer] = useState<DrawerType | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [quoteLines, setQuoteLines] = useState<QuoteLine[]>([{ lineType: 'LABOR', description: '', quantity: '1', unit: 'lần', unitPrice: '0' }]);
  const [notice, setNotice] = useState<string | null>(null);

  const overview = useQuery({ queryKey: ['operations-overview'], queryFn: getOperationsOverview, refetchInterval: 60_000 });
  const customers = useQuery({ queryKey: ['operations-customers'], queryFn: () => getOperationsCustomers({ limit: 100 }), enabled: tab === 'customers' });
  const technicians = useQuery({ queryKey: ['operations-technicians'], queryFn: () => getOperationsTechnicians({ limit: 100 }), enabled: tab === 'technicians' || drawer === 'dispatch' || drawer === 'schedule' });
  const slaPolicies = useQuery({ queryKey: ['operations-sla-policies'], queryFn: getSlaPolicies, enabled: tab === 'sla' || drawer === 'sla' });
  const slaAlerts = useQuery({ queryKey: ['operations-sla-alerts'], queryFn: () => getSlaAlerts(), enabled: tab === 'sla' || tab === 'overview' });
  const workspace = useQuery({ queryKey: ['operations-workspace', activeRequestId], queryFn: () => getOperationsWorkspace(activeRequestId as string), enabled: Boolean(activeRequestId) });

  const invalidate = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['operations-overview'] }),
      queryClient.invalidateQueries({ queryKey: ['operations-customers'] }),
      queryClient.invalidateQueries({ queryKey: ['operations-technicians'] }),
      queryClient.invalidateQueries({ queryKey: ['operations-sla-alerts'] }),
      queryClient.invalidateQueries({ queryKey: ['operations-workspace'] }),
    ]);
  }, [queryClient]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!drawer) throw new Error('Chưa chọn thao tác');
      if (drawer === 'device') return createCustomerDevice({ ...form, userId: form.userId ? Number(form.userId) : undefined, isActive: true });
      if (drawer === 'schedule') return createTechnicianSchedule({ ...form, scheduleType: form.scheduleType || 'WORK', status: 'CONFIRMED' });
      if (!activeRequestId) throw new Error('Chưa chọn yêu cầu dịch vụ');
      if (drawer === 'dispatch') return dispatchTechnician(activeRequestId, { technicianId: form.technicianId, scheduledStart: form.scheduledStart, scheduledEnd: form.scheduledEnd, reason: form.reason, force: form.force === 'true' });
      if (drawer === 'reschedule') return rescheduleRequest(activeRequestId, { scheduledStart: form.scheduledStart, scheduledEnd: form.scheduledEnd, reason: form.reason });
      if (drawer === 'note') return addOperationsNote(activeRequestId, { body: form.body, visibility: form.visibility || 'INTERNAL' });
      if (drawer === 'quote') return createServiceQuote(activeRequestId, { lines: quoteLines.map((line, index) => ({ ...line, quantity: Number(line.quantity), unitPrice: Number(line.unitPrice), sortOrder: index })), discountType: form.discountType || 'FIXED', discountValue: Number(form.discountValue || 0), taxRate: Number(form.taxRate || 0), notes: form.notes, validUntil: form.validUntil || undefined });
      if (drawer === 'payment') return recordServicePayment(activeRequestId, { quoteId: form.quoteId ? Number(form.quoteId) : undefined, method: form.method || 'CASH', amount: Number(form.amount), transactionReference: form.transactionReference, note: form.note });
      if (drawer === 'completion') return createCompletionReport(activeRequestId, { diagnosis: form.diagnosis, workPerformed: form.workPerformed, recommendations: form.recommendations, customerName: form.customerName, completedAt: form.completedAt });
      if (drawer === 'warranty') return createWarranty(activeRequestId, { completionReportId: form.completionReportId ? Number(form.completionReportId) : undefined, deviceId: form.deviceId ? Number(form.deviceId) : undefined, coverage: form.coverage, exclusions: form.exclusions, startsAt: form.startsAt, endsAt: form.endsAt });
      return saveSlaPolicy({ serviceCategoryId: form.serviceCategoryId || undefined, priority: form.priority, responseMinutes: Number(form.responseMinutes), assignMinutes: Number(form.assignMinutes), arrivalMinutes: Number(form.arrivalMinutes), resolutionMinutes: Number(form.resolutionMinutes), warrantyResponseMinutes: Number(form.warrantyResponseMinutes), isActive: true });
    },
    onSuccess: async (result) => {
      const record = result as Record<string, unknown>;
      setNotice(record.confirmationUrl ? `Báo giá đã tạo. Link xác nhận: ${text(record.confirmationUrl)}` : 'Đã lưu thay đổi thành công.');
      setDrawer(null);
      setForm({});
      await invalidate();
    },
  });

  const openWorkspace = useCallback((id: string) => { setActiveRequestId(id); setWorkspaceId(id); setTab('workspace'); }, []);
  const openDrawer = useCallback((value: DrawerType, defaults: Record<string, string> = {}) => { setForm(defaults); setDrawer(value); mutation.reset(); }, [mutation]);

  const customerColumns = useMemo<AdminDataColumn<AnyRow>[]>(() => [
    { key: 'customer', header: 'Khách hàng', sortable: true, accessor: (row) => `${text(row.firstName)} ${text(row.lastName)}`, render: (row) => <div><strong className="block text-slate-900">{`${text(row.firstName)} ${text(row.lastName)}`.trim() || 'Chưa cập nhật'}</strong><span className="text-xs text-slate-500">{text(row.email)}</span></div> },
    { key: 'phone', header: 'Điện thoại', accessor: 'phone', sortable: true },
    { key: 'deviceCount', header: 'Thiết bị', accessor: (row) => num(row.deviceCount), sortable: true },
    { key: 'serviceRequestCount', header: 'Lịch sử dịch vụ', accessor: (row) => num(row.serviceRequestCount), sortable: true },
    { key: 'lastServiceAt', header: 'Lần gần nhất', accessor: 'lastServiceAt', render: (row) => fmtDate(row.lastServiceAt), sortable: true },
    { key: 'action', header: '', render: (row) => <button onClick={() => openDrawer('device', { userId: text(row.id), customerName: `${text(row.firstName)} ${text(row.lastName)}`.trim(), customerPhone: text(row.phone), customerEmail: text(row.email) })} className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-black text-blue-700">Thêm thiết bị</button> },
  ], [openDrawer]);

  const technicianColumns = useMemo<AdminDataColumn<AnyRow>[]>(() => [
    { key: 'name', header: 'Kỹ thuật viên', accessor: 'name', sortable: true, render: (row) => <div><strong className="block text-slate-900">{text(row.name)}</strong><span className="text-xs text-slate-500">{text(row.id)} · {text(row.phone)}</span></div> },
    { key: 'status', header: 'Sẵn sàng', accessor: 'status', sortable: true, render: (row) => <Badge>{text(row.status)}</Badge> },
    { key: 'rating', header: 'Điểm', accessor: (row) => num(row.rating), sortable: true, render: (row) => `${num(row.rating).toFixed(1)} / 5` },
    { key: 'activeAssignments', header: 'Đang xử lý', accessor: (row) => num(row.activeAssignments), sortable: true },
    { key: 'nextScheduleAt', header: 'Lịch kế tiếp', accessor: 'nextScheduleAt', render: (row) => fmtDate(row.nextScheduleAt), sortable: true },
    { key: 'action', header: '', render: (row) => <button onClick={() => openDrawer('schedule', { technicianId: text(row.id), startAt: new Date().toISOString().slice(0, 16), endAt: new Date(Date.now() + 2 * 3600000).toISOString().slice(0, 16), scheduleType: 'WORK' })} className="rounded-xl border border-cyan-100 bg-cyan-50 px-3 py-2 text-xs font-black text-cyan-700">Thêm lịch</button> },
  ], [openDrawer]);

  const alertsColumns = useMemo<AdminDataColumn<AnyRow>[]>(() => [
    { key: 'id', header: 'Mã yêu cầu', accessor: 'id', sortable: true, render: (row) => <button onClick={() => openWorkspace(text(row.id))} className="font-black text-blue-700 hover:underline">{text(row.id)}</button> },
    { key: 'customerName', header: 'Khách hàng', accessor: 'customerName', sortable: true },
    { key: 'priority', header: 'Ưu tiên', accessor: 'priority', render: (row) => <Badge>{text(row.priority)}</Badge>, sortable: true },
    { key: 'workflowStatus', header: 'Trạng thái', accessor: 'workflowStatus', render: (row) => <Badge>{text(row.workflowStatus)}</Badge>, sortable: true },
    { key: 'breachStage', header: 'SLA', accessor: 'breachStage', render: (row) => row.breachStage ? <Badge>{text(row.breachStage)}</Badge> : <span className="text-emerald-600">Trong hạn</span> },
    { key: 'resolutionDueAt', header: 'Hạn hoàn thành', accessor: 'resolutionDueAt', render: (row) => fmtDate(row.resolutionDueAt), sortable: true },
  ], [openWorkspace]);

  const workspaceData = workspace.data;
  const request = workspaceData?.request;
  const tabs: Array<{ id: Tab; label: string; icon: LucideIcon }> = [
    { id: 'overview', label: 'Tổng quan', icon: Gauge },
    { id: 'customers', label: 'Khách hàng & thiết bị', icon: Users },
    { id: 'technicians', label: 'Kỹ thuật viên', icon: UserRound },
    { id: 'sla', label: 'SLA & cảnh báo', icon: AlertTriangle },
    { id: 'workspace', label: 'Điều phối công việc', icon: Wrench },
  ];
  const drawerTitles: Record<DrawerType, string> = {
    device: 'Thêm thiết bị khách hàng', schedule: 'Tạo lịch kỹ thuật viên', dispatch: 'Phân công / chuyển kỹ thuật viên', quote: 'Tạo báo giá', payment: 'Ghi nhận thanh toán', completion: 'Lập biên bản hoàn thành', warranty: 'Tạo hồ sơ bảo hành', note: 'Ghi chú nội bộ', reschedule: 'Hẹn lại lịch', sla: 'Thiết lập SLA',
  };

  return <div className="space-y-6 pb-12">
    <section className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-900 p-6 text-white shadow-xl sm:p-8"><div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">Phase 10 · Service Operations</p><h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Trung tâm điều phối Điện Lạnh 247</h1><p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">Theo dõi khách hàng, thiết bị, kỹ thuật viên, SLA, báo giá, thanh toán, biên bản hoàn thành và bảo hành trong một workspace thống nhất.</p></div><div className="flex flex-wrap gap-2"><button onClick={() => void evaluateSla().then(invalidate)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white/10 px-4 text-sm font-black backdrop-blur hover:bg-white/20"><RefreshCw className="h-4 w-4" />Đánh giá SLA</button><button onClick={() => openDrawer('device')} disabled={!canManage} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-black text-slate-950 disabled:opacity-40"><Plus className="h-4 w-4" />Thêm thiết bị</button></div></div></section>
    <nav className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm" aria-label="Phân hệ vận hành">{tabs.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setTab(id)} className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-black transition ${tab === id ? 'bg-slate-950 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}><Icon className="h-4 w-4" />{label}</button>)}</nav>
    {notice && <div className="flex items-start justify-between gap-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800"><span>{notice}</span><button onClick={() => setNotice(null)} aria-label="Đóng"><X className="h-4 w-4" /></button></div>}
    {tab === 'overview' && <><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Khách hàng" value={overview.data?.metrics.customers ?? '—'} icon={Users} /><MetricCard label="Thiết bị quản lý" value={overview.data?.metrics.devices ?? '—'} icon={Smartphone} tone="cyan" /><MetricCard label="Yêu cầu đang mở" value={overview.data?.metrics.activeRequests ?? '—'} icon={Wrench} tone="amber" /><MetricCard label="SLA quá hạn" value={overview.data?.metrics.breachedSla ?? '—'} icon={AlertTriangle} tone="red" /><MetricCard label="Kỹ thuật viên" value={overview.data?.metrics.technicians ?? '—'} icon={UserRound} /><MetricCard label="Báo giá chưa thu đủ" value={overview.data?.metrics.unpaidAcceptedQuotes ?? '—'} icon={WalletCards} tone="amber" /><MetricCard label="Bảo hành hiệu lực" value={overview.data?.metrics.activeWarranties ?? '—'} icon={ShieldCheck} tone="emerald" /><MetricCard label="Doanh thu dịch vụ 30 ngày" value={money.format(overview.data?.metrics.serviceRevenue30Days ?? 0)} icon={CreditCard} tone="emerald" /></div><AdminDataTable rows={slaAlerts.data ?? []} columns={alertsColumns} rowKey={(row) => text(row.id)} searchFields={['id', 'customerName', 'technicianName']} exportFileName="sla-alerts.csv" isLoading={slaAlerts.isLoading} emptyTitle="Không có cảnh báo SLA" /></>}
    {tab === 'customers' && <AdminDataTable rows={customers.data?.items ?? []} columns={customerColumns} rowKey={(row) => num(row.id)} searchFields={['email', 'phone', (row) => `${text(row.firstName)} ${text(row.lastName)}`]} exportFileName="customers-service-history.csv" isLoading={customers.isLoading} emptyTitle="Chưa có khách hàng" toolbar={<button onClick={() => openDrawer('device')} disabled={!canManage} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-black text-white disabled:opacity-40"><Plus className="h-4 w-4" />Thiết bị</button>} />}
    {tab === 'technicians' && <AdminDataTable rows={technicians.data?.items ?? []} columns={technicianColumns} rowKey={(row) => text(row.id)} searchFields={['id', 'name', 'phone', 'email']} filters={[{ key: 'status', label: 'Trạng thái', options: [{ label: 'Sẵn sàng', value: 'available' }, { label: 'Đang bận', value: 'busy' }, { label: 'Ngoại tuyến', value: 'offline' }], predicate: (row, value) => text(row.status) === value }]} exportFileName="technician-capacity.csv" isLoading={technicians.isLoading} />}
    {tab === 'sla' && <div className="grid gap-6 xl:grid-cols-[1fr_1.35fr]"><section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-wider text-blue-600">SLA policies</p><h2 className="mt-1 text-xl font-black text-slate-950">Cam kết theo ưu tiên</h2></div><button onClick={() => openDrawer('sla', { priority: 'medium', responseMinutes: '60', assignMinutes: '120', arrivalMinutes: '240', resolutionMinutes: '1440', warrantyResponseMinutes: '240' })} disabled={!canManage} className="rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-black text-white disabled:opacity-40">Thêm chính sách</button></div><div className="mt-5 space-y-3">{(slaPolicies.data ?? []).map((policy) => <article key={text(policy.id)} className="rounded-2xl border border-slate-100 bg-slate-50 p-4"><div className="flex items-center justify-between"><Badge>{text(policy.priority)}</Badge><span className="text-xs font-bold text-slate-500">{text(policy.serviceCategoryName) || 'Mặc định'}</span></div><div className="mt-4 grid grid-cols-2 gap-3 text-xs"><span>Phản hồi <strong className="block text-slate-900">{text(policy.responseMinutes)} phút</strong></span><span>Phân công <strong className="block text-slate-900">{text(policy.assignMinutes)} phút</strong></span><span>Có mặt <strong className="block text-slate-900">{text(policy.arrivalMinutes)} phút</strong></span><span>Hoàn thành <strong className="block text-slate-900">{text(policy.resolutionMinutes)} phút</strong></span></div></article>)}</div></section><AdminDataTable rows={slaAlerts.data ?? []} columns={alertsColumns} rowKey={(row) => text(row.id)} searchFields={['id', 'customerName']} exportFileName="sla-control.csv" /></div>}
    {tab === 'workspace' && <div className="space-y-5"><section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm"><label className="text-sm font-black text-slate-900">Mở workspace theo mã yêu cầu</label><div className="mt-3 flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={workspaceId} onChange={(event) => setWorkspaceId(event.target.value)} className={`${inputClass} pl-10`} placeholder="DL247-... hoặc SR-..." /></div><button onClick={() => workspaceId.trim() && setActiveRequestId(workspaceId.trim())} className="min-h-11 rounded-xl bg-blue-600 px-5 text-sm font-black text-white">Mở hồ sơ</button></div></section>{workspace.isLoading && <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center text-sm font-bold text-slate-500">Đang tải hồ sơ vận hành...</div>}{workspace.isError && <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm font-semibold text-red-700">{getApiErrorMessage(workspace.error)}</div>}{request && workspaceData && <WorkspaceView data={workspaceData} canManage={canManage} onAction={(value, defaults) => openDrawer(value, defaults)} />}</div>}
    {drawer && <Drawer title={drawerTitles[drawer]} onClose={() => setDrawer(null)}><OperationForm type={drawer} form={form} setForm={setForm} technicians={technicians.data?.items ?? []} quoteLines={quoteLines} setQuoteLines={setQuoteLines} error={mutation.isError ? getApiErrorMessage(mutation.error) : null} saving={mutation.isPending} onSubmit={() => mutation.mutate()} /></Drawer>}
  </div>;
}

function WorkspaceView({ data, canManage, onAction }: { data: OperationsWorkspace; canManage: boolean; onAction: (value: WorkspaceAction, defaults?: Record<string, string>) => void }) {
  const request = data.request;
  const latestAssignment = data.assignments[0];
  const latestQuote = data.quotes[0];
  const cards: Array<[string, unknown]> = [['Điện thoại', request.customerPhone], ['Địa chỉ', request.customerAddress], ['Khu vực', request.district], ['Kỹ thuật viên', latestAssignment?.technicianName || 'Chưa phân công']];
  return <div className="grid gap-5 xl:grid-cols-[1.45fr_0.9fr]"><div className="space-y-5"><section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap gap-2"><Badge>{text(request.workflowStatus)}</Badge><Badge>{text(request.priority)}</Badge>{data.sla?.breachStage ? <Badge>{text(data.sla.breachStage)}</Badge> : null}</div><h2 className="mt-4 text-2xl font-black text-slate-950">{text(request.id)} · {text(request.customerName)}</h2><p className="mt-2 text-sm leading-7 text-slate-600">{text(request.applianceType)} — {text(request.issueDescription)}</p></div><div className="text-right text-xs text-slate-500"><span className="block">Lịch mong muốn</span><strong className="mt-1 block text-sm text-slate-900">{text(request.preferredDate)} · {text(request.preferredTimeSlot)}</strong></div></div><div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{cards.map(([label, value]) => <div key={label} className="rounded-2xl bg-slate-50 p-4"><span className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</span><strong className="mt-2 block break-words text-sm text-slate-900">{text(value)}</strong></div>)}</div></section><section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><h3 className="text-lg font-black text-slate-950">Dòng thời gian & audit</h3><span className="text-xs font-bold text-slate-400">{data.timeline.length} sự kiện</span></div><div className="mt-5 space-y-4">{data.timeline.slice(0, 12).map((event) => <div key={text(event.id)} className="flex gap-3"><div className="mt-1 h-3 w-3 shrink-0 rounded-full bg-blue-500 ring-4 ring-blue-50" /><div><div className="flex flex-wrap items-center gap-2"><strong className="text-sm text-slate-900">{text(event.toStatus)}</strong><span className="text-xs text-slate-400">{fmtDate(event.createdAt)}</span></div><p className="mt-1 text-sm leading-6 text-slate-600">{text(event.note) || 'Cập nhật trạng thái'}</p></div></div>)}</div></section></div><aside className="space-y-5"><section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm"><h3 className="text-lg font-black text-slate-950">Thao tác điều phối</h3><div className="mt-4 grid gap-2"><ActionButton icon={UserRound} label={latestAssignment ? 'Chuyển kỹ thuật viên' : 'Phân công kỹ thuật viên'} onClick={() => onAction('dispatch', { scheduledStart: text(latestAssignment?.scheduledStart).slice(0, 16), scheduledEnd: text(latestAssignment?.scheduledEnd).slice(0, 16) })} disabled={!canManage} /><ActionButton icon={CalendarClock} label="Hẹn lại lịch" onClick={() => onAction('reschedule', { scheduledStart: text(latestAssignment?.scheduledStart).slice(0, 16), scheduledEnd: text(latestAssignment?.scheduledEnd).slice(0, 16) })} disabled={!canManage || !latestAssignment} /><ActionButton icon={ClipboardCheck} label="Tạo báo giá" onClick={() => onAction('quote')} disabled={!canManage} /><ActionButton icon={WalletCards} label="Ghi nhận thanh toán" onClick={() => onAction('payment', { quoteId: text(latestQuote?.id), amount: text(latestQuote?.totalAmount) })} disabled={!canManage} /><ActionButton icon={ClipboardCheck} label="Biên bản hoàn thành" onClick={() => onAction('completion', { completedAt: new Date().toISOString().slice(0, 16), customerName: text(request.customerName) })} disabled={!canManage} /><ActionButton icon={ShieldCheck} label="Tạo bảo hành" onClick={() => onAction('warranty', { startsAt: new Date().toISOString().slice(0, 16), endsAt: new Date(Date.now() + 180 * 86400000).toISOString().slice(0, 16), completionReportId: text(data.completion?.id), deviceId: text(data.device?.id) })} disabled={!canManage || !data.completion} /><ActionButton icon={Plus} label="Ghi chú nội bộ" onClick={() => onAction('note')} disabled={!canManage} /></div></section><section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm"><h3 className="text-sm font-black uppercase tracking-wider text-slate-500">Tài chính</h3><div className="mt-4 space-y-3"><div className="flex justify-between text-sm"><span>Báo giá mới nhất</span><strong>{latestQuote ? money.format(num(latestQuote.totalAmount)) : '—'}</strong></div><div className="flex justify-between text-sm"><span>Đã thanh toán</span><strong className="text-emerald-700">{money.format(data.payments.reduce((sum, item) => sum + num(item.amount), 0))}</strong></div><div className="flex justify-between text-sm"><span>Trạng thái</span><Badge>{text(request.paymentStatus)}</Badge></div></div></section></aside></div>;
}

function ActionButton({ icon: Icon, label, onClick, disabled }: { icon: LucideIcon; label: string; onClick: () => void; disabled?: boolean }) {
  return <button type="button" onClick={onClick} disabled={disabled} className="flex min-h-11 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 text-left text-sm font-black text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40"><Icon className="h-4 w-4" />{label}</button>;
}

function OperationForm({ type, form, setForm, technicians, quoteLines, setQuoteLines, error, saving, onSubmit }: { type: DrawerType; form: Record<string, string>; setForm: (value: Record<string, string>) => void; technicians: AnyRow[]; quoteLines: QuoteLine[]; setQuoteLines: (value: QuoteLine[]) => void; error: string | null; saving: boolean; onSubmit: () => void }) {
  const field = (name: string, label: string, inputType = 'text', required = false) => <label className="block"><span className="mb-1.5 block text-xs font-black text-slate-700">{label}{required ? ' *' : ''}</span><input type={inputType} value={form[name] ?? ''} onChange={(event) => setForm({ ...form, [name]: event.target.value })} className={inputClass} required={required} /></label>;
  const textarea = (name: string, label: string, required = false) => <label className="block"><span className="mb-1.5 block text-xs font-black text-slate-700">{label}{required ? ' *' : ''}</span><textarea value={form[name] ?? ''} onChange={(event) => setForm({ ...form, [name]: event.target.value })} className={`${inputClass} min-h-28 py-3`} required={required} /></label>;
  return <form onSubmit={(event) => { event.preventDefault(); onSubmit(); }} className="space-y-5">
    {type === 'device' && <div className="grid gap-4 sm:grid-cols-2">{field('customerName', 'Tên khách hàng', 'text', true)}{field('customerPhone', 'Số điện thoại', 'tel', true)}{field('customerEmail', 'Email', 'email')}{field('label', 'Tên gợi nhớ')}{field('applianceType', 'Loại thiết bị', 'text', true)}{field('brand', 'Thương hiệu')}{field('model', 'Model')}{field('serialNumber', 'Số serial')}{field('installationAddress', 'Địa chỉ lắp đặt')}{field('district', 'Khu vực')}{field('installedAt', 'Ngày lắp đặt', 'date')}{field('warrantyUntil', 'Bảo hành đến', 'date')}</div>}
    {type === 'schedule' && <div className="grid gap-4 sm:grid-cols-2"><TechnicianSelect technicians={technicians} form={form} setForm={setForm} />{field('startAt', 'Bắt đầu', 'datetime-local', true)}{field('endAt', 'Kết thúc', 'datetime-local', true)}{field('note', 'Ghi chú')}</div>}
    {type === 'dispatch' && <div className="grid gap-4 sm:grid-cols-2"><TechnicianSelect technicians={technicians} form={form} setForm={setForm} />{field('scheduledStart', 'Bắt đầu', 'datetime-local', true)}{field('scheduledEnd', 'Kết thúc', 'datetime-local', true)}<div className="sm:col-span-2">{textarea('reason', 'Lý do / ghi chú')}</div></div>}
    {type === 'reschedule' && <div className="grid gap-4 sm:grid-cols-2">{field('scheduledStart', 'Lịch bắt đầu mới', 'datetime-local', true)}{field('scheduledEnd', 'Lịch kết thúc mới', 'datetime-local', true)}<div className="sm:col-span-2">{textarea('reason', 'Lý do', true)}</div></div>}
    {type === 'note' && textarea('body', 'Nội dung ghi chú', true)}
    {type === 'quote' && <div className="space-y-4"><div className="space-y-3">{quoteLines.map((line, index) => <div key={`${index}-${line.lineType}`} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-[120px_1fr_90px_130px_40px]"><select value={line.lineType} onChange={(event) => setQuoteLines(quoteLines.map((item, i) => i === index ? { ...item, lineType: event.target.value } : item))} className={inputClass}><option value="LABOR">Tiền công</option><option value="MATERIAL">Vật tư</option></select><input value={line.description} onChange={(event) => setQuoteLines(quoteLines.map((item, i) => i === index ? { ...item, description: event.target.value } : item))} className={inputClass} placeholder="Mô tả" required /><input type="number" min="0.001" step="0.001" value={line.quantity} onChange={(event) => setQuoteLines(quoteLines.map((item, i) => i === index ? { ...item, quantity: event.target.value } : item))} className={inputClass} /><input type="number" min="0" step="1000" value={line.unitPrice} onChange={(event) => setQuoteLines(quoteLines.map((item, i) => i === index ? { ...item, unitPrice: event.target.value } : item))} className={inputClass} /><button type="button" onClick={() => setQuoteLines(quoteLines.filter((_, i) => i !== index))} className="flex h-11 w-10 items-center justify-center rounded-xl text-red-500 hover:bg-red-50" aria-label="Xóa dòng"><X className="h-4 w-4" /></button></div>)}</div><button type="button" onClick={() => setQuoteLines([...quoteLines, { lineType: 'MATERIAL', description: '', quantity: '1', unit: 'cái', unitPrice: '0' }])} className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-black text-blue-700">+ Thêm dòng</button><div className="grid gap-4 sm:grid-cols-3">{field('discountValue', 'Giá trị giảm', 'number')}{field('taxRate', 'Thuế (%)', 'number')}{field('validUntil', 'Hiệu lực đến', 'datetime-local')}</div>{textarea('notes', 'Ghi chú báo giá')}</div>}
    {type === 'payment' && <div className="grid gap-4 sm:grid-cols-2">{field('quoteId', 'ID báo giá', 'number')}{field('method', 'Phương thức', 'text', true)}{field('amount', 'Số tiền', 'number', true)}{field('transactionReference', 'Mã giao dịch')}{textarea('note', 'Ghi chú')}</div>}
    {type === 'completion' && <div className="space-y-4">{textarea('diagnosis', 'Chẩn đoán', true)}{textarea('workPerformed', 'Công việc thực hiện', true)}{textarea('recommendations', 'Khuyến nghị')}{field('customerName', 'Người xác nhận')}{field('completedAt', 'Thời điểm hoàn thành', 'datetime-local')}</div>}
    {type === 'warranty' && <div className="grid gap-4 sm:grid-cols-2">{field('completionReportId', 'ID biên bản', 'number')}{field('deviceId', 'ID thiết bị', 'number')}{field('startsAt', 'Bắt đầu', 'datetime-local', true)}{field('endsAt', 'Kết thúc', 'datetime-local', true)}<div className="sm:col-span-2">{textarea('coverage', 'Phạm vi bảo hành', true)}{textarea('exclusions', 'Loại trừ')}</div></div>}
    {type === 'sla' && <div className="grid gap-4 sm:grid-cols-2">{field('serviceCategoryId', 'Danh mục dịch vụ')}{field('priority', 'Mức ưu tiên', 'text', true)}{field('responseMinutes', 'Phản hồi (phút)', 'number', true)}{field('assignMinutes', 'Phân công (phút)', 'number', true)}{field('arrivalMinutes', 'Có mặt (phút)', 'number', true)}{field('resolutionMinutes', 'Hoàn thành (phút)', 'number', true)}{field('warrantyResponseMinutes', 'Bảo hành phản hồi (phút)', 'number', true)}</div>}
    {error && <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>}
    <button type="submit" disabled={saving} className="min-h-12 w-full rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 text-sm font-black text-white shadow-lg disabled:opacity-50">{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
  </form>;
}

function TechnicianSelect({ technicians, form, setForm }: { technicians: AnyRow[]; form: Record<string, string>; setForm: (value: Record<string, string>) => void }) {
  return <label className="block sm:col-span-2"><span className="mb-1.5 block text-xs font-black text-slate-700">Kỹ thuật viên *</span><select value={form.technicianId ?? ''} onChange={(event) => setForm({ ...form, technicianId: event.target.value })} className={inputClass} required><option value="">Chọn kỹ thuật viên</option>{technicians.map((item) => <option key={text(item.id)} value={text(item.id)}>{text(item.name)} · {text(item.status)} · {num(item.rating).toFixed(1)}★</option>)}</select></label>;
}
