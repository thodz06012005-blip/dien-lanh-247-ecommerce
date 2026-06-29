import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import type { ServiceRequest, ServiceCategory } from '../features/service-requests/types';
import type { Technician } from '../features/technicians/types';
import type { AxiosError } from 'axios';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import LoadingState from '../components/ui/LoadingState';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import clsx from 'clsx';
import ServiceRequestDetailHeader from '../features/service-requests/components/ServiceRequestDetailHeader';
import ServiceRequestCustomerCard from '../features/service-requests/components/ServiceRequestCustomerCard';
import ServiceRequestServiceCard from '../features/service-requests/components/ServiceRequestServiceCard';
import ServiceRequestTimeline from '../features/service-requests/components/ServiceRequestTimeline';
import TechnicianAssignPanel from '../features/service-requests/components/TechnicianAssignPanel';
import ServiceRequestStatusActions from '../features/service-requests/components/ServiceRequestStatusActions';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

export default function ServiceRequestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [isChangingTech, setIsChangingTech] = useState(false);
  const [selectedTechId, setSelectedTechId] = useState('');
  const [finalPrice, setFinalPrice] = useState('');

  // Custom toast & completed modal state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isConfirmCompletedModalOpen, setIsConfirmCompletedModalOpen] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('unpaid');
  const [modalError, setModalError] = useState('');

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch technicians
  const { data: techniciansData } = useQuery({
    queryKey: ['admin-technicians'],
    queryFn: async () => {
      const res = await api.get('/admin/technicians');
      return res.data;
    }
  });

  const techniciansList: Technician[] = techniciansData?.data || [];

  // Assign technician mutation
  const assignTechnician = useMutation({
    mutationFn: (techId: string) =>
      api.patch(`/admin/service-requests/${id}/assign-technician`, { technicianId: techId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-service-request', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-service-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-technicians'] });
      showToast('Phân công kỹ thuật viên thành công!', 'success');
      setIsChangingTech(false);
      setSelectedTechId('');
    },
    onError: (err: AxiosError<{ message?: string }>) => {
      showToast(err.response?.data?.message || 'Có lỗi xảy ra khi phân công kỹ thuật viên', 'error');
    },
  });

  // Fetch service request detail
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-service-request', id],
    queryFn: async () => {
      const res = await api.get(`/admin/service-requests/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  // Fetch service categories for name mapping
  const { data: categoriesData } = useQuery({
    queryKey: ['service-categories'],
    queryFn: async () => {
      const res = await api.get('/service-categories');
      return res.data;
    },
  });

  const categories: ServiceCategory[] = categoriesData?.data || [];
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  // Status update mutation
  const updateStatus = useMutation({
    mutationFn: (payload: { status: string; note: string; finalPrice?: number; paymentStatus?: string }) =>
      api.patch(`/admin/service-requests/${id}/status`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-service-request', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-service-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-technicians'] });
      showToast('Cập nhật trạng thái thành công!', 'success');
      setNewStatus('');
      setStatusNote('');
      setFinalPrice('');
      setModalError('');
      setIsConfirmCompletedModalOpen(false);
    },
    onError: (err: AxiosError<{ message?: string }>) => {
      const errMsg = err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái';
      if (isConfirmCompletedModalOpen) {
        setModalError(errMsg);
      } else {
        showToast(errMsg, 'error');
      }
    },
  });

  const handleUpdateStatus = () => {
    if (!newStatus) {
      showToast('Vui lòng chọn trạng thái mới', 'error');
      return;
    }
    const currentRequestObj: ServiceRequest | undefined = data?.data;
    if (newStatus === 'completed') {
      const estPrice = currentRequestObj?.estimatedPrice;
      setFinalPrice(estPrice && estPrice > 0 ? String(estPrice) : '');
      setPaymentStatus(currentRequestObj?.paymentStatus || 'unpaid');
      setStatusNote('');
      setModalError('');
      setIsConfirmCompletedModalOpen(true);
    } else {
      updateStatus.mutate({ status: newStatus, note: statusNote });
    }
  };

  const handleConfirmCompleted = () => {
    const priceVal = Number(finalPrice);
    if (!finalPrice || isNaN(priceVal) || priceVal <= 0) {
      setModalError('Chi phí thực tế phải lớn hơn 0');
      return;
    }
    setModalError('');
    updateStatus.mutate({
      status: 'completed',
      note: statusNote,
      finalPrice: priceVal,
      paymentStatus
    });
  };

  if (isLoading) {
    return <LoadingState message="Đang tải chi tiết yêu cầu dịch vụ..." />;
  }

  if (error || !data?.success) {
    return (
      <EmptyState
        message="Lỗi kết nối dữ liệu"
        subMessage="Không thể tải chi tiết yêu cầu dịch vụ. Vui lòng kiểm tra lại Mock API Server."
      />
    );
  }

  const request: ServiceRequest = data.data;

  return (
    <div className="flex flex-col gap-8">
      {/* Back button + Header */}
      <ServiceRequestDetailHeader
        id={request.id}
        createdAt={request.createdAt}
        status={request.status}
        onBack={() => navigate('/service-requests')}
      />

      {/* Grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* LEFT COLUMN (2/3 width) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Thông tin khách hàng */}
          <ServiceRequestCustomerCard
            customerName={request.customerName}
            customerPhone={request.customerPhone}
            customerAddress={request.customerAddress}
            district={request.district}
          />

          {/* Thông tin dịch vụ */}
          <ServiceRequestServiceCard
            serviceCategoryId={request.serviceCategoryId}
            categoryName={categoryMap.get(request.serviceCategoryId) || request.serviceCategoryId}
            applianceType={request.applianceType}
            issueDescription={request.issueDescription}
            preferredDate={request.preferredDate}
            preferredTimeSlot={request.preferredTimeSlot}
            note={request.note}
          />

          {/* Chi phí */}
          <Card title="Chi phí">
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <span className="text-slate-500 font-semibold">Giá ước tính:</span>
                <span className="font-bold text-slate-900">
                  {formatCurrency(request.estimatedPrice || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <span className="text-slate-500 font-semibold">Giá cuối cùng:</span>
                <span className="font-extrabold text-primary-600 text-base">
                  {formatCurrency(request.finalPrice || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-semibold">Thanh toán:</span>
                <Badge
                  variant={request.paymentStatus === 'paid' ? 'success' : 'warning'}
                  pill
                  dot
                >
                  {request.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                </Badge>
              </div>
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN (1/3 width) */}
        <div className="flex flex-col gap-6">
          {/* Cập nhật trạng thái */}
          <ServiceRequestStatusActions
            status={request.status}
            newStatus={newStatus}
            setNewStatus={setNewStatus}
            statusNote={statusNote}
            setStatusNote={setStatusNote}
            onUpdate={handleUpdateStatus}
            isPending={updateStatus.isPending}
          />

          {/* Kỹ thuật viên phụ trách */}
          <TechnicianAssignPanel
            request={request}
            techniciansList={techniciansList}
            isChangingTech={isChangingTech}
            setIsChangingTech={setIsChangingTech}
            selectedTechId={selectedTechId}
            setSelectedTechId={setSelectedTechId}
            onAssign={(techId) => assignTechnician.mutate(techId)}
            isAssigning={assignTechnician.isPending}
          />

          {/* Lịch sử trạng thái */}
          <ServiceRequestTimeline statusHistory={request.statusHistory} />
        </div>
      </div>

      {/* Completed confirmation modal */}
      <Modal
        title="Hoàn tất yêu cầu dịch vụ"
        isOpen={isConfirmCompletedModalOpen}
        onClose={() => {
          setIsConfirmCompletedModalOpen(false);
          setModalError('');
        }}
        size="sm"
      >
        <div className="flex flex-col gap-4">
          {!request.assignedTechnicianId && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-3.5 rounded-xl text-xs font-semibold leading-relaxed">
              Cảnh báo: Yêu cầu dịch vụ này chưa được phân công kỹ thuật viên phụ trách. Bạn không thể hoàn thành yêu cầu này.
            </div>
          )}

          {modalError && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-3.5 rounded-xl text-xs font-semibold leading-relaxed">
              {modalError}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-slate-700">Chi phí thực tế (VND) *</label>
            <input
              type="number"
              value={finalPrice}
              onChange={(e) => setFinalPrice(e.target.value)}
              placeholder="Nhập chi phí thực tế..."
              disabled={!request.assignedTechnicianId}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm transition-all focus:outline-none focus:ring-4 focus:border-primary-600 focus:ring-primary-500/10 hover:border-slate-300 disabled:bg-slate-50 disabled:text-slate-400"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-slate-700">Trạng thái thanh toán</label>
            <Select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              disabled={!request.assignedTechnicianId}
              options={[
                { value: 'unpaid', label: 'Chưa thanh toán' },
                { value: 'paid', label: 'Đã thanh toán' }
              ]}
              className="w-full"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-slate-700">Ghi chú hoàn tất</label>
            <textarea
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              placeholder="Nhập ghi chú hoàn tất..."
              rows={3}
              disabled={!request.assignedTechnicianId}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm transition-all focus:outline-none focus:ring-4 focus:border-primary-600 focus:ring-primary-500/10 hover:border-slate-300 resize-none disabled:bg-slate-50 disabled:text-slate-400"
            />
          </div>

          <div className="flex gap-3 justify-end mt-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsConfirmCompletedModalOpen(false);
                setModalError('');
              }}
              className="px-5 font-bold"
            >
              Hủy bỏ
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmCompleted}
              isLoading={updateStatus.isPending}
              disabled={!request.assignedTechnicianId || !finalPrice || Number(finalPrice) <= 0}
              className="px-5 font-bold"
            >
              Xác nhận hoàn tất
            </Button>
          </div>
        </div>
      </Modal>

      {/* Toast notifications */}
      {toast && (
        <div className={clsx(
          "fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold transition-all duration-300 page-fade-in",
          toast.type === 'success' ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"
        )}>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
