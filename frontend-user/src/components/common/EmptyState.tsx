import React from 'react';
import { ShoppingBag } from 'lucide-react';
import Button from '../ui/Button';
import { useNavigate } from 'react-router-dom';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  actionLink?: string;
}

export default function EmptyState({
  icon = <ShoppingBag className="w-16 h-16 text-slate-305" />,
  title = 'Danh sách trống',
  description = 'Không tìm thấy dữ liệu nào phù hợp hoặc danh sách hiện tại đang trống.',
  actionText,
  onAction,
  actionLink,
}: EmptyStateProps) {
  const navigate = useNavigate();

  const handleAction = () => {
    if (onAction) {
      onAction();
    } else if (actionLink) {
      navigate(actionLink);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center text-center p-12 bg-white rounded-3xl border border-slate-100/80 shadow-sm max-w-md mx-auto my-6">
      <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 mb-8 leading-relaxed max-w-sm">
        {description}
      </p>
      {(actionText && (onAction || actionLink)) && (
        <Button variant="primary" onClick={handleAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
}
