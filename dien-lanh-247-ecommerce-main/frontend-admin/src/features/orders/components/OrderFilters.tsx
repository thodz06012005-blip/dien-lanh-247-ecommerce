import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { Search } from 'lucide-react';

interface OrderFiltersProps {
  searchText: string;
  onSearchChange: (val: string) => void;
  statusFilter: string;
  onStatusFilterChange: (val: string) => void;
  paymentStatusFilter: string;
  onPaymentStatusFilterChange: (val: string) => void;
}

export default function OrderFilters({
  searchText,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  paymentStatusFilter,
  onPaymentStatusFilterChange
}: OrderFiltersProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
      <div className="relative w-full">
        <Input 
          placeholder="Tìm theo mã đơn, SĐT, tên khách..."
          value={searchText}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 h-10 w-full bg-slate-50 border-slate-200"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
      </div>
      <div>
        <Select 
          value={statusFilter} 
          onChange={(e) => onStatusFilterChange(e.target.value)}
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
          value={paymentStatusFilter} 
          onChange={(e) => onPaymentStatusFilterChange(e.target.value)}
          className="h-10 w-full bg-slate-50 border-slate-200"
          options={[
            { value: 'all', label: 'Tất cả thanh toán' },
            { value: 'unpaid', label: 'Chưa thanh toán' },
            { value: 'paid', label: 'Đã thanh toán' },
            { value: 'failed', label: 'Thất bại' },
            { value: 'refunded', label: 'Hoàn tiền' },
          ]}
        />
      </div>
    </div>
  );
}
