import Table, { type TableColumn } from '../../../components/ui/Table';
import Select from '../../../components/ui/Select';
import { Eye } from 'lucide-react';
import type { Order } from '../types';

interface OrderTableProps {
  orders: Order[];
  onUpdateStatus: (params: { id: string; status?: string; paymentStatus?: string }) => void;
  onViewDetail: (order: Order) => void;
}

const getStatusBadgeVariant = (status: string): 'warning' | 'success' | 'danger' | 'info' | 'primary' | 'neutral' => {
  switch (status) {
    case 'delivered':
      return 'success';
    case 'pending':
      return 'warning';
    case 'confirmed':
      return 'info';
    case 'processing':
      return 'primary';
    case 'shipping':
      return 'info';
    case 'cancelled':
      return 'danger';
    default:
      return 'neutral';
  }
};

const getOrderNextStatuses = (status: string) => {
  switch (status) {
    case 'pending':
      return [
        { value: 'pending', label: 'Chờ XN' },
        { value: 'confirmed', label: 'Đã XN' },
        { value: 'cancelled', label: 'Đã hủy' }
      ];
    case 'confirmed':
      return [
        { value: 'confirmed', label: 'Đã XN' },
        { value: 'processing', label: 'Đang XL' },
        { value: 'cancelled', label: 'Đã hủy' }
      ];
    case 'processing':
      return [
        { value: 'processing', label: 'Đang XL' },
        { value: 'shipping', label: 'Đang giao' },
        { value: 'cancelled', label: 'Đã hủy' }
      ];
    case 'shipping':
      return [
        { value: 'shipping', label: 'Đang giao' },
        { value: 'delivered', label: 'Đã giao' }
      ];
    case 'delivered':
      return [{ value: 'delivered', label: 'Đã giao' }];
    case 'cancelled':
      return [{ value: 'cancelled', label: 'Đã hủy' }];
    default:
      return [];
  }
};

export default function OrderTable({
  orders,
  onUpdateStatus,
  onViewDetail
}: OrderTableProps) {
  const columns: TableColumn<Order>[] = [
    {
      title: 'Mã đơn',
      key: 'code',
      render: (row) => <strong className="text-blue-600 font-semibold">{row.code}</strong>
    },
    {
      title: 'Khách hàng',
      key: 'customer',
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-medium text-slate-900">{row.customerName}</span>
          <span className="text-xs text-slate-500">{row.phone}</span>
        </div>
      ),
    },
    {
      title: 'Ngày đặt',
      key: 'createdAt',
      render: (row) => new Date(row.createdAt).toLocaleString('vi-VN'),
    },
    {
      title: 'Tổng tiền',
      key: 'total',
      className: 'text-right font-semibold text-slate-900',
      render: (row) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(row.total || 0),
    },
    {
      title: 'Trạng thái ĐH',
      key: 'status',
      width: 170,
      render: (row) => {
        const badgeVariant = getStatusBadgeVariant(row.status);
        return (
          <div className="flex items-center gap-2 max-w-[150px]">
            <div className={`w-2 h-2 rounded-full shrink-0 ${badgeVariant === 'success' ? 'bg-emerald-500' : badgeVariant === 'warning' ? 'bg-amber-500' : badgeVariant === 'primary' ? 'bg-blue-500' : badgeVariant === 'danger' ? 'bg-red-500' : 'bg-cyan-500'}`} />
            <Select 
              value={row.status} 
              onChange={(e) => onUpdateStatus({ id: row.id, status: e.target.value })}
              className="h-8 rounded-lg text-xs bg-slate-50 border-slate-200 hover:bg-slate-100 transition-colors w-full"
              disabled={['delivered', 'cancelled'].includes(row.status)}
              options={getOrderNextStatuses(row.status)}
            />
          </div>
        );
      },
    },
    {
      title: 'Thanh toán',
      key: 'paymentStatus',
      width: 145,
      render: (row) => (
        <div className="flex items-center gap-2 max-w-[135px]">
          <div className={`w-2 h-2 rounded-full shrink-0 ${row.paymentStatus === 'paid' ? 'bg-emerald-500' : row.paymentStatus === 'unpaid' ? 'bg-amber-500' : row.paymentStatus === 'failed' ? 'bg-red-500' : 'bg-slate-400'}`} />
          <Select 
            value={row.paymentStatus} 
            onChange={(e) => onUpdateStatus({ id: row.id, paymentStatus: e.target.value })}
            className="h-8 rounded-lg text-xs bg-slate-50 border-slate-200 hover:bg-slate-100 transition-colors w-full"
            disabled={['cancelled'].includes(row.status)}
            options={[
              { value: 'unpaid', label: 'Chưa TT' },
              { value: 'paid', label: 'Đã TT' },
              { value: 'failed', label: 'Thất bại' },
              { value: 'refunded', label: 'Hoàn tiền' },
            ]}
          />
        </div>
      ),
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (row) => (
        <button 
          className="inline-flex h-8 items-center gap-1.5 px-3 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer shrink-0"
          onClick={() => onViewDetail(row)}
        >
          <Eye className="w-4 h-4 text-slate-500" />
          <span>Chi tiết</span>
        </button>
      ),
    },
  ];

  return (
    <Table 
      columns={columns} 
      dataSource={orders.map(o => ({ ...o, key: o.id }))} 
      emptyText="Không tìm thấy đơn hàng nào phù hợp"
    />
  );
}
