import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { Search } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface TechnicianFiltersProps {
  searchText: string;
  onSearchChange: (val: string) => void;
  selectedArea: string;
  onAreaChange: (val: string) => void;
  selectedSkill: string;
  onSkillChange: (val: string) => void;
  selectedStatus: string;
  onStatusChange: (val: string) => void;
  skillsOptions: Option[];
  districtOptions: Option[];
}

export default function TechnicianFilters({
  searchText,
  onSearchChange,
  selectedArea,
  onAreaChange,
  selectedSkill,
  onSkillChange,
  selectedStatus,
  onStatusChange,
  skillsOptions,
  districtOptions
}: TechnicianFiltersProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="relative">
        <Input
          placeholder="Tìm thợ theo tên, SĐT..."
          value={searchText}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 h-10 bg-[#fafafa] border-slate-200 shadow-none rounded-xl"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
      </div>

      <Select
        value={selectedArea}
        onChange={(e) => onAreaChange(e.target.value)}
        options={[
          { label: 'Tất cả khu vực', value: '' },
          ...districtOptions
        ]}
        className="h-10 bg-[#fafafa] border-slate-200 shadow-none rounded-xl"
      />

      <Select
        value={selectedSkill}
        onChange={(e) => onSkillChange(e.target.value)}
        options={[
          { label: 'Tất cả chuyên môn', value: '' },
          ...skillsOptions
        ]}
        className="h-10 bg-[#fafafa] border-slate-200 shadow-none rounded-xl"
      />

      <Select
        value={selectedStatus}
        onChange={(e) => onStatusChange(e.target.value)}
        options={[
          { label: 'Tất cả trạng thái', value: '' },
          { label: 'Sẵn sàng', value: 'available' },
          { label: 'Đang bận', value: 'busy' },
          { label: 'Ngừng hoạt động', value: 'inactive' }
        ]}
        className="h-10 bg-[#fafafa] border-slate-200 shadow-none rounded-xl"
      />
    </div>
  );
}
