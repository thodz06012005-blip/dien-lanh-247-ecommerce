import Card from '../../../components/ui/Card';

interface ServiceRequestServiceCardProps {
  serviceCategoryId: string;
  categoryName: string;
  applianceType: string;
  issueDescription: string;
  preferredDate: string;
  preferredTimeSlot: string;
  note?: string;
}

export default function ServiceRequestServiceCard({
  serviceCategoryId,
  categoryName,
  applianceType,
  issueDescription,
  preferredDate,
  preferredTimeSlot,
  note
}: ServiceRequestServiceCardProps) {
  return (
    <Card title="Thông tin dịch vụ">
      <div className="flex flex-col gap-3 text-sm">
        <div className="flex justify-between items-start border-b border-slate-100 pb-3">
          <span className="text-slate-500 font-semibold">Loại dịch vụ:</span>
          <span className="font-bold text-slate-900">
            {categoryName || serviceCategoryId}
          </span>
        </div>
        <div className="flex justify-between items-start border-b border-slate-100 pb-3">
          <span className="text-slate-500 font-semibold">Loại thiết bị:</span>
          <span className="font-bold text-slate-700">{applianceType}</span>
        </div>
        <div className="flex flex-col gap-1.5 border-b border-slate-100 pb-3">
          <span className="text-slate-500 font-semibold">Mô tả sự cố:</span>
          <p className="text-slate-700 bg-slate-50 rounded-xl p-3 text-sm leading-relaxed">
            {issueDescription}
          </p>
        </div>
        <div className="flex justify-between items-start border-b border-slate-100 pb-3">
          <span className="text-slate-500 font-semibold">Ngày hẹn:</span>
          <span className="font-bold text-slate-700">
            {new Date(preferredDate).toLocaleDateString('vi-VN')}
          </span>
        </div>
        <div className="flex justify-between items-start border-b border-slate-100 pb-3">
          <span className="text-slate-500 font-semibold">Khung giờ:</span>
          <span className="font-bold text-slate-700">{preferredTimeSlot}</span>
        </div>
        {note && (
          <div className="bg-amber-50 border border-amber-200/60 p-3 rounded-xl mt-1">
            <strong className="text-amber-800 block text-[10px] uppercase font-bold tracking-widest mb-1">
              Ghi chú khách hàng
            </strong>
            <span className="text-amber-900 font-medium text-sm italic">
              "{note}"
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}
