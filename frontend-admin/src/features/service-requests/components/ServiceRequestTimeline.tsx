import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import { Clock, CheckCircle2 } from 'lucide-react';

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

const UPDATER_LABEL_MAP: Record<string, string> = {
  customer: 'Khách hàng',
  admin: 'Quản trị viên',
  system: 'Hệ thống',
};

interface StatusHistoryEntry {
  status: string;
  updatedBy: string;
  note?: string;
  createdAt: string;
}

interface ServiceRequestTimelineProps {
  statusHistory?: StatusHistoryEntry[];
}

export default function ServiceRequestTimeline({ statusHistory }: ServiceRequestTimelineProps) {
  return (
    <Card title="Lịch sử trạng thái">
      {statusHistory && statusHistory.length > 0 ? (
        <div className="relative">
          {/* Vertical connecting line */}
          <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-slate-200" />

          <div className="flex flex-col gap-5">
            {statusHistory.map((entry, idx) => (
              <div key={idx} className="relative flex gap-3.5 pl-0">
                {/* Dot */}
                <div className="relative z-10 shrink-0 mt-0.5">
                  {idx === 0 ? (
                    <div className="w-4 h-4 rounded-full bg-primary-600 border-2 border-white shadow-md flex items-center justify-center">
                      <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                    </div>
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-slate-300 border-2 border-white shadow-sm" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pb-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant={STATUS_VARIANT_MAP[entry.status] || 'neutral'}
                      dot
                    >
                      {STATUS_LABEL_MAP[entry.status] || entry.status}
                    </Badge>
                    <span className="text-[10px] font-semibold text-slate-400">
                      {UPDATER_LABEL_MAP[entry.updatedBy] || entry.updatedBy}
                    </span>
                  </div>
                  {entry.note && (
                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                      {entry.note}
                    </p>
                  )}
                  <div className="flex items-center gap-1 mt-1.5 text-[10px] text-slate-400 font-medium">
                    <Clock className="w-3 h-3" />
                    {new Date(entry.createdAt).toLocaleString('vi-VN')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-400 text-center py-4">
          Chưa có lịch sử cập nhật
        </p>
      )}
    </Card>
  );
}
