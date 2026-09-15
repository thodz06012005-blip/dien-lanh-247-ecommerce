import Card from '../../../components/ui/Card';

interface ServiceRequestCustomerCardProps {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  district: string;
}

export default function ServiceRequestCustomerCard({
  customerName,
  customerPhone,
  customerAddress,
  district
}: ServiceRequestCustomerCardProps) {
  return (
    <Card title="Thông tin khách hàng">
      <div className="flex flex-col gap-3 text-sm">
        <div className="flex justify-between items-start border-b border-slate-100 pb-3">
          <span className="text-slate-500 font-semibold">Họ tên:</span>
          <span className="font-bold text-slate-900">{customerName}</span>
        </div>
        <div className="flex justify-between items-start border-b border-slate-100 pb-3">
          <span className="text-slate-500 font-semibold">Số điện thoại:</span>
          <span className="font-bold text-slate-700">{customerPhone}</span>
        </div>
        <div className="flex justify-between items-start border-b border-slate-100 pb-3">
          <span className="text-slate-500 font-semibold">Địa chỉ:</span>
          <span className="font-bold text-slate-700 text-right max-w-[60%]">
            {customerAddress}
          </span>
        </div>
        <div className="flex justify-between items-start">
          <span className="text-slate-500 font-semibold">Quận/Huyện:</span>
          <span className="font-bold text-slate-700">{district}</span>
        </div>
      </div>
    </Card>
  );
}
