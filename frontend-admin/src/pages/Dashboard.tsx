import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowUpRight,
  Banknote,
  Clock3,
  PackageSearch,
  ShoppingBag,
  UserRoundCheck,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import AdminDataTable, { type AdminDataColumn } from '@/components/admin/AdminDataTable';
import { DonutChart, MiniSparkline, SimpleLineChart } from '@/components/admin/DashboardCharts';
import Card from '@/components/ui/Card';
import ErrorState from '@/components/ui/EmptyState';
import LoadingState from '@/components/ui/LoadingState';
import api from '@/services/api';

interface DashboardSnapshot {
  generatedAt: string;
  kpis: {
    todayRevenue: number;
    totalOrders: number;
    pendingOrders: number;
    newCustomers: number;
    totalProducts: number;
    openServiceRequests: number;
    activeTechnicians: number;
    lowStockVariants: number;
  };
  charts: {
    revenue7d: Array<{ date: string; revenue: number; orders: number }>;
    orderStatus: Array<{ status: string; total: number }>;
    serviceStatus: Array<{ status: string; total: number }>;
  };
  attention: AttentionItem[];
  recentOrders: RecentOrder[];
  lowStock: Array<{ id: number; productId: number; name: string; sku: string; stock: number; thumbnail?: string | null }>;
}

interface AttentionItem {
  id: string;
  type: string;
  severity: 'critical' | 'warning';
  title: string;
  description: string;
  href: string;
  createdAt: string;
  dueAt?: string | null;
}

interface RecentOrder {
  key: string;
  id: number;
  orderNumber: string;
  customer: string;
  total: number;
  status: string;
  createdAt: string;
}

const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });
const orderStatusLabels: Record<string, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  PROCESSING: 'Đang xử lý',
  SHIPPED: 'Đang giao',
  DELIVERED: 'Đã giao',
  CANCELLED: 'Đã hủy',
  REFUNDED: 'Hoàn tiền',
};
const orderColors = ['#f59e0b', '#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#ef4444', '#64748b'];

export default function Dashboard() {
  const dashboardQuery = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => (await api.get('/admin/dashboard')).data.data as DashboardSnapshot,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  if (dashboardQuery.isLoading) return <LoadingState message="Đang tổng hợp dữ liệu vận hành..." />;
  if (dashboardQuery.isError || !dashboardQuery.data) {
    return <ErrorState message="Không thể tải Dashboard" subMessage="Snapshot vận hành chưa sẵn sàng. Hãy kiểm tra kết nối backend và quyền dashboard.view." />;
  }

  const data = dashboardQuery.data;
  const revenue = data.charts.revenue7d.map((item) => item.revenue);
  const orderCounts = data.charts.revenue7d.map((item) => item.orders);
  const labels = data.charts.revenue7d.map((item) => new Date(`${item.date}T00:00:00`).toLocaleDateString('vi-VN', { weekday: 'short' }));
  const orderDonut = data.charts.orderStatus.map((item, index) => ({
    label: orderStatusLabels[item.status] || item.status.replaceAll('_', ' '),
    count: item.total,
    color: orderColors[index % orderColors.length],
  }));
  const totalOrderStatus = orderDonut.reduce((sum, item) => sum + item.count, 0);
  const maxServiceStatus = Math.max(...data.charts.serviceStatus.map((item) => item.total), 1);

  const attentionColumns: AdminDataColumn<AttentionItem>[] = [
    {
      key: 'severity',
      header: 'Ưu tiên',
      accessor: 'severity',
      sortable: true,
      render: (item) => <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${item.severity === 'critical' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>{item.severity === 'critical' ? 'Khẩn' : 'Cần chú ý'}</span>,
    },
    {
      key: 'title',
      header: 'Công việc',
      accessor: 'title',
      sortable: true,
      render: (item) => <div><strong className="text-sm text-slate-950">{item.title}</strong><p className="mt-1 text-xs text-slate-500">{item.description}</p></div>,
    },
    { key: 'createdAt', header: 'Phát sinh', accessor: 'createdAt', sortable: true, render: (item) => new Date(item.createdAt).toLocaleString('vi-VN') },
    { key: 'action', header: 'Xử lý', align: 'right', render: (item) => <Link to={item.href} className="inline-flex items-center gap-1 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-black text-primary-700 hover:bg-blue-100">Mở <ArrowUpRight className="h-3.5 w-3.5" /></Link> },
  ];

  const recentOrderColumns: AdminDataColumn<RecentOrder>[] = [
    { key: 'orderNumber', header: 'Mã đơn', accessor: 'orderNumber', sortable: true, render: (order) => <strong className="font-mono text-sm text-slate-950">{order.orderNumber}</strong> },
    { key: 'customer', header: 'Khách hàng', accessor: 'customer', sortable: true },
    { key: 'status', header: 'Trạng thái', accessor: 'status', sortable: true, render: (order) => <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase text-slate-600">{orderStatusLabels[order.status.toUpperCase()] || order.status}</span> },
    { key: 'total', header: 'Tổng tiền', accessor: 'total', sortable: true, align: 'right', render: (order) => <strong className="text-primary-700">{currency.format(order.total)}</strong> },
  ];

  return (
    <div className="space-y-7 pb-12">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-black uppercase tracking-[0.2em] text-primary-600">Operations Command Center</p><h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Tổng quan hệ thống</h1><p className="mt-2 text-sm text-slate-500">Dữ liệu cập nhật lúc {new Date(data.generatedAt).toLocaleString('vi-VN')} · tự làm mới mỗi phút.</p></div>
        <button type="button" onClick={() => dashboardQuery.refetch()} className="inline-flex min-h-11 items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-600 hover:border-primary-200 hover:text-primary-700"><Clock3 className="h-4 w-4" />Cập nhật ngay</button>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={Banknote} label="Doanh thu hôm nay" value={currency.format(data.kpis.todayRevenue)} detail="Đơn đã giao trong ngày" trend={revenue} tone="blue" />
        <KpiCard icon={ShoppingBag} label="Tổng đơn hàng" value={String(data.kpis.totalOrders)} detail={`${data.kpis.pendingOrders} đơn chờ xác nhận`} trend={orderCounts} tone="green" />
        <KpiCard icon={Wrench} label="Yêu cầu đang mở" value={String(data.kpis.openServiceRequests)} detail="Cần tiếp tục điều phối" trend={data.charts.serviceStatus.map((item) => item.total)} tone="purple" />
        <KpiCard icon={PackageSearch} label="SKU tồn kho thấp" value={String(data.kpis.lowStockVariants)} detail={`${data.kpis.totalProducts} sản phẩm đang bán`} trend={data.lowStock.map((item) => item.stock)} tone="orange" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <MiniMetric icon={Users} label="Khách hàng mới hôm nay" value={data.kpis.newCustomers} />
        <MiniMetric icon={UserRoundCheck} label="Kỹ thuật viên hoạt động" value={data.kpis.activeTechnicians} />
        <MiniMetric icon={AlertTriangle} label="Công việc cần chú ý" value={data.attention.length} critical={data.attention.some((item) => item.severity === 'critical')} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.65fr_0.85fr]">
        <SimpleLineChart data={revenue} labels={labels} orderCounts={orderCounts} />
        <DonutChart data={orderDonut} total={totalOrderStatus} />
      </div>

      <Card title="Phân bố yêu cầu dịch vụ" subtitle="Theo trạng thái workflow hiện tại">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.charts.serviceStatus.map((item) => (
            <div key={item.status} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
              <div className="flex items-center justify-between gap-3"><span className="text-xs font-black uppercase tracking-wide text-slate-500">{item.status.replaceAll('_', ' ')}</span><strong className="text-lg text-slate-950">{item.total}</strong></div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400" style={{ width: `${Math.max(6, (item.total / maxServiceStatus) * 100)}%` }} /></div>
            </div>
          ))}
        </div>
      </Card>

      <section>
        <div className="mb-4"><h2 className="text-xl font-black text-slate-950">Công việc cần chú ý</h2><p className="mt-1 text-sm text-slate-500">Được tổng hợp từ yêu cầu khẩn, đơn chờ lâu và tồn kho thấp.</p></div>
        <AdminDataTable rows={data.attention} columns={attentionColumns} rowKey={(item) => item.id} searchFields={['title', 'description', 'type']} filters={[{ key: 'severity', label: 'Mức độ', options: [{ label: 'Khẩn', value: 'critical' }, { label: 'Cần chú ý', value: 'warning' }], predicate: (item, value) => item.severity === value }]} selectable exportFileName="admin-attention.csv" defaultPageSize={10} emptyTitle="Không có công việc tồn đọng" emptyDescription="Mọi hàng đợi quan trọng đã được xử lý." />
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between"><div><h2 className="text-xl font-black text-slate-950">Đơn hàng gần đây</h2><p className="mt-1 text-sm text-slate-500">Tám đơn mới nhất trong hệ thống.</p></div><Link to="/orders" className="text-sm font-black text-primary-700 hover:underline">Xem tất cả</Link></div>
        <AdminDataTable rows={data.recentOrders} columns={recentOrderColumns} rowKey={(order) => order.id} searchFields={['orderNumber', 'customer', 'status']} filters={[{ key: 'status', label: 'Trạng thái', options: Object.entries(orderStatusLabels).map(([value, label]) => ({ value: value.toLowerCase(), label })), predicate: (order, value) => order.status === value }]} exportFileName="recent-orders.csv" defaultPageSize={10} />
      </section>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, detail, trend, tone }: { icon: LucideIcon; label: string; value: string; detail: string; trend: number[]; tone: 'blue' | 'green' | 'purple' | 'orange' }) {
  const tones = { blue: 'bg-blue-50 text-blue-600', green: 'bg-emerald-50 text-emerald-600', purple: 'bg-violet-50 text-violet-600', orange: 'bg-orange-50 text-orange-600' };
  return <article className="relative min-h-36 overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"><div className="relative z-10 flex items-start gap-4"><div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${tones[tone]}`}><Icon className="h-6 w-6" /></div><div className="min-w-0"><span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{label}</span><strong className="mt-1 block truncate text-2xl font-black text-slate-950">{value}</strong><p className="mt-1 text-xs text-slate-500">{detail}</p></div></div><div className="absolute inset-x-0 bottom-0 h-12 opacity-70"><MiniSparkline data={trend.length ? trend : [0]} color={tone} /></div></article>;
}

function MiniMetric({ icon: Icon, label, value, critical = false }: { icon: LucideIcon; label: string; value: number; critical?: boolean }) {
  return <article className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className={`flex h-11 w-11 items-center justify-center rounded-xl ${critical ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'}`}><Icon className="h-5 w-5" /></div><div><strong className="block text-2xl font-black text-slate-950">{value}</strong><span className="text-xs font-bold text-slate-500">{label}</span></div></article>;
}
