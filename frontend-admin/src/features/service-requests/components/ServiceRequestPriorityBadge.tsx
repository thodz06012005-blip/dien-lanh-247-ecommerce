import Badge from '../../../components/ui/Badge';

const variantMap: Record<string, 'neutral' | 'primary' | 'warning' | 'danger'> = {
  low: 'neutral',
  medium: 'primary',
  high: 'warning',
  urgent: 'danger',
};

const labelMap: Record<string, string> = {
  low: 'Thấp',
  medium: 'Thường',
  high: 'Cao',
  urgent: 'Khẩn cấp',
};

interface ServiceRequestPriorityBadgeProps {
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export default function ServiceRequestPriorityBadge({ priority }: ServiceRequestPriorityBadgeProps) {
  const p = priority || 'medium';
  return (
    <Badge variant={variantMap[p]} pill={p === 'urgent'}>
      {labelMap[p]}
    </Badge>
  );
}
