import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import type { AxiosError } from 'axios';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import LoadingState from '../components/ui/LoadingState';
import EmptyState from '../components/ui/EmptyState';
import { Search, RotateCw, X } from 'lucide-react';
import type { ServiceRequest, ServiceCategory, ServiceRequestWithKey } from '../features/service-requests/types';
import ServiceRequestTable from '../features/service-requests/components/ServiceRequestTable';
import useDebouncedValue from '../hooks/useDebouncedValue';
import { DISTRICTS } from '../constants/areas';

export default function ServiceRequests() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [areaFilter, setAreaFilter] = useState('all');
  const [createdFrom, setCreatedFrom] = useState(''); const [createdTo, setCreatedTo] = useState('');
  const [scheduledFrom, setScheduledFrom] = useState(''); const [scheduledTo, setScheduledTo] = useState('');
  const [page, setPage] = useState(1); const limit = 10; const debouncedSearch = useDebouncedValue(searchText);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Helpers for date calculations (SLA)
  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getTomorrowStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Fetch service requests
  const { data, isLoading, error, refetch, isRefetching, dataUpdatedAt } = useQuery({
    queryKey: ['admin-service-requests', { page, limit, q: debouncedSearch, statusFilter, categoryFilter, areaFilter, createdFrom, createdTo, scheduledFrom, scheduledTo }],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, limit };
      if (debouncedSearch) params.q = debouncedSearch;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (categoryFilter !== 'all') params.serviceCategoryId = categoryFilter;
      if (areaFilter !== 'all') params.district = areaFilter;
      if (createdFrom) params.createdFrom = createdFrom; if (createdTo) params.createdTo = createdTo;
      if (scheduledFrom) params.scheduledFrom = scheduledFrom; if (scheduledTo) params.scheduledTo = scheduledTo;
      const res = await api.get('/admin/service-requests', { params });
      return res.data;
    },
    refetchInterval: 30000,
  });

  // Fetch service categories
  const { data: categoriesData } = useQuery({
    queryKey: ['service-categories'],
    queryFn: async () => {
      const res = await api.get('/service-categories');
      return res.data;
    },
  });

  // Mutation for quick confirming requests
  const confirmMutation = useMutation({
    mutationFn: async (id: string) => {
      setConfirmingId(id);
      return api.patch(`/admin/service-requests/${id}/status`, {
        status: 'confirmed',
        note: 'Xác nhận nhanh từ danh sách yêu cầu',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-service-requests'] });
      showToast('Xác nhận yêu cầu dịch vụ thành công!', 'success');
      setConfirmingId(null);
    },
    onError: (err: AxiosError<{ message?: string }>) => {
      showToast(err.response?.data?.message || 'Có lỗi xảy ra khi xác nhận yêu cầu', 'error');
      setConfirmingId(null);
    },
  });

  const categories: ServiceCategory[] = categoriesData?.data || [];
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  const requestsList: ServiceRequest[] = data?.data || [];
  const requestsWithKeys: ServiceRequestWithKey[] = requestsList.map((r) => ({
    ...r,
    key: r.id,
  }));

  const todayStr = getTodayStr();
  const tomorrowStr = getTomorrowStr();

  const total = Number(data?.meta?.total || 0);

  const handleConfirmRequest = (id: string) => {
    confirmMutation.mutate(id);
  };

  const handleAssignRequest = (id: string) => {
    navigate(`/service-requests/${id}`);
  };

  const handleDetailRequest = (id: string) => {
    navigate(`/service-requests/${id}`);
  };

  if (isLoading) {
    return <LoadingState message="Đang tải danh sách yêu cầu dịch vụ..." />;
  }

  if (error || !data?.success) {
    return (
      <EmptyState
        message="Lỗi kết nối dữ liệu"
        subMessage="Không thể tải danh sách yêu cầu dịch vụ. Vui lòng kiểm tra lại Mock API Server."
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">
            Yêu cầu dịch vụ sửa chữa
          </h1>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Hàng đợi điều phối theo thời gian thực · tự làm mới mỗi 30 giây
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

      {/* Filters Search Form Panel */}
      <Card className="p-4 shadow-sm border-slate-200/60">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="relative w-full">
            <Input
              placeholder="Tìm theo tên hoặc SĐT..."
              value={searchText}
              onChange={(e) => { setSearchText(e.target.value); setPage(1); }}
              className="pl-10 h-10 w-full bg-slate-50 border-slate-200"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          </div>
          <div>
            <Select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="h-10 w-full bg-slate-50 border-slate-200"
              options={[
                { value: 'all', label: 'Tất cả trạng thái' },
                { value: 'pending', label: 'Chờ xác nhận' },
                { value: 'confirmed', label: 'Đã xác nhận' },
                { value: 'assigned', label: 'Đã phân công' },
                { value: 'in_progress', label: 'Đang sửa chữa' },
                { value: 'cancelled', label: 'Đã hủy' },
                { value: 'completed', label: 'Hoàn thành' },
              ]}
            />
          </div>
          <div>
            <Select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              className="h-10 w-full bg-slate-50 border-slate-200"
              options={[
                { value: 'all', label: 'Tất cả loại dịch vụ' },
                ...categories.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
          </div>
          <Select value={areaFilter} onChange={(e) => { setAreaFilter(e.target.value); setPage(1); }} className="h-10 w-full bg-slate-50 border-slate-200" options={[{ value: 'all', label: 'Tất cả khu vực' }, ...DISTRICTS.map((area) => ({ value: area, label: area }))]} />
          <label className="text-xs font-semibold text-slate-600">Ngày tạo từ<Input type="date" aria-label="Ngày tạo từ" value={createdFrom} onChange={(e) => { setCreatedFrom(e.target.value); setPage(1); }} className="mt-1 h-10 bg-slate-50" /></label>
          <label className="text-xs font-semibold text-slate-600">Ngày tạo đến<Input type="date" aria-label="Ngày tạo đến" value={createdTo} onChange={(e) => { setCreatedTo(e.target.value); setPage(1); }} className="mt-1 h-10 bg-slate-50" /></label>
          <label className="text-xs font-semibold text-slate-600">Lịch hẹn từ<Input type="date" aria-label="Lịch hẹn từ" value={scheduledFrom} onChange={(e) => { setScheduledFrom(e.target.value); setPage(1); }} className="mt-1 h-10 bg-slate-50" /></label>
          <label className="text-xs font-semibold text-slate-600">Lịch hẹn đến<Input type="date" aria-label="Lịch hẹn đến" value={scheduledTo} onChange={(e) => { setScheduledTo(e.target.value); setPage(1); }} className="mt-1 h-10 bg-slate-50" /></label>
        </div>
        {(searchText || statusFilter !== 'all' || categoryFilter !== 'all' || areaFilter !== 'all' || createdFrom || createdTo || scheduledFrom || scheduledTo) && <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3"><p className="text-xs font-medium text-slate-500">Tìm thấy <strong className="text-slate-900">{total}</strong> yêu cầu phù hợp</p><button type="button" onClick={() => { setSearchText(''); setStatusFilter('all'); setCategoryFilter('all'); setAreaFilter('all'); setCreatedFrom(''); setCreatedTo(''); setScheduledFrom(''); setScheduledTo(''); }} className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800"><X className="h-3.5 w-3.5" />Xóa bộ lọc</button></div>}
      </Card>

      {/* Table List View */}
      <Card noPadding className="overflow-hidden shadow-sm border-slate-200/60">
        <ServiceRequestTable
          requests={requestsWithKeys}
          categoryMap={categoryMap}
          todayStr={todayStr}
          tomorrowStr={tomorrowStr}
          nowMs={dataUpdatedAt}
          isConfirming={confirmMutation.isPending}
          confirmingId={confirmingId}
          onConfirm={handleConfirmRequest}
          onAssign={handleAssignRequest}
          onDetail={handleDetailRequest}
          pagination={{ current: page, pageSize: limit, total, onChange: setPage }}
        />
      </Card>

      {/* Toast notifications */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold transition-all duration-300 page-fade-in ${
          toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
