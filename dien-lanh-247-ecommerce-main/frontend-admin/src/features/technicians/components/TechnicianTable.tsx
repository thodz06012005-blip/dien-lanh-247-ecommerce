import { useNavigate } from 'react-router-dom';
import Table, { type TableColumn } from '../../../components/ui/Table';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import { Edit2, Trash2, Star } from 'lucide-react';
import type { Technician } from '../types';
import clsx from 'clsx';
import { formatServiceRequestId } from '../../../utils/format';

interface Option {
  value: string;
  label: string;
}

interface TechnicianTableProps {
  technicians: Technician[];
  skillsOptions: Option[];
  onEdit: (t: Technician) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, newStatus: string) => void;
}

export default function TechnicianTable({
  technicians,
  skillsOptions,
  onEdit,
  onDelete,
  onStatusChange
}: TechnicianTableProps) {
  const navigate = useNavigate();

  const columns: TableColumn<Technician>[] = [
    {
      title: 'Họ tên / SĐT',
      key: 'name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <img
            src={row.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(row.name)}&background=f1f5f9&color=0f172a`}
            alt={row.name}
            className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-50"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(row.name)}&background=f1f5f9&color=0f172a`;
            }}
          />
          <div className="flex flex-col">
            <span className="font-semibold text-slate-900 leading-tight">{row.name}</span>
            <span className="text-xs text-slate-500 font-medium mt-0.5">{row.phone}</span>
          </div>
        </div>
      )
    },
    {
      title: 'Kỹ năng chuyên môn',
      key: 'skills',
      render: (row) => {
        const displaySkills = row.skills || [];
        const firstTwo = displaySkills.slice(0, 2);
        const extraCount = displaySkills.length - 2;
        return (
          <div className="flex flex-wrap gap-1 max-w-[200px]">
            {firstTwo.map((skill) => {
              const match = skillsOptions.find(o => o.value === skill);
              return (
                <Badge key={skill} variant="primary">
                  {match ? match.label : skill}
                </Badge>
              );
            })}
            {extraCount > 0 && (
              <div className="relative group inline-block">
                <Badge variant="neutral" className="cursor-pointer hover:bg-slate-200">
                  +{extraCount}
                </Badge>
                <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-900 text-white text-[10px] font-medium py-1.5 px-2.5 rounded-lg shadow-xl whitespace-nowrap">
                  {displaySkills.slice(2).map((s) => {
                    const m = skillsOptions.find(o => o.value === s);
                    return m ? m.label : s;
                  }).join(', ')}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-900" />
                </div>
              </div>
            )}
          </div>
        );
      }
    },
    {
      title: 'Khu vực hoạt động',
      key: 'workingAreas',
      render: (row) => {
        const displayAreas = row.workingAreas || [];
        const firstThree = displayAreas.slice(0, 3);
        const extraCount = displayAreas.length - 3;
        return (
          <div className="flex flex-wrap gap-1 max-w-[220px]">
            {firstThree.map((area) => (
              <Badge key={area} variant="info" pill>
                {area}
              </Badge>
            ))}
            {extraCount > 0 && (
              <div className="relative group inline-block">
                <Badge variant="neutral" pill className="cursor-pointer hover:bg-slate-200">
                  +{extraCount}
                </Badge>
                <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-900 text-white text-[10px] font-medium py-1.5 px-2.5 rounded-lg shadow-xl whitespace-nowrap">
                  {displayAreas.slice(3).join(', ')}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-900" />
                </div>
              </div>
            )}
          </div>
        );
      }
    },
    {
      title: 'Công việc hiện tại',
      key: 'currentJob',
      render: (row) => {
        const job = row.currentJob;
        return job ? (
          <div className="flex flex-col gap-0.5 text-xs">
            <button
              onClick={() => navigate(`/service-requests/${job.id}`)}
              className="font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer bg-transparent border-none p-0 text-left"
            >
              {formatServiceRequestId(job.id)}
            </button>
            <span className="text-slate-700 font-semibold">{job.district}</span>
            <span className="text-slate-400 font-medium text-[10px]">{job.preferredTimeSlot}</span>
          </div>
        ) : (
          <span className="text-xs text-slate-400 italic font-semibold">Không có việc</span>
        );
      }
    },
    {
      title: 'Công suất hôm nay',
      key: 'todayJobs',
      render: (row) => {
        const todayJobsCount = row.todayJobs || 0;
        return (
          <div className="flex flex-col gap-1 w-full max-w-[100px]">
            <div className="flex justify-between text-[10px] font-bold text-slate-500">
              <span>{todayJobsCount}/4 việc</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={clsx(
                  "h-full rounded-full transition-all duration-300", 
                  todayJobsCount >= 3 ? "bg-rose-500" : todayJobsCount === 2 ? "bg-amber-500" : "bg-emerald-500"
                )}
                style={{ width: `${Math.min(100, (todayJobsCount / 4) * 100)}%` }}
              />
            </div>
          </div>
        );
      }
    },
    {
      title: 'Hoàn thành / Đánh giá',
      key: 'stats',
      render: (row) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-slate-600 font-semibold">Đã làm: <strong className="text-slate-900 font-bold">{row.completedCount || 0} việc</strong></span>
          <div className="flex items-center gap-1 mt-0.5">
            <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400" />
            <span className="text-xs font-bold text-slate-700">{Number(row.rating || 5).toFixed(1)}</span>
          </div>
        </div>
      )
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (row) => {
        const statusColors: Record<string, string> = {
          available: 'bg-emerald-50 text-emerald-700 border-emerald-200/60 focus:ring-emerald-500/10',
          busy: 'bg-amber-50 text-amber-700 border-amber-200/60 focus:ring-amber-500/10',
          offline: 'bg-blue-50 text-blue-700 border-blue-200/60 focus:ring-blue-500/10',
          inactive: 'bg-slate-50 text-slate-600 border-slate-200/60 focus:ring-slate-400/10',
        };
        
        return (
          <select
            value={row.status}
            onChange={(e) => onStatusChange(row.id, e.target.value)}
            className={clsx(
              "px-2.5 py-1 text-xs font-bold rounded-xl border focus:outline-none focus:ring-4 cursor-pointer transition-all bg-white",
              statusColors[row.status] || 'bg-slate-50 text-slate-600'
            )}
          >
            <option value="available" className="bg-white text-emerald-700">Sẵn sàng</option>
            <option value="busy" className="bg-white text-amber-700">Đang bận</option>
            <option value="offline" className="bg-white text-blue-700">Ngoại tuyến</option>
            <option value="inactive" className="bg-white text-slate-600">Ngừng hoạt động</option>
          </select>
        );
      }
    },
    {
      title: 'Thao tác',
      key: 'actions',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(row)}
            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl border-none shadow-none"
            title="Chỉnh sửa thợ"
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(row.id)}
            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl border-none shadow-none"
            title="Xóa thợ"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <Table
      columns={columns}
      dataSource={technicians.map((t, index) => ({ ...t, key: t.id || String(index) }))}
      emptyText="Không tìm thấy kỹ thuật viên nào thỏa mãn bộ lọc."
    />
  );
}
