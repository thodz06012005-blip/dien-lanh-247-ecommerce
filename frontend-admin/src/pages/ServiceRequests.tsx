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
import { Search, RotateCw, AlertTriangle, Radio, X } from 'lucide-react';
import type { ServiceRequest, ServiceCategory, ServiceRequestWithKey } from '../features/service-requests/types';
import ServiceRequestFilterCards from '../features/service-requests/components/ServiceRequestFilterCards';
import ServiceRequestTable from '../features/service-requests/components/ServiceRequestTable';

export default function ServiceRequests() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [areaFilter, setAreaFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [activeQuickFilter, setActiveQuickFilter] = useState<string>('all');
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
    queryKey: ['admin-service-requests', categoryFilter],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (categoryFilter !== 'all') params.serviceCategoryId = categoryFilter;
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

  // Filter items for quick statistic cards count
  const pendingRequests = requestsList.filter((r) => r.status === 'pending');
  const unassignedRequests = requestsList.filter(
    (r) => r.status === 'confirmed' && !r.assignedTechnicianId
  );
  const upcomingRequests = requestsList.filter(
    (r) => r.status === 'assigned' && (r.preferredDate === todayStr || r.preferredDate === tomorrowStr)
  );
  const overdueRequests = requestsList.filter((r) => r.status === 'pending' && dataUpdatedAt - new Date(r.createdAt).getTime() > 30 * 60 * 1000);
  const areas = [...new Set(requestsList.map((request) => request.district))].sort();

  const handleStatusFilterChange = (val: string) => {
    setStatusFilter(val);
    setActiveQuickFilter('all'); // Reset quick filter when dropdown status changes
  };

  const handleQuickFilterClick = (id: string) => {
    if (activeQuickFilter === id) {
      setActiveQuickFilter('all');
    } else {
      setActiveQuickFilter(id);
      setStatusFilter('all');
    }
  };

  const filteredRequests = requestsWithKeys.filter((r) => {
    const matchesSearch =
      r.customerName.toLowerCase().includes(searchText.toLowerCase()) ||
      r.customerPhone.includes(searchText) ||
      r.id.toLowerCase().includes(searchText.toLowerCase());

    if (!matchesSearch) return false;

    // Quick Filter Card vs Status Dropdown filter
    if (activeQuickFilter !== 'all') {
      const matchesQuickFilter =
        (activeQuickFilter === 'pending' && r.status === 'pending') ||
        (activeQuickFilter === 'unassigned' && r.status === 'confirmed' && !r.assignedTechnicianId) ||
        (activeQuickFilter === 'upcoming' && ['assigned', 'in_progress'].includes(r.status) && (r.preferredDate === todayStr || r.preferredDate === tomorrowStr)) ||
        (activeQuickFilter === 'overdue' && r.status === 'pending' && dataUpdatedAt - new Date(r.createdAt).getTime() > 30 * 60 * 1000);
      if (!matchesQuickFilter) return false;
    } else if (statusFilter !== 'all') {
      if (r.status !== statusFilter) return false;
    }

    if (areaFilter !== 'all' && r.district !== areaFilter) return false;
    if (dateFrom && r.preferredDate < dateFrom) return false;
    if (dateTo && r.preferredDate > dateTo) return false;
    return true;
  });

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

      {overdueRequests.length > 0 && <button type="button" onClick={() => handleQuickFilterClick('overdue')} className="group flex items-center justify-between gap-4 rounded-2xl border border-red-200 bg-gradient-to-r from-red-50 to-orange-50 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><div className="flex items-center gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white shadow-md shadow-red-600/20"><AlertTriangle className="h-5 w-5" /></span><div><p className="font-bold text-red-950">{overdueRequests.length} yêu cầu đã quá SLA xác nhận 30 phút</p><p className="mt-0.5 text-sm text-red-700">Ưu tiên liên hệ ngay để không bỏ sót khách hàng.</p></div></div><span className="hidden items-center gap-2 text-sm font-bold text-red-700 sm:flex"><Radio className="h-4 w-4 animate-pulse" />Xem ngay</span></button>}

      {/* Quick Filter Cards */}
      <ServiceRequestFilterCards
        activeQuickFilter={activeQuickFilter}
        onQuickFilterChange={handleQuickFilterClick}
        pendingCount={pendingRequests.length}
        unassignedCount={unassignedRequests.length}
        upcomingCount={upcomingRequests.length}
        overdueCount={overdueRequests.length}
      />

      {/* Filters Search Form Panel */}
      <Card className="p-4 shadow-sm border-slate-200/60">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="relative w-full">
            <Input
              placeholder="Tìm theo tên hoặc SĐT..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="pl-10 h-10 w-full bg-slate-50 border-slate-200"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          </div>
          <div>
            <Select
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value)}
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
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-10 w-full bg-slate-50 border-slate-200"
              options={[
                { value: 'all', label: 'Tất cả loại dịch vụ' },
                ...categories.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
          </div>
          <Select value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)} className="h-10 w-full bg-slate-50 border-slate-200" options={[{ value: 'all', label: 'Tất cả khu vực' }, ...areas.map((area) => ({ value: area, label: area }))]} />
          <Input type="date" aria-label="Từ ngày" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-10 bg-slate-50" />
          <Input type="date" aria-label="Đến ngày" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-10 bg-slate-50" />
        </div>
        {(searchText || statusFilter !== 'all' || categoryFilter !== 'all' || areaFilter !== 'all' || dateFrom || dateTo || activeQuickFilter !== 'all') && <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3"><p className="text-xs font-medium text-slate-500">Tìm thấy <strong className="text-slate-900">{filteredRequests.length}</strong> yêu cầu phù hợp</p><button type="button" onClick={() => { setSearchText(''); setStatusFilter('all'); setCategoryFilter('all'); setAreaFilter('all'); setDateFrom(''); setDateTo(''); setActiveQuickFilter('all'); }} className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800"><X className="h-3.5 w-3.5" />Xóa bộ lọc</button></div>}
      </Card>

      {/* Table List View */}
      <Card noPadding className="overflow-hidden shadow-sm border-slate-200/60">
        <ServiceRequestTable
          requests={filteredRequests}
          categoryMap={categoryMap}
          todayStr={todayStr}
          tomorrowStr={tomorrowStr}
          nowMs={dataUpdatedAt}
          isConfirming={confirmMutation.isPending}
          confirmingId={confirmingId}
          onConfirm={handleConfirmRequest}
          onAssign={handleAssignRequest}
          onDetail={handleDetailRequest}
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
