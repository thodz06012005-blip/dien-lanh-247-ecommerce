import { AlertCircle, UserX, Calendar, Clock, Check, ArrowRight } from 'lucide-react';
import clsx from 'clsx';

interface ServiceRequestFilterCardsProps {
  activeQuickFilter: string;
  onQuickFilterChange: (id: string) => void;
  pendingCount: number;
  unassignedCount: number;
  upcomingCount: number;
  overdueCount: number;
}

export default function ServiceRequestFilterCards({
  activeQuickFilter,
  onQuickFilterChange,
  pendingCount,
  unassignedCount,
  upcomingCount,
  overdueCount
}: ServiceRequestFilterCardsProps) {
  const quickFilters = [
    {
      id: 'pending',
      label: 'Chờ xác nhận',
      count: pendingCount,
      icon: <AlertCircle className="w-5 h-5 text-amber-500 animate-pulse" />,
      bgColor: 'bg-amber-50/50 border-amber-200/80 hover:bg-amber-50',
      textColor: 'text-amber-800',
      accentColor: 'bg-amber-500',
    },
    {
      id: 'unassigned',
      label: 'Chưa phân công',
      count: unassignedCount,
      icon: <UserX className="w-5 h-5 text-blue-500" />,
      bgColor: 'bg-blue-50/50 border-blue-200/80 hover:bg-blue-50',
      textColor: 'text-blue-800',
      accentColor: 'bg-blue-500',
    },
    {
      id: 'upcoming',
      label: 'Sắp đến lịch',
      count: upcomingCount,
      icon: <Calendar className="w-5 h-5 text-emerald-500" />,
      bgColor: 'bg-emerald-50/50 border-emerald-200/80 hover:bg-emerald-50',
      textColor: 'text-emerald-800',
      accentColor: 'bg-emerald-500',
    },
    {
      id: 'overdue',
      label: 'Đã trễ hẹn',
      count: overdueCount,
      icon: <Clock className="w-5 h-5 text-rose-500" />,
      bgColor: 'bg-rose-50/50 border-rose-200/80 hover:bg-rose-50',
      textColor: 'text-rose-800',
      accentColor: 'bg-rose-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {quickFilters.map((filter) => {
        const isActive = activeQuickFilter === filter.id;
        return (
          <div
            key={filter.id}
            onClick={() => onQuickFilterChange(filter.id)}
            className={clsx(
              'flex items-center justify-between p-4.5 rounded-2xl border cursor-pointer transition-all duration-300 relative overflow-hidden select-none',
              filter.bgColor,
              isActive 
                ? 'ring-2 ring-primary-600 border-transparent shadow-lg transform scale-[1.02] -translate-y-0.5' 
                : 'shadow-sm border-slate-200/60 hover:-translate-y-0.5'
            )}
          >
            <div className={clsx(
              'absolute left-0 top-0 bottom-0 w-1.5 transition-all duration-300',
              isActive ? filter.accentColor : 'bg-transparent'
            )} />
            
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center shrink-0">
                {filter.icon}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-500">{filter.label}</span>
                <strong className={clsx("text-lg font-bold tracking-tight mt-0.5 leading-none", filter.textColor)}>
                  {filter.count}
                </strong>
              </div>
            </div>
            
            <div className={clsx(
              'w-5.5 h-5.5 rounded-full flex items-center justify-center border transition-all shrink-0',
              isActive 
                ? 'bg-primary-600 border-primary-600 text-white' 
                : 'bg-white border-slate-200 text-slate-400'
            )}>
              {isActive ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : <ArrowRight className="w-3.5 h-3.5 opacity-60" />}
            </div>
          </div>
        );
      })}
    </div>
  );
}
