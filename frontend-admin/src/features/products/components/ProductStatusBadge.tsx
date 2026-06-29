import Badge from '../../../components/ui/Badge';

interface ProductStatusBadgeProps {
  status: 'active' | 'hidden' | 'out_of_stock';
}

export default function ProductStatusBadge({ status }: ProductStatusBadgeProps) {
  if (status === 'active') return <Badge variant="success" dot>Hoạt động</Badge>;
  if (status === 'hidden') return <Badge variant="neutral" dot>Đang ẩn</Badge>;
  return <Badge variant="danger" dot>Hết hàng</Badge>;
}
