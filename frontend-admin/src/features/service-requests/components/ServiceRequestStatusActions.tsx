import Card from '../../../components/ui/Card';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';

interface ServiceRequestStatusActionsProps {
  status: string;
  newStatus: string;
  setNewStatus: (val: string) => void;
  statusNote: string;
  setStatusNote: (val: string) => void;
  onUpdate: () => void;
  isPending: boolean;
}

export default function ServiceRequestStatusActions({
  status,
  newStatus,
  setNewStatus,
  statusNote,
  setStatusNote,
  onUpdate,
  isPending
}: ServiceRequestStatusActionsProps) {
  const isCompletedOrCancelled = ['completed', 'cancelled'].includes(status);

  return (
    <Card title="Cập nhật trạng thái">
      <div className="flex flex-col gap-4">
        <Select
          label="Trạng thái mới"
          value={newStatus}
          onChange={(e) => setNewStatus(e.target.value)}
          options={(() => {
            const baseOption = { value: '', label: '-- Chọn trạng thái --' };
            if (status === 'pending') {
              return [
                baseOption,
                { value: 'confirmed', label: 'Đã xác nhận (Confirmed)' },
                { value: 'cancelled', label: 'Đã hủy (Cancelled)' },
              ];
            }
            if (status === 'confirmed') {
              return [
                baseOption,
                { value: 'cancelled', label: 'Đã hủy (Cancelled)' },
              ];
            }
            if (status === 'assigned') {
              return [
                baseOption,
                { value: 'completed', label: 'Hoàn thành (Completed)' },
                { value: 'cancelled', label: 'Đã hủy (Cancelled)' },
              ];
            }
            return [{ value: '', label: 'Không thể thay đổi trạng thái' }];
          })()}
          disabled={isCompletedOrCancelled}
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-slate-700">Ghi chú / Lý do</label>
          <textarea
            value={statusNote}
            onChange={(e) => setStatusNote(e.target.value)}
            placeholder={isCompletedOrCancelled ? 'Không thể cập nhật trạng thái đã hoàn thành hoặc hủy' : 'Nhập ghi chú hoặc lý do cập nhật...'}
            rows={3}
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm transition-all focus:outline-none focus:ring-4 focus:border-primary-600 focus:ring-primary-500/10 hover:border-slate-300 resize-none disabled:bg-slate-50 disabled:text-slate-400"
            disabled={isCompletedOrCancelled}
          />
        </div>
        <Button
          variant="primary"
          className="w-full"
          onClick={onUpdate}
          isLoading={isPending}
          disabled={!newStatus || isCompletedOrCancelled}
        >
          Cập nhật
        </Button>
      </div>
    </Card>
  );
}
