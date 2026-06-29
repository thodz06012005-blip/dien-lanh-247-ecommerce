import { ShieldCheck, Truck, CreditCard, Wrench } from 'lucide-react';

export default function TrustBadges() {
  const badges = [
    { title: 'Giao lắp 2h', desc: 'Nội thành siêu tốc', icon: <Truck className="w-5 h-5 text-primary-600" /> },
    { title: 'Bảo hành chính hãng', desc: 'Bảo hành kép uy tín', icon: <ShieldCheck className="w-5 h-5 text-primary-600" /> },
    { title: 'Thanh toán COD', desc: 'Nhận hàng kiểm tra', icon: <CreditCard className="w-5 h-5 text-primary-600" /> },
    { title: 'Hỗ trợ kỹ thuật 24/7', desc: 'Trọn đời máy', icon: <Wrench className="w-5 h-5 text-primary-600" /> },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-2">
      {badges.map((b, i) => (
        <div
          key={i}
          className="flex flex-col items-center text-center gap-2 p-4 rounded-2xl bg-white border border-slate-100/80 shadow-2xs hover:shadow-sm hover:scale-102 hover:border-blue-100 transition-all duration-200"
        >
          <div className="w-10 h-10 rounded-full bg-blue-50/50 flex items-center justify-center">
            {b.icon}
          </div>
          <div className="flex flex-col">
            <span className="text-3xs font-extrabold text-slate-800 uppercase tracking-wider">{b.title}</span>
            <span className="text-4xs text-slate-400 font-semibold mt-0.5">{b.desc}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
