import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingState from '../components/ui/LoadingState';
import EmptyState from '../components/ui/EmptyState';
import { RotateCw } from 'lucide-react';
import type { Order } from '../features/orders/types';
import OrderFilters from '../features/orders/components/OrderFilters';
import OrderTable from '../features/orders/components/OrderTable';
import OrderDetailModal from '../features/orders/components/OrderDetailModal';

export default function Orders() {
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

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
    onSuccess: (res: { data: { data: Order } }) => {
      showToast('Cập nhật trạng thái thành công', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      // Update detail modal state if it's open
      if (selectedOrder && selectedOrder.id === res.data.data.id) {
        setSelectedOrder(res.data.data);
      }
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      showToast(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái', 'error');
    }
  });

  const handleUpdateStatus = (params: { id: string; status?: string; paymentStatus?: string }) => {
    updateStatus.mutate(params);
  };

  const handleViewDetail = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  // Filtering orders locally
  const ordersList: Order[] = data?.data || [];

  const filteredOrders = ordersList.filter((o) => {
    const matchesSearch = 
      o.code.toLowerCase().includes(searchText.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchText.toLowerCase()) ||
      o.phone.includes(searchText);
      
    const matchesStatus = statusFilter === 'all' ? true : o.status === statusFilter;
    const matchesPaymentStatus = paymentStatusFilter === 'all' ? true : o.paymentStatus === paymentStatusFilter;
    
    return matchesSearch && matchesStatus && matchesPaymentStatus;
  });

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
        <OrderFilters
          searchText={searchText}
          onSearchChange={setSearchText}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          paymentStatusFilter={paymentStatusFilter}
          onPaymentStatusFilterChange={setPaymentStatusFilter}
        />
      </Card>

      <Card noPadding className="overflow-hidden shadow-sm border-slate-200/60">
        <OrderTable
          orders={filteredOrders}
          onUpdateStatus={handleUpdateStatus}
          onViewDetail={handleViewDetail}
        />
      </Card>

      {/* Detail Modal */}
      <OrderDetailModal
        order={selectedOrder}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedOrder(null);
        }}
      />

      {/* Toast notifications */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold transition-all duration-300 page-fade-in ${toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
