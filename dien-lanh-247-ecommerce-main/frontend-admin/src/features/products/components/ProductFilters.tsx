import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import { Search, Plus } from 'lucide-react';

interface ProductFiltersProps {
  searchText: string;
  onSearchChange: (val: string) => void;
  onAddClick: () => void;
}

export default function ProductFilters({ searchText, onSearchChange, onAddClick }: ProductFiltersProps) {
  return (
    <div className="flex items-center gap-3 w-full md:w-auto">
      <div className="relative flex-grow md:w-80">
        <Input
          placeholder="Tìm theo tên, SKU..."
          value={searchText}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 h-10 w-full bg-white shadow-sm border-slate-200"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
      </div>

      <Button
        variant="primary"
        leftIcon={<Plus className="w-4 h-4" />}
        onClick={onAddClick}
        className="rounded-xl flex-shrink-0 h-10 font-bold"
      >
        Thêm sản phẩm
      </Button>
    </div>
  );
}
