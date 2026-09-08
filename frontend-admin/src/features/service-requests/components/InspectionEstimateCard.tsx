import { CheckCircle2, ClipboardCheck, Clock3, Send, XCircle } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Select from '../../../components/ui/Select';

interface Props {
  estimatedPrice: number;
  inspectionNote?: string;
  approvalStatus?: string;
  approvedAt?: string | null;
  disabled: boolean;
  isSaving: boolean;
  onSave: (data: { estimatedPrice: number; inspectionNote: string; customerApprovalStatus: string }) => void;
}

const approvalMeta = {
  not_requested: { label: 'Chưa gửi khách', className: 'bg-slate-100 text-slate-600', icon: Clock3 },
  pending: { label: 'Chờ khách xác nhận', className: 'bg-amber-100 text-amber-700', icon: Clock3 },
  approved: { label: 'Khách đã đồng ý', className: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  rejected: { label: 'Khách từ chối', className: 'bg-red-100 text-red-700', icon: XCircle },
};

export default function InspectionEstimateCard({ estimatedPrice, inspectionNote = '', approvalStatus = 'not_requested', approvedAt, disabled, isSaving, onSave }: Props) {
  const meta = approvalMeta[approvalStatus as keyof typeof approvalMeta] || approvalMeta.not_requested;
  const StatusIcon = meta.icon;
  return <Card title="Kết quả kiểm tra & xác nhận chi phí">
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-3.5">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700"><ClipboardCheck className="h-4 w-4 text-blue-600" />Trạng thái báo chi phí</div>
      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${meta.className}`}><StatusIcon className="h-3.5 w-3.5" />{meta.label}</span>
      {approvedAt && <span className="w-full text-right text-[11px] text-slate-400">Xác nhận lúc {new Date(approvedAt).toLocaleString('vi-VN')}</span>}
    </div>
    <form key={`${estimatedPrice}-${inspectionNote}-${approvalStatus}`} onSubmit={event => { event.preventDefault(); const values = new FormData(event.currentTarget); onSave({ estimatedPrice: Number(values.get('estimatedPrice')), inspectionNote: String(values.get('inspectionNote') || ''), customerApprovalStatus: String(values.get('customerApprovalStatus') || 'not_requested') }); }} className="space-y-4">
      <label className="block text-[13px] font-medium text-slate-700">Chi phí dự kiến sau kiểm tra (VNĐ) *<input name="estimatedPrice" type="number" min="1" defaultValue={estimatedPrice || ''} disabled={disabled} placeholder="Ví dụ: 450000" className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-50" /></label>
      <label className="block text-[13px] font-medium text-slate-700">Kết luận kiểm tra *<textarea name="inspectionNote" rows={4} defaultValue={inspectionNote} disabled={disabled} placeholder="Mô tả nguyên nhân, hạng mục cần thực hiện và linh kiện dự kiến..." className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm leading-6 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-50" /></label>
      <Select name="customerApprovalStatus" label="Xác nhận của khách hàng" defaultValue={approvalStatus} disabled={disabled} options={[{ value: 'not_requested', label: 'Chưa gửi khách xác nhận' }, { value: 'pending', label: 'Đã thông báo — đang chờ khách' }, { value: 'approved', label: 'Khách đã đồng ý chi phí' }, { value: 'rejected', label: 'Khách từ chối chi phí' }]} />
      <p className="rounded-xl bg-blue-50 p-3 text-xs leading-5 text-blue-800">Chỉ ghi nhận “Khách đã đồng ý” sau khi đã gọi điện hoặc nhận được xác nhận rõ ràng từ khách hàng.</p>
      <Button type="submit" disabled={disabled} isLoading={isSaving} leftIcon={<Send className="h-4 w-4" />} className="h-11 w-full font-bold">Lưu kết quả kiểm tra</Button>
    </form>
  </Card>;
}
