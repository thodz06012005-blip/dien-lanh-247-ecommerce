import Badge from '../../../components/ui/Badge';

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

interface ServiceRequestStatusBadgeProps {
  status: string;
}

export default function ServiceRequestStatusBadge({ status }: ServiceRequestStatusBadgeProps) {
  return (
    <Badge variant={STATUS_VARIANT_MAP[status] || 'neutral'} pill dot>
      {STATUS_LABEL_MAP[status] || status}
    </Badge>
  );
}
