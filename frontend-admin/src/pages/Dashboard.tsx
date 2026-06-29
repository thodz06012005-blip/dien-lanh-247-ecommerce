import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import Card from '../components/ui/Card';
import Table, { type TableColumn } from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import LoadingState from '../components/ui/LoadingState';
import ErrorState from '../components/ui/EmptyState';
import { ShoppingBag, Users, DollarSign, ArrowUpRight, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DonutChart, MiniSparkline, ProgressList, SimpleBarChart, SimpleLineChart } from '../components/admin/DashboardCharts';

interface RecentOrder {
  key: string;
  orderNumber: string;
  customer: string;
  total: number;
  status: string;
  date: string;
}

interface DashboardOrder {
  id: string;
  code: string;
  status: string;
  total: number;
  createdAt: string;
  deliveredAt?: string;
}

interface DashboardProduct {
  id: string;
  name: string;
  sku: string;
  stock: number;
  lowStockThreshold: number;
  thumbnail: string;
}

export default function Dashboard() {
  // Fetch dashboard stats
  const { data: statsData, isLoading: isLoadingStats, error: errorStats } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const res = await api.get('/admin/dashboard');
      return res.data;
    },
    refetchInterval: 5000,
  });

  // Fetch orders for analytics
  const { data: ordersData } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const res = await api.get('/admin/orders');
      return res.data;
    }
  });

  // Fetch products for inventory
  const { data: productsData } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const res = await api.get('/admin/products');
      return res.data;
    }
  });

  const stats = statsData?.data;
  const orders: DashboardOrder[] = ordersData?.data || [];
  const products: DashboardProduct[] = productsData?.data || [];

  const columns: TableColumn<RecentOrder>[] = [
    {
      title: 'Mã đơn',
      key: 'orderNumber',
      render: (row) => (
        <span className="font-bold text-slate-900">{row.orderNumber}</span>
      ),
    },
    {
      title: 'Khách hàng',
      key: 'customer',
      dataIndex: 'customer',
    },
    {
      title: 'Tổng tiền',
      key: 'total',
      render: (row) => (
        <strong className="text-slate-950 font-bold">
          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(row.total)}
        </strong>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (row) => {
        const configs: Record<string, { label: string; variant: 'warning' | 'success' | 'danger' | 'info' | 'primary' | 'neutral' }> = {
          pending: { label: 'Chờ xác nhận', variant: 'warning' },
          confirmed: { label: 'Đã xác nhận', variant: 'info' },
          processing: { label: 'Đang xử lý', variant: 'primary' },
          shipping: { label: 'Đang giao hàng', variant: 'info' },
          delivered: { label: 'Đã giao hàng', variant: 'success' },
          cancelled: { label: 'Đã hủy', variant: 'danger' }
        };
        const cfg = configs[row.status] || { label: row.status, variant: 'neutral' as const };
        return <Badge variant={cfg.variant} pill dot>{cfg.label}</Badge>;
      },
    },
    {
      title: 'Ngày tạo',
      key: 'date',
      dataIndex: 'date',
    },
  ];

  if (isLoadingStats) {
    return <LoadingState message="Đang tải dữ liệu tổng quan..." />;
  }

  if (errorStats || !statsData?.success) {
    return (
      <ErrorState
        message="Lỗi kết nối dữ liệu"
        subMessage="Không thể tải dữ liệu tổng quan hệ thống. Vui lòng kiểm tra lại."
      />
    );
  }

  // --- Analytics Calculations ---

  // 1. Revenue 7 days
  const last7Days = Array.from({length: 7}).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });
  
  const revenueTrendData = last7Days.map(dateStr => {
    return orders.filter((o: DashboardOrder) => o.status === 'delivered' && o.deliveredAt && o.deliveredAt.startsWith(dateStr)).reduce((sum: number, o: DashboardOrder) => sum + o.total, 0);
  });
  const orderCount7Days = last7Days.map(dateStr => {
    return orders.filter((o: DashboardOrder) => o.createdAt && o.createdAt.startsWith(dateStr)).length;
  });
  
  const revenueTrendLabels = last7Days.map(dateStr => {
    const d = new Date(dateStr);
    return `T${d.getDay() === 0 ? 'CN' : d.getDay() + 1}`; // T2, T3...
  });

  // 2. Order Status Donut
  const statuses = [
    { key: 'pending', label: 'Chờ xác nhận', color: '#f59e0b' }, // amber-500
    { key: 'confirmed', label: 'Đã xác nhận', color: '#3b82f6' }, // blue-500
    { key: 'processing', label: 'Đang xử lý', color: '#8b5cf6' }, // violet-500
    { key: 'shipping', label: 'Đang giao', color: '#06b6d4' }, // cyan-500
    { key: 'delivered', label: 'Đã giao', color: '#10b981' }, // emerald-500
    { key: 'cancelled', label: 'Đã hủy', color: '#ef4444' }, // red-500
  ];
  
  const donutData = statuses.map(s => ({
    label: s.label,
    color: s.color,
    count: orders.filter((o: DashboardOrder) => o.status === s.key).length
  })).filter(d => d.count > 0);
  
  const totalDonut = donutData.reduce((sum, d) => sum + d.count, 0);

  // 3. Monthly Sales 6 Months
  const last6Months = Array.from({length: 6}).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  
  const monthlySalesData = last6Months.map(monthStr => {
    return orders.filter((o: DashboardOrder) => o.status === 'delivered' && o.deliveredAt && o.deliveredAt.startsWith(monthStr)).reduce((sum: number, o: DashboardOrder) => sum + o.total, 0);
  });
  const monthlySalesLabels = last6Months.map(monthStr => `T${monthStr.split('-')[1]}`);

  // 4. Low Stock Products
  const lowStockProducts = products
    .filter((p: DashboardProduct) => p.stock <= p.lowStockThreshold)
    .sort((a: DashboardProduct, b: DashboardProduct) => a.stock - b.stock)
    .slice(0, 5)
    .map((p: DashboardProduct) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      thumbnail: p.thumbnail,
      progress: p.stock,
      max: Math.max(10, p.stock * 2),
      isWarning: true,
      valueLabel: `Tồn: ${p.stock}`
    }));

  const todayStr = new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="flex flex-col gap-6 lg:gap-8 pb-10">
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">
          Tổng quan hệ thống
        </h1>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          Hôm nay, {todayStr}
        </p>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <Card className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md min-h-[104px] relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center gap-4 z-10">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
              <DollarSign className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Doanh thu hôm nay</span>
              <strong className="text-2xl font-bold text-slate-950 leading-tight">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats?.todayRevenue || 0)}
              </strong>
            </div>
          </div>
          <MiniSparkline data={revenueTrendData} color="blue" />
        </Card>

        <Card className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md min-h-[104px] relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center gap-4 z-10">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tổng đơn hàng</span>
              <div className="flex items-baseline gap-2">
                <strong className="text-2xl font-bold text-slate-950 leading-tight">{stats?.totalOrders || 0}</strong>
                <span className="text-xs text-slate-500 font-medium">({stats?.pendingOrders || 0} chờ XN)</span>
              </div>
            </div>
          </div>
          <MiniSparkline data={orderCount7Days} color="green" />
        </Card>

        <Card className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md min-h-[104px] relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center gap-4 z-10">
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Khách hàng mới</span>
              <strong className="text-2xl font-bold text-slate-950 leading-tight">{stats?.newCustomers || 0}</strong>
            </div>
          </div>
          <MiniSparkline data={[0, 2, 1, 3, 0, 5, stats?.newCustomers || 0]} color="purple" />
        </Card>

        <Card className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md min-h-[104px] relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center gap-4 z-10">
            <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center shrink-0">
              <Package className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sản phẩm</span>
              <div className="flex items-baseline gap-2">
                <strong className="text-2xl font-bold text-slate-950 leading-tight">{stats?.totalProducts || 0}</strong>
                <span className="text-xs text-slate-500 font-medium">({lowStockProducts.length} sắp hết)</span>
              </div>
            </div>
          </div>
          <MiniSparkline data={[10, 15, 12, 18, 14, 20, 17]} color="orange" />
        </Card>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend (Takes 2 columns on lg) */}
        <div className="lg:col-span-2">
          <SimpleLineChart data={revenueTrendData} labels={revenueTrendLabels} orderCounts={orderCount7Days} />
        </div>
        
        {/* Order Status Donut (Takes 1 column on lg) */}
        <div className="lg:col-span-1">
          <DonutChart data={donutData} total={totalDonut} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SimpleBarChart data={monthlySalesData} labels={monthlySalesLabels} />
        <ProgressList title="Sản phẩm sắp hết hàng" items={lowStockProducts} />
      </div>

      {/* Recent Orders table */}
      <Card 
        title="Đơn hàng gần đây" 
        noPadding 
        headerRight={
          <Link to="/orders" className="text-2xs font-extrabold text-primary-600 hover:text-primary-700 flex items-center gap-0.5 uppercase tracking-wide">
            Xem tất cả
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        }
      >
        <Table
          columns={columns}
          dataSource={(stats?.recentOrders || []).map((o: RecentOrder, idx: number) => ({ ...o, key: o.orderNumber || String(idx) }))}
          emptyText="Chưa có đơn hàng nào hôm nay."
        />
      </Card>
    </div>
  );
}
