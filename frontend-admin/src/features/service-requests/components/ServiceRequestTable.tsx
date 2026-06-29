import Table, { type TableColumn } from '../../../components/ui/Table';
import Badge from '../../../components/ui/Badge';
import { Eye } from 'lucide-react';
import type { ServiceRequestWithKey } from '../types';
import { formatServiceRequestId } from '../../../utils/format';
import ServiceRequestStatusBadge from './ServiceRequestStatusBadge';
import ServiceRequestPriorityBadge from './ServiceRequestPriorityBadge';
import ServiceRequestSlaBadge from './ServiceRequestSlaBadge';

interface ServiceRequestTableProps {
  requests: ServiceRequestWithKey[];
  categoryMap: Map<string, string>;
  todayStr: string;
  tomorrowStr: string;
  isConfirming: boolean;
  confirmingId: string | null;
  onConfirm: (id: string) => void;
  onAssign: (id: string) => void;
  onDetail: (id: string) => void;
}

export default function ServiceRequestTable({
  requests,
  categoryMap,
  todayStr,
  tomorrowStr,
  isConfirming,
  confirmingId,
  onConfirm,
  onAssign,
  onDetail
}: ServiceRequestTableProps) {
  const columns: TableColumn<ServiceRequestWithKey>[] = [
    {
      title: 'Mã yêu cầu',
      key: 'id',
      render: (row) => (
        <button
          className="font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer bg-transparent border-none p-0 text-left"
          onClick={() => onDetail(row.id)}
        >
          {formatServiceRequestId(row.id)}
        </button>
      ),
    },
    {
      title: 'Khách hàng',
      key: 'customer',
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-medium text-slate-900 leading-tight">{row.customerName}</span>
          <span className="text-xs text-slate-500 font-medium mt-0.5">{row.customerPhone}</span>
        </div>
      ),
    },
    {
      title: 'Dịch vụ',
      key: 'serviceCategory',
      render: (row) => (
        <span className="text-sm text-slate-700 font-medium">
          {categoryMap.get(row.serviceCategoryId) || row.serviceCategoryId}
        </span>
      ),
    },
    {
      title: 'Khu vực',
      key: 'district',
      render: (row) => (
        <Badge variant="info" pill>
          {row.district}
        </Badge>
      ),
    },
    {
      title: 'Ngày hẹn',
      key: 'preferredDate',
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-sm text-slate-800 font-medium">
            {new Date(row.preferredDate).toLocaleDateString('vi-VN')}
          </span>
          <span className="text-xs text-slate-500 font-medium mt-0.5">{row.preferredTimeSlot}</span>
        </div>
      ),
    },
    {
      title: 'Độ ưu tiên',
      key: 'priority',
      render: (row) => (
        <ServiceRequestPriorityBadge priority={row.priority || 'medium'} />
      ),
    },
    {
      title: 'Thợ phụ trách',
      key: 'technician',
      render: (row) => {
        return row.technician ? (
          <span className="text-sm font-semibold text-slate-800">{row.technician.name}</span>
        ) : (
          <span className="text-xs text-slate-400 italic font-semibold">Chưa gán thợ</span>
        );
      },
    },
    {
      title: 'SLA',
      key: 'sla',
      render: (row) => (
        <ServiceRequestSlaBadge
          preferredDate={row.preferredDate}
          status={row.status}
          todayStr={todayStr}
          tomorrowStr={tomorrowStr}
        />
      ),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (row) => <ServiceRequestStatusBadge status={row.status} />,
    },
    {
      title: 'Hành động nhanh',
      key: 'action',
      render: (row) => (
        <div className="flex items-center gap-1.5 justify-end">
          {row.status === 'pending' && (
            <button
              className="inline-flex h-7 items-center justify-center px-2.5 rounded-lg text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.97] transition-all cursor-pointer shadow-sm disabled:opacity-50 border-none shrink-0"
              disabled={isConfirming}
              onClick={(e) => {
                e.stopPropagation();
                onConfirm(row.id);
              }}
            >
              {isConfirming && confirmingId === row.id ? (
                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
              ) : null}
              Xác nhận
            </button>
          )}
          {!row.assignedTechnicianId && ['pending', 'confirmed'].includes(row.status) && (
            <button
              className="inline-flex h-7 items-center justify-center px-2.5 rounded-lg text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.97] transition-all cursor-pointer shadow-sm border-none shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onAssign(row.id);
              }}
            >
              Phân công
            </button>
          )}
          <button
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 bg-slate-100 hover:bg-slate-200 active:scale-[0.97] transition-all cursor-pointer border-none shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onDetail(row.id);
            }}
            title="Xem chi tiết"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={requests}
      emptyText="Không tìm thấy yêu cầu dịch vụ nào phù hợp"
    />
  );
}
