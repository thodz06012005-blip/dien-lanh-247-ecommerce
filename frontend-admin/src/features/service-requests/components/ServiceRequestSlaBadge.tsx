import Badge from '../../../components/ui/Badge';

interface ServiceRequestSlaBadgeProps {
  preferredDate: string;
  status: string;
  todayStr: string;
  tomorrowStr: string;
}

export default function ServiceRequestSlaBadge({
  preferredDate,
  status,
  todayStr,
  tomorrowStr
}: ServiceRequestSlaBadgeProps) {
  if (status === 'completed' || status === 'cancelled') {
    return <span className="text-slate-400 font-medium text-xs">-</span>;
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
