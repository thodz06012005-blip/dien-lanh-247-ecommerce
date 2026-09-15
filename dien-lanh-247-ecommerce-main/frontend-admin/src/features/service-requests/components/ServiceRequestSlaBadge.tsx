import Badge from '../../../components/ui/Badge';

interface ServiceRequestSlaBadgeProps {
  preferredDate: string;
  status: string;
  todayStr: string;
  tomorrowStr: string;
  createdAt?: string;
  nowMs?: number;
}

export default function ServiceRequestSlaBadge({
  preferredDate,
  status,
  todayStr,
  tomorrowStr,
  createdAt,
  nowMs = 0
}: ServiceRequestSlaBadgeProps) {
  if (status === 'completed' || status === 'cancelled') {
    return <span className="text-slate-400 font-medium text-xs">-</span>;
  }
  if (status === 'pending' && createdAt) {
    const elapsedMinutes = Math.max(0, Math.floor((nowMs - new Date(createdAt).getTime()) / 60000));
    if (elapsedMinutes >= 30) return <Badge variant="danger" dot>Quá SLA {elapsedMinutes - 30}p</Badge>;
    if (elapsedMinutes >= 20) return <Badge variant="warning" dot>Còn {30 - elapsedMinutes}p</Badge>;
    return <Badge variant="info" dot>Còn {30 - elapsedMinutes}p</Badge>;
  }
  if (preferredDate < todayStr) {
    return <Badge variant="danger" dot>Quá hạn</Badge>;
  } else if (preferredDate === todayStr) {
    return <Badge variant="warning" dot>Hôm nay</Badge>;
  } else if (preferredDate === tomorrowStr) {
    return <Badge variant="info" dot>Sắp hạn</Badge>;
  } else {
    return <Badge variant="neutral" dot>Bình thường</Badge>;
  }
}
