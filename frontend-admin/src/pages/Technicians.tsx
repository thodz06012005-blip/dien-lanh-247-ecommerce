import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import LoadingState from '../components/ui/LoadingState';
import EmptyState from '../components/ui/EmptyState';
import { Plus, Users, Briefcase, CheckCircle, AlertCircle } from 'lucide-react';
import type { Technician } from '../features/technicians/types';
import { AxiosError } from 'axios';
import { DISTRICT_OPTIONS } from '../constants/areas';
import TechnicianFilters from '../features/technicians/components/TechnicianFilters';
import TechnicianTable from '../features/technicians/components/TechnicianTable';
import TechnicianFormModal from '../features/technicians/components/TechnicianFormModal';

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

  // Fetch Technicians List
  const { data: techniciansData, isLoading, error } = useQuery({
    queryKey: ['admin-technicians'],
    queryFn: async () => {
      const res = await api.get('/admin/technicians');
      return res.data;
    }
  });

  const techniciansList = techniciansData?.data || [];

  // Filter List locally for responsiveness
  const filteredTechnicians = techniciansList.filter((tech: Technician) => {
    const matchesSearch = 
      (tech.name || '').toLowerCase().includes(searchText.toLowerCase()) ||
      (tech.phone || '').includes(searchText) ||
      (tech.email || '').toLowerCase().includes(searchText.toLowerCase());

    const matchesArea = selectedArea ? tech.workingAreas?.includes(selectedArea) : true;
    const matchesSkill = selectedSkill ? tech.skills?.includes(selectedSkill) : true;
    const matchesStatus = selectedStatus ? tech.status === selectedStatus : true;

    return matchesSearch && matchesArea && matchesSkill && matchesStatus;
  });

  // Calculate statistics
  const totalTechs = techniciansList.length;
  const availableTechs = techniciansList.filter((t: Technician) => t.status === 'available').length;
  const busyTechs = techniciansList.filter((t: Technician) => t.status === 'busy').length;
  const inactiveTechs = techniciansList.filter((t: Technician) => t.status === 'inactive').length;

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
        <Button onClick={handleOpenAddModal} className="shrink-0 flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold">
          <Plus className="w-4 h-4" />
          <span>Thêm thợ mới</span>
        </Button>
      </div>

      {/* KPI Stats Widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm border-slate-200/60 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Users className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tổng số thợ</span>
            <strong className="text-2xl font-bold text-slate-900 mt-1">{totalTechs}</strong>
          </div>
        </Card>
        <Card className="shadow-sm border-slate-200/60 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Thợ sẵn sàng</span>
            <strong className="text-2xl font-bold text-emerald-600 mt-1">{availableTechs}</strong>
          </div>
        </Card>
        <Card className="shadow-sm border-slate-200/60 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Briefcase className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Đang bận việc</span>
            <strong className="text-2xl font-bold text-amber-600 mt-1">{busyTechs}</strong>
          </div>
        </Card>
        <Card className="shadow-sm border-slate-200/60 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ngừng hoạt động</span>
            <strong className="text-2xl font-bold text-slate-600 mt-1">{inactiveTechs}</strong>
          </div>
        </Card>
      </div>

      {/* Filters Panel */}
      <Card className="shadow-sm border-slate-200/60 p-4">
        <TechnicianFilters
          searchText={searchText}
          onSearchChange={setSearchText}
          selectedArea={selectedArea}
          onAreaChange={setSelectedArea}
          selectedSkill={selectedSkill}
          onSkillChange={setSelectedSkill}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          skillsOptions={SKILLS_OPTIONS}
          districtOptions={DISTRICT_OPTIONS}
        />
      </Card>

      {/* Main Table Grid */}
      <Card noPadding className="overflow-hidden shadow-sm border-slate-200/60">
        <TechnicianTable
          technicians={filteredTechnicians}
          skillsOptions={SKILLS_OPTIONS}
          onEdit={handleOpenEditModal}
          onDelete={setDeleteConfirmId}
          onStatusChange={handleStatusChange}
        />
      </Card>

      {/* Form Dialog Modal */}
      {isModalOpen && (
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
        isOpen={deleteConfirmId !== null}
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
