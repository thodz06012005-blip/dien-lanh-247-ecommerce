import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import { Star } from 'lucide-react';
import type { ServiceRequest } from '../types';
import type { Technician } from '../../technicians/types';

// Helper check matched technician
const isTechnicianMatched = (tech: Technician, request: ServiceRequest) => {
  return tech.status === 'available' &&
         tech.workingAreas?.includes(request.district) &&
         tech.skills?.includes(request.serviceCategoryId);
};

interface TechnicianAssignPanelProps {
  request: ServiceRequest;
  techniciansList: Technician[];
  isChangingTech: boolean;
  setIsChangingTech: (val: boolean) => void;
  selectedTechId: string;
  setSelectedTechId: (val: string) => void;
  onAssign: (techId: string) => void;
  isAssigning: boolean;
}

export default function TechnicianAssignPanel({
  request,
  techniciansList,
  isChangingTech,
  setIsChangingTech,
  selectedTechId,
  setSelectedTechId,
  onAssign,
  isAssigning
}: TechnicianAssignPanelProps) {
  const isCompletedOrCancelled = ['completed', 'cancelled'].includes(request.status);

  return (
    <Card title="Kỹ thuật viên phụ trách">
      {request.technician && !isChangingTech ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3.5 p-3.5 bg-slate-50 border border-slate-200/60 rounded-2xl">
            <img
              src={request.technician.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(request.technician.name)}&background=f1f5f9&color=0f172a`}
              alt={request.technician.name}
              className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-50"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(request.technician!.name)}&background=f1f5f9&color=0f172a`;
              }}
            />
            <div className="flex-1 min-w-0">
              <strong className="text-sm font-bold text-slate-900 block truncate">{request.technician.name}</strong>
              <span className="text-xs text-slate-500 font-medium block mt-0.5">{request.technician.phone}</span>
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400" />
                <span className="text-xs font-bold text-slate-700">{Number(request.technician.rating || 5).toFixed(1)}</span>
              </div>
            </div>
          </div>
          {!isCompletedOrCancelled && (
            <Button
              variant="outline"
              className="w-full h-10 rounded-xl font-bold border-slate-200 text-slate-700"
              onClick={() => setIsChangingTech(true)}
            >
              Thay đổi kỹ thuật viên
            </Button>
          )}
        </div>
      ) : !isCompletedOrCancelled ? (
        <div className="flex flex-col gap-4">
          {/* Tech selection lists */}
          {(() => {
            const matchedTechs = techniciansList.filter((tech: Technician) => isTechnicianMatched(tech, request));

            if (matchedTechs.length === 0) {
              return (
                <div className="text-xs text-slate-400 bg-slate-50 p-4 rounded-xl border border-dashed border-slate-200 font-medium text-center">
                  Chưa có thợ phù hợp với khu vực và loại dịch vụ này
                </div>
              );
            }

            return (
              <div className="flex flex-col gap-4">
                {/* Suggested list */}
                <div className="flex flex-col gap-2.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                    Gợi ý phù hợp:
                  </span>
                  {matchedTechs.slice(0, 3).map((tech: Technician) => (
                    <div key={tech.id} className="flex items-center justify-between p-3 bg-blue-50/40 border border-blue-100 rounded-xl gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={tech.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(tech.name)}&background=e0f2fe&color=0369a1`}
                          alt={tech.name}
                          className="w-9 h-9 rounded-lg object-cover border border-blue-200 shrink-0"
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-slate-800 truncate">{tech.name}</span>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Star className="w-3 h-3 fill-amber-400 stroke-amber-400" />
                            <span className="text-[10px] font-bold text-slate-600">{Number(tech.rating || 5).toFixed(1)}</span>
                            <span className="text-[9px] font-medium text-slate-400">({tech.completedCount || 0} việc)</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => onAssign(tech.id)}
                        className="h-8 rounded-lg text-xs font-bold px-2.5"
                        isLoading={isAssigning}
                      >
                        Phân công
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Dropdown for matched techs */}
                <div className="flex flex-col gap-2 border-t border-slate-100 pt-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Hoặc chọn từ danh sách:
                  </span>
                  <div className="flex gap-2">
                    <Select
                      value={selectedTechId}
                      onChange={(e) => setSelectedTechId(e.target.value)}
                      options={[
                        { label: '-- Chọn thợ kỹ thuật --', value: '' },
                        ...matchedTechs.map((tech: Technician) => ({
                          label: `${tech.name} (${tech.workingAreas.join(', ')})`,
                          value: tech.id
                        }))
                      ]}
                      className="h-9 text-xs rounded-lg flex-1 shadow-none border-slate-200 bg-[#fafafa]"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!selectedTechId}
                      onClick={() => onAssign(selectedTechId)}
                      className="h-9 rounded-lg text-xs font-bold border-slate-200 shrink-0"
                      isLoading={isAssigning}
                    >
                      Gán thợ
                    </Button>
                  </div>
                </div>
              </div>
            );
          })()}

          {request.technician && (
            <Button
              variant="outline"
              size="sm"
              className="w-full text-slate-500 hover:text-slate-700 h-8 text-xs font-bold border-none"
              onClick={() => setIsChangingTech(false)}
            >
              Hủy bỏ đổi thợ
            </Button>
          )}
        </div>
      ) : (
        <div className="text-xs text-slate-400 bg-slate-50 p-4 rounded-xl border border-slate-100 font-medium text-center italic">
          Chưa gán kỹ thuật viên phụ trách.
        </div>
      )}
    </Card>
  );
}
