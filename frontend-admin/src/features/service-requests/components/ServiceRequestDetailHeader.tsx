import { ArrowLeft } from 'lucide-react';
import Badge from '../../../components/ui/Badge';
import { formatServiceRequestId } from '../../../utils/format';

const STATUS_VARIANT_MAP: Record<string, 'warning' | 'info' | 'primary' | 'neutral' | 'success'> = {
  pending: 'warning',
  confirmed: 'info',
  assigned: 'primary',
  cancelled: 'neutral',
  completed: 'success',
};

const STATUS_LABEL_MAP: Record<string, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  assigned: 'Đã phân công',
  cancelled: 'Đã hủy',
  completed: 'Hoàn thành',
};

interface ServiceRequestDetailHeaderProps {
  id: string;
  createdAt: string;
  status: string;
  onBack: () => void;
}

export default function ServiceRequestDetailHeader({
  id,
  createdAt,
  status,
  onBack
}: ServiceRequestDetailHeaderProps) {
  return (
    <div>
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-4 cursor-pointer bg-transparent border-none p-0"
      >
        <ArrowLeft className="w-4 h-4" />
        Quay lại danh sách
      </button>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">
            Yêu cầu {formatServiceRequestId(id)}
          </h1>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Tạo lúc {new Date(createdAt).toLocaleString('vi-VN')}
          </p>
        </div>
        <Badge variant={STATUS_VARIANT_MAP[status] || 'neutral'} pill dot>
          {STATUS_LABEL_MAP[status] || status}
        </Badge>
      </div>
    </div>
  );
}
