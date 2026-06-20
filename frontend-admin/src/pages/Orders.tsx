import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import Card from '../components/ui/Card';
import Table, { type TableColumn } from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import LoadingState from '../components/ui/LoadingState';
import EmptyState from '../components/ui/EmptyState';
import { Eye, Search, RotateCw } from 'lucide-react';

interface OrderItem {
  productId: string;
  name: string;
  sku: string;
  thumbnail: string;
  price: number;
  quantity: number;
  total: number;
}

interface OrderAddress {
  province: string;
  district: string;
  detail: string;
}

interface Order {
  key: string;
  id: string;
  code: string;
  customerName: string;
  phone: string;
  email?: string;
  address: OrderAddress;
  note?: string;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  deliveredAt?: string;
  cancelledAt?: string;
}

export default function Orders() {
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetch all orders
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const res = await api.get('/admin/orders');
      return res.data;
    }
  });

  // Status mutation
  const updateStatus = useMutation({
    mutationFn: async ({ id, status, paymentStatus }: { id: string; status?: string; paymentStatus?: string }) => {
      return api.patch(`/admin/orders/${id}/status`, { status, paymentStatus });
    },
    onSuccess: (res: any) => {
      alert('Cập nhật trạng thái thành công');
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      // Update detail modal state if it's open
      if (selectedOrder && selectedOrder.id === res.data.data.id) {
        setSelectedOrder(res.data.data);
      }
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái');
    }
  });

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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'Đã giao hàng';
      case 'pending':
        return 'Chờ xác nhận';
      case 'confirmed':
        return 'Đã xác nhận';
      case 'processing':
        return 'Đang xử lý';
      case 'shipping':
        return 'Đang giao hàng';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  const getPaymentStatusBadgeVariant = (status: string): 'warning' | 'success' | 'danger' | 'neutral' => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'failed':
        return 'danger';
      case 'refunded':
        return 'neutral';
      case 'unpaid':
      default:
        return 'warning';
    }
  };

  const getPaymentStatusLabel = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Đã thanh toán';
      case 'failed':
        return 'Thất bại';
      case 'refunded':
        return 'Đã hoàn tiền';
      case 'unpaid':
      default:
        return 'Chưa thanh toán';
    }
  };

  // Filtering orders locally
  const ordersList: Order[] = data?.data || [];
  
  // Ensure every order has a key property
  const ordersWithKeys = ordersList.map(o => ({
    ...o,
    key: o.id
  }));

  const filteredOrders = ordersWithKeys.filter((o) => {
    const matchesSearch = 
      o.code.toLowerCase().includes(searchText.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchText.toLowerCase()) ||
      o.phone.includes(searchText);
      
    const matchesStatus = statusFilter === 'all' ? true : o.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

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
      render: (row) => (
        <div className="flex items-center gap-2 max-w-[150px]">
          <div className={`w-2 h-2 rounded-full shrink-0 ${getStatusBadgeVariant(row.status) === 'success' ? 'bg-emerald-500' : getStatusBadgeVariant(row.status) === 'warning' ? 'bg-amber-500' : getStatusBadgeVariant(row.status) === 'primary' ? 'bg-blue-500' : getStatusBadgeVariant(row.status) === 'danger' ? 'bg-red-500' : 'bg-cyan-500'}`} />
          <Select 
            value={row.status} 
            onChange={(e) => updateStatus.mutate({ id: row.id, status: e.target.value })}
            className="h-8 rounded-lg text-xs bg-slate-50 border-slate-200 hover:bg-slate-100 transition-colors w-full"
            options={[
              { value: 'pending', label: 'Chờ XN' },
              { value: 'confirmed', label: 'Đã XN' },
              { value: 'processing', label: 'Đang XL' },
              { value: 'shipping', label: 'Đang giao' },
              { value: 'delivered', label: 'Đã giao' },
              { value: 'cancelled', label: 'Đã hủy' },
            ]}
          />
        </div>
      ),
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
            onChange={(e) => updateStatus.mutate({ id: row.id, paymentStatus: e.target.value })}
            className="h-8 rounded-lg text-xs bg-slate-50 border-slate-200 hover:bg-slate-100 transition-colors w-full"
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
          onClick={() => {
            setSelectedOrder(row);
            setIsDetailOpen(true);
          }}
        >
          <Eye className="w-4 h-4 text-slate-500" />
          <span>Chi tiết</span>
        </button>
      ),
    },
  ];

  if (isLoading) {
    return <LoadingState message="Đang tải danh sách đơn hàng..." />;
  }

  if (error || !data?.success) {
    return (
      <EmptyState
        message="Lỗi kết nối dữ liệu"
        subMessage="Không thể tải danh sách đơn hàng. Vui lòng kiểm tra lại Mock API Server."
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">Quản lý đơn hàng</h1>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Xử lý, cập nhật và theo dõi trạng thái đơn hàng của khách.
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          className="flex items-center gap-2 rounded-xl text-xs font-bold"
          onClick={() => refetch()}
          isLoading={isRefetching}
        >
          <RotateCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      <Card className="p-5 shadow-sm border-slate-200/60 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          <div className="relative w-full">
            <Input 
              placeholder="Tìm theo mã đơn, SĐT, tên khách..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="pl-10 h-10 w-full bg-slate-50 border-slate-200"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          </div>
          <div>
            <Select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 w-full bg-slate-50 border-slate-200"
              options={[
                { value: 'all', label: 'Tất cả trạng thái ĐH' },
                { value: 'pending', label: 'Chờ xác nhận' },
                { value: 'confirmed', label: 'Đã xác nhận' },
                { value: 'processing', label: 'Đang xử lý' },
                { value: 'shipping', label: 'Đang giao hàng' },
                { value: 'delivered', label: 'Đã giao hàng' },
                { value: 'cancelled', label: 'Đã hủy' },
              ]}
            />
          </div>
          <div>
             <Select 
              value="" 
              onChange={() => {}}
              className="h-10 w-full bg-slate-50 border-slate-200 opacity-60 pointer-events-none"
              options={[
                { value: '', label: 'Tất cả thanh toán' },
              ]}
              title="Tính năng lọc theo thanh toán chưa khả dụng"
            />
          </div>
        </div>
      </Card>

      <Card noPadding className="overflow-hidden shadow-sm border-slate-200/60">
        <Table 
          columns={columns} 
          dataSource={filteredOrders} 
          emptyText="Không tìm thấy đơn hàng nào phù hợp"
        />
      </Card>

      {/* Detail Modal */}
      <Modal
        title={`Chi tiết đơn hàng ${selectedOrder?.code}`}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedOrder(null);
        }}
        size="lg"
      >
        {selectedOrder && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5">
                <h3 className="font-extrabold text-slate-900 text-[11px] mb-4 uppercase tracking-widest flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-primary-500 rounded-full"></div>
                  Thông tin giao hàng
                </h3>
                <div className="text-xs text-slate-650 flex flex-col gap-3">
                  <div className="flex justify-between items-start border-b border-slate-200/50 pb-2">
                    <strong className="text-slate-500 font-bold shrink-0 w-24">Người nhận:</strong>
                    <span className="font-extrabold text-slate-800 text-right">{selectedOrder.customerName}</span>
                  </div>
                  <div className="flex justify-between items-start border-b border-slate-200/50 pb-2">
                    <strong className="text-slate-500 font-bold shrink-0 w-24">Điện thoại:</strong>
                    <span className="font-bold text-slate-700 text-right">{selectedOrder.phone}</span>
                  </div>
                  <div className="flex justify-between items-start border-b border-slate-200/50 pb-2">
                    <strong className="text-slate-500 font-bold shrink-0 w-24">Email:</strong>
                    <span className="font-bold text-slate-700 text-right">{selectedOrder.email || '—'}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <strong className="text-slate-500 font-bold shrink-0 w-24">Địa chỉ:</strong>
                    <span className="font-bold text-slate-700 text-right leading-relaxed">
                      {selectedOrder.address.detail}<br/>{selectedOrder.address.district}, {selectedOrder.address.province}
                    </span>
                  </div>
                  {selectedOrder.note && (
                    <div className="bg-amber-100/50 border border-amber-200/60 p-3 rounded-xl mt-2">
                      <strong className="text-amber-800 block text-[10px] uppercase font-bold tracking-widest mb-1">
                        Ghi chú khách hàng
                      </strong>
                      <span className="text-amber-900 font-medium text-xs italic">
                        "{selectedOrder.note}"
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5">
                <h3 className="font-extrabold text-slate-900 text-[11px] mb-4 uppercase tracking-widest flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-cyan-500 rounded-full"></div>
                  Trạng thái & Thanh toán
                </h3>
                <div className="flex flex-col gap-4 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-bold">Trạng thái đơn:</span>
                    <Badge variant={getStatusBadgeVariant(selectedOrder.status)} pill dot>
                      {getStatusLabel(selectedOrder.status)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-200/50 pt-3">
                    <span className="text-slate-500 font-bold">Thanh toán:</span>
                    <Badge variant={getPaymentStatusBadgeVariant(selectedOrder.paymentStatus)} pill>
                      {getPaymentStatusLabel(selectedOrder.paymentStatus)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-200/50 pt-3">
                    <span className="text-slate-500 font-bold">Phương thức:</span>
                    <span className="font-extrabold text-slate-800 uppercase text-xs">{selectedOrder.paymentMethod}</span>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-3 text-[10px] text-slate-500 font-bold flex flex-col gap-1.5 mt-2 shadow-sm">
                    <div className="flex justify-between">
                      <span>Ngày đặt:</span>
                      <span className="text-slate-800">{new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}</span>
                    </div>
                    {selectedOrder.deliveredAt && (
                      <div className="flex justify-between text-emerald-600 border-t border-slate-100 pt-1.5">
                        <span>Ngày giao:</span>
                        <span>{new Date(selectedOrder.deliveredAt).toLocaleString('vi-VN')}</span>
                      </div>
                    )}
                    {selectedOrder.cancelledAt && (
                      <div className="flex justify-between text-red-500 border-t border-slate-100 pt-1.5">
                        <span>Ngày hủy:</span>
                        <span>{new Date(selectedOrder.cancelledAt).toLocaleString('vi-VN')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-extrabold text-slate-900 text-xs mb-3.5 uppercase tracking-wider border-b border-slate-100 pb-2">
                Sản phẩm đã mua
              </h3>
              <div className="overflow-x-auto border border-slate-100 rounded-2xl bg-white shadow-inner">
                <table className="min-w-full divide-y divide-slate-100 table-auto">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-3xs font-extrabold text-slate-400 uppercase tracking-widest">
                        Ảnh
                      </th>
                      <th className="px-4 py-3 text-left text-3xs font-extrabold text-slate-400 uppercase tracking-widest">
                        Tên sản phẩm
                      </th>
                      <th className="px-4 py-3 text-right text-3xs font-extrabold text-slate-400 uppercase tracking-widest">
                        Đơn giá
                      </th>
                      <th className="px-4 py-3 text-center text-3xs font-extrabold text-slate-400 uppercase tracking-widest">
                        SL
                      </th>
                      <th className="px-4 py-3 text-right text-3xs font-extrabold text-slate-400 uppercase tracking-widest">
                        Thành tiền
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 bg-white text-3xs text-slate-600 font-semibold">
                    {selectedOrder.items.map((item, idx) => (
                      <tr key={item.productId || idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <img
                            src={item.thumbnail}
                            alt={item.name}
                            className="w-10 h-10 object-cover rounded-lg border border-slate-100"
                          />
                        </td>
                        <td className="px-4 py-3 max-w-[200px] truncate">
                          <div className="font-extrabold text-slate-800 truncate" title={item.name}>
                            {item.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-bold mt-0.5">SKU: {item.sku}</div>
                        </td>
                        <td className="px-4 py-3 text-right font-bold">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}
                        </td>
                        <td className="px-4 py-3 text-center font-bold">{item.quantity}</td>
                        <td className="px-4 py-3 text-right font-black text-slate-900">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <div className="w-72 bg-slate-50 p-4.5 rounded-2xl border border-slate-100 flex flex-col gap-2.5 text-3xs font-bold text-slate-600">
                <div className="flex justify-between">
                  <span>Tạm tính:</span>
                  <span className="text-slate-800">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedOrder.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Phí giao hàng:</span>
                  <span className="text-slate-800">
                    +{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedOrder.shippingFee)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Giảm giá voucher:</span>
                  <span className="text-red-500 font-extrabold">
                    -{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedOrder.discount)}
                  </span>
                </div>
                <hr className="border-slate-200/60 my-1" />
                <div className="flex justify-between text-xs font-black text-slate-900">
                  <span>Tổng thanh toán:</span>
                  <span className="text-primary-600">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedOrder.total)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={() => setIsDetailOpen(false)} variant="primary">
                Đóng
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
