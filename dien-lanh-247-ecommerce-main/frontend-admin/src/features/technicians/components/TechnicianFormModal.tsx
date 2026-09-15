import { useState } from 'react';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import type { Technician } from '../types';

interface Option {
  value: string;
  label: string;
}

interface TechnicianFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingTech: Partial<Technician> | null;
  skillsOptions: Option[];
  districtOptions: Option[];
  statusOptions: Option[];
  isSaving: boolean;
  onSave: (payload: Partial<Technician>) => void;
}

export default function TechnicianFormModal({
  isOpen,
  onClose,
  editingTech,
  skillsOptions,
  districtOptions,
  statusOptions,
  isSaving,
  onSave
}: TechnicianFormModalProps) {
  // Form Field States
  const [formValues, setFormValues] = useState({
    name: editingTech?.name || '',
    phone: editingTech?.phone || '',
    email: editingTech?.email || '',
    avatar: editingTech?.avatar || '',
    rating: editingTech?.rating || 5.0,
    status: editingTech?.status || 'available',
  });

  const [selectedFormSkills, setSelectedFormSkills] = useState<string[]>(
    editingTech?.skills || []
  );
  const [selectedFormAreas, setSelectedFormAreas] = useState<string[]>(
    editingTech?.workingAreas || []
  );
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formValues.name.trim()) errors.name = 'Vui lòng nhập họ tên thợ';
    if (!formValues.phone.trim()) {
      errors.phone = 'Vui lòng nhập số điện thoại';
    } else if (!/^[0-9]{9,11}$/.test(formValues.phone.trim())) {
      errors.phone = 'Số điện thoại không hợp lệ (9-11 chữ số)';
    }
    
    if (selectedFormSkills.length === 0) {
      errors.skills = 'Vui lòng chọn ít nhất một kỹ năng';
    }
    if (selectedFormAreas.length === 0) {
      errors.workingAreas = 'Vui lòng chọn ít nhất một khu vực hoạt động';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = {
      ...formValues,
      skills: selectedFormSkills,
      workingAreas: selectedFormAreas,
    };

    onSave(payload);
  };

  const handleToggleSkill = (skillValue: string) => {
    setSelectedFormSkills(prev => 
      prev.includes(skillValue) ? prev.filter(s => s !== skillValue) : [...prev, skillValue]
    );
  };

  const handleToggleArea = (areaValue: string) => {
    setSelectedFormAreas(prev => 
      prev.includes(areaValue) ? prev.filter(a => a !== areaValue) : [...prev, areaValue]
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingTech ? 'Chỉnh sửa hồ sơ thợ' : 'Thêm thợ kỹ thuật mới'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Họ tên thợ kỹ thuật *"
            placeholder="Ví dụ: Nguyễn Văn Hùng"
            value={formValues.name}
            onChange={(e) => setFormValues(prev => ({ ...prev, name: e.target.value }))}
            error={formErrors.name}
          />
          <Input
            label="Số điện thoại *"
            placeholder="Ví dụ: 0981112222"
            value={formValues.phone}
            onChange={(e) => setFormValues(prev => ({ ...prev, phone: e.target.value }))}
            error={formErrors.phone}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Email liên hệ (nếu có)"
            placeholder="Ví dụ: hung.nv@gmail.com"
            type="email"
            value={formValues.email}
            onChange={(e) => setFormValues(prev => ({ ...prev, email: e.target.value }))}
          />
          <Select
            label="Trạng thái làm việc"
            value={formValues.status}
            onChange={(e) => setFormValues(prev => ({ ...prev, status: e.target.value as 'available' | 'busy' | 'offline' | 'inactive' }))}
            options={statusOptions}
          />
        </div>

        <Input
          label="Đường dẫn ảnh đại diện (avatar)"
          placeholder="Nhập URL ảnh (để trống sẽ tự động tạo placeholder)"
          value={formValues.avatar}
          onChange={(e) => setFormValues(prev => ({ ...prev, avatar: e.target.value }))}
        />

        {/* Checklist Kỹ năng */}
        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-semibold text-slate-800">
            Kỹ năng chuyên môn *
          </label>
          <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl max-h-40 overflow-y-auto">
            {skillsOptions.map(skill => {
              const checked = selectedFormSkills.includes(skill.value);
              return (
                <label key={skill.value} className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleToggleSkill(skill.value)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500/20 border-slate-300"
                  />
                  <span>{skill.label}</span>
                </label>
              );
            })}
          </div>
          {formErrors.skills && (
            <span className="text-[11px] font-bold text-red-500">{formErrors.skills}</span>
          )}
        </div>

        {/* Checklist Quận hoạt động */}
        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-semibold text-slate-800">
            Địa bàn hoạt động (Các quận phụ trách) *
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl max-h-40 overflow-y-auto">
            {districtOptions.map(district => {
              const checked = selectedFormAreas.includes(district.value);
              return (
                <label key={district.value} className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleToggleArea(district.value)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500/20 border-slate-300"
                  />
                  <span>{district.label}</span>
                </label>
              );
            })}
          </div>
          {formErrors.workingAreas && (
            <span className="text-[11px] font-bold text-red-500">{formErrors.workingAreas}</span>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-4 border-t border-slate-100 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="rounded-xl border-slate-200 text-slate-600"
          >
            Hủy
          </Button>
          <Button
            type="submit"
            className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center justify-center min-w-28"
            disabled={isSaving}
          >
            {isSaving ? 'Đang lưu...' : 'Lưu hồ sơ'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
