import { Inbox, type LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  message?: string;
  subMessage?: string;
  icon?: LucideIcon;
}

export default function EmptyState({
  message = 'Chưa có dữ liệu',
  subMessage = 'Dữ liệu sẽ hiển thị khi hệ thống được cập nhật.',
  icon: Icon = Inbox,
}: EmptyStateProps) {
  return (
    <div className="flex min-h-[180px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-center w-full">
      <Icon className="mb-3 h-8 w-8 text-slate-400" />
      <p className="text-sm font-semibold text-slate-700">{message}</p>
      <p className="mt-1 text-xs text-slate-500">{subMessage}</p>
    </div>
  );
}
