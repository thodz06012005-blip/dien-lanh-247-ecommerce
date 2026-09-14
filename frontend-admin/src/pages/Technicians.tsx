import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import LoadingState from '../components/ui/LoadingState';
import EmptyState from '../components/ui/EmptyState';
import { Plus } from 'lucide-react';
import type { Technician } from '../features/technicians/types';
import { AxiosError } from 'axios';
import { DISTRICT_OPTIONS } from '../constants/areas';
import TechnicianFilters from '../features/technicians/components/TechnicianFilters';
import TechnicianTable from '../features/technicians/components/TechnicianTable';
import TechnicianFormModal from '../features/technicians/components/TechnicianFormModal';
import { can } from '../auth/permissions';
import { useAdminAuthStore } from '../store/adminAuthStore';
import useDebouncedValue from '../hooks/useDebouncedValue';

// Standardized options
const SKILLS_OPTIONS = [
  { value: 'sua-dieu-hoa', label: 'Sửa điều hòa' },
  { value: 've-sinh-dieu-hoa', label: 'Vệ sinh điều hòa' },
  { value: 'lap-dat-dieu-hoa', label: 'Lắp đặt điều hòa' },
  { value: 'sua-tu-lanh', label: 'Sửa tủ lạnh' },
  { value: 'sua-may-giat', label: 'Sửa máy giặt' },
  { value: 'bao-tri-dinh-ky', label: 'Bảo trì định kỳ' }
];

const STATUS_OPTIONS = [
  { value: 'available', label: 'Sẵn sàng (Available)' },
  { value: 'busy', label: 'Đang bận (Busy)' },
  { value: 'offline', label: 'Ngoại tuyến (Offline)' },
  { value: 'inactive', label: 'Ngừng hoạt động (Inactive)' }
];

export default function Technicians() {
  const queryClient = useQueryClient();
  const role = useAdminAuthStore(state => state.admin?.role);
  const canManage = can(role, 'technicians.manage');
  const canDelete = can(role, 'technicians.delete');

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleStatusChange = async (techId: string, newStatus: string) => {
    try {
      await api.patch(`/admin/technicians/${techId}/status`, { status: newStatus });
      queryClient.invalidateQueries({ queryKey: ['admin-technicians'] });
      showToast('Cập nhật trạng thái thợ thành công', 'success');
    } catch (e: unknown) {
      const err = e as AxiosError<{ message?: string }>;
      showToast(err.response?.data?.message || 'Có lỗi xảy ra khi đổi trạng thái', 'error');
    }
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editingTech, setEditingTech] = useState<Partial<Technician> | null>(null);
  
  // Search & Filter state
  const [searchText, setSearchText] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [page, setPage] = useState(1); const limit = 10; const debouncedSearch = useDebouncedValue(searchText);

  // Fetch Technicians List
  const { data: techniciansData, isLoading, error } = useQuery({
    queryKey: ['admin-technicians', { page, limit, q: debouncedSearch, selectedArea, selectedSkill, selectedStatus }],
    queryFn: async () => {
      const res = await api.get('/admin/technicians', { params: { page, limit, q: debouncedSearch || undefined, workingArea: selectedArea || undefined, skill: selectedSkill || undefined, status: selectedStatus || undefined } });
      return res.data;
    }
  });

  const techniciansList = techniciansData?.data || [];

  const totalTechs = Number(techniciansData?.meta?.total || 0);

  // Mutation to Create or Update Technician
  const saveTechMutation = useMutation({
    mutationFn: async (payload: Partial<Technician>) => {
      if (editingTech?.id) {
        return api.patch(`/admin/technicians/${editingTech.id}`, payload);
      }
      return api.post('/admin/technicians', payload);
    },
    onSuccess: () => {
      showToast(editingTech?.id ? 'Cập nhật kỹ thuật viên thành công' : 'Thêm kỹ thuật viên thành công', 'success');
      setIsModalOpen(false);
      setEditingTech(null);
      queryClient.invalidateQueries({ queryKey: ['admin-technicians'] });
    },
    onError: (err: AxiosError<{ message?: string }>) => {
      showToast(err.response?.data?.message || 'Có lỗi xảy ra khi lưu kỹ thuật viên', 'error');
    }
  });

  // Mutation to Delete Technician
  const deleteTechMutation = useMutation({
    mutationFn: async ({ id, forceInactive }: { id: string; forceInactive: boolean }) => {
      return api.delete(`/admin/technicians/${id}?forceInactive=${forceInactive}`);
    },
    onSuccess: (res) => {
      showToast(res.data?.message || 'Thực hiện thao tác thành công', 'success');
      setDeleteConfirmId(null);
      queryClient.invalidateQueries({ queryKey: ['admin-technicians'] });
    },
    onError: (err: AxiosError<{ error?: string; message?: string }>) => {
      const message = err.response?.data?.message || 'Có lỗi xảy ra khi xóa kỹ thuật viên';
      showToast(message, 'error');
    }
  });

  const handleOpenAddModal = () => {
    setEditingTech(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (tech: Technician) => {
    setEditingTech(tech);
    setIsModalOpen(true);
  };

  const handleSaveSubmit = (payload: Partial<Technician>) => {
    saveTechMutation.mutate(payload);
  };

  const handleDelete = (id: string) => {
    deleteTechMutation.mutate({ id, forceInactive: false });
  };

  if (isLoading) {
    return <LoadingState message="Đang tải danh sách thợ kỹ thuật..." />;
  }

  if (error || !techniciansData?.success) {
    return (
      <EmptyState
        message="Lỗi kết nối dữ liệu"
        subMessage="Không thể tải dữ liệu thợ kỹ thuật từ Mock API Server."
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header and Add Button */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">
            Quản lý thợ kỹ thuật
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Quản lý hồ sơ, kỹ năng, khu vực hoạt động và trạng thái phân công của đội ngũ thợ sửa chữa.
          </p>
        </div>
        {canManage && <Button onClick={handleOpenAddModal} className="shrink-0 flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold">
          <Plus className="w-4 h-4" />
          <span>Thêm thợ mới</span>
        </Button>}
      </div>

      <p className="text-sm font-semibold text-slate-600">Tổng số kỹ thuật viên phù hợp: <strong className="text-slate-950">{totalTechs}</strong></p>

      {/* Filters Panel */}
      <Card className="shadow-sm border-slate-200/60 p-4">
        <TechnicianFilters
          searchText={searchText}
          onSearchChange={value => { setSearchText(value); setPage(1); }}
          selectedArea={selectedArea}
          onAreaChange={value => { setSelectedArea(value); setPage(1); }}
          selectedSkill={selectedSkill}
          onSkillChange={value => { setSelectedSkill(value); setPage(1); }}
          selectedStatus={selectedStatus}
          onStatusChange={value => { setSelectedStatus(value); setPage(1); }}
          skillsOptions={SKILLS_OPTIONS}
          districtOptions={DISTRICT_OPTIONS}
        />
      </Card>

      {/* Main Table Grid */}
      <Card noPadding className="overflow-hidden shadow-sm border-slate-200/60">
        <TechnicianTable
          technicians={techniciansList}
          skillsOptions={SKILLS_OPTIONS}
          onEdit={handleOpenEditModal}
          onDelete={setDeleteConfirmId}
          onStatusChange={handleStatusChange}
          canManage={canManage}
          canDelete={canDelete}
          pagination={{ current: page, pageSize: limit, total: totalTechs, onChange: setPage }}
        />
      </Card>

      {/* Form Dialog Modal */}
      {canManage && isModalOpen && (
        <TechnicianFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          editingTech={editingTech}
          skillsOptions={SKILLS_OPTIONS}
          districtOptions={DISTRICT_OPTIONS}
          statusOptions={STATUS_OPTIONS}
          isSaving={saveTechMutation.isPending}
          onSave={handleSaveSubmit}
        />
      )}

      {/* Delete Confirmation Modal Dialog */}
      <ConfirmDialog
        isOpen={canDelete && deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => {
          if (deleteConfirmId) {
            handleDelete(deleteConfirmId);
          }
        }}
        title="Xóa kỹ thuật viên"
        message="Bạn có chắc chắn muốn xóa hồ sơ thợ kỹ thuật này khỏi hệ thống không? Hành động này sẽ không thể hoàn tác."
        confirmText="Xác nhận xóa"
        cancelText="Hủy bỏ"
      />
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
