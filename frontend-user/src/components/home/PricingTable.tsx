import { Link } from 'react-router-dom';
import { Calendar, ShieldCheck, AlertCircle } from 'lucide-react';

interface PricingItem {
  name: string;
  price: string;
  warranty: string;
  category: 'dieu-hoa' | 'tu-lanh' | 'may-giat';
}

const pricingData: PricingItem[] = [
  // Điều hòa
  { name: 'Vệ sinh điều hòa treo tường (1HP - 2.5HP)', price: '150.000đ', warranty: '1 tháng chảy nước', category: 'dieu-hoa' },
  { name: 'Sửa điều hòa chảy nước dàn lạnh', price: '200.000đ', warranty: '1 tháng', category: 'dieu-hoa' },
  { name: 'Nạp gas châm thêm R32 / R410A', price: 'Từ 8.000đ / PSI', warranty: 'Bảo hành kín khít', category: 'dieu-hoa' },
  { name: 'Kiểm tra xử lý sự cố mất nguồn', price: 'Từ 250.000đ', warranty: '3 - 6 tháng', category: 'dieu-hoa' },
  // Tủ lạnh
  { name: 'Kiểm tra xử lý tủ lạnh đóng tuyết', price: 'Từ 350.000đ', warranty: '3 tháng', category: 'tu-lanh' },
  { name: 'Thay thế cảm biến nhiệt / sò nóng, lạnh', price: '300.000đ - 450.000đ', warranty: '3 tháng', category: 'tu-lanh' },
  { name: 'Sửa bo mạch điều khiển tủ lạnh Inverter', price: 'Từ 550.000đ', warranty: '6 tháng', category: 'tu-lanh' },
  // Máy giặt
  { name: 'Vệ sinh lồng giặt cửa đứng (cửa trên)', price: '250.000đ', warranty: 'Lồng giặt sạch bóng', category: 'may-giat' },
  { name: 'Vệ sinh lồng giặt cửa ngang (cửa trước)', price: '450.000đ', warranty: 'Tháo rời xịt rửa sâu', category: 'may-giat' },
  { name: 'Sửa máy giặt rung lắc mạnh, kêu to', price: 'Từ 300.000đ', warranty: '6 tháng', category: 'may-giat' },
  { name: 'Xử lý lỗi board mạch máy giặt mất nguồn', price: 'Từ 450.000đ', warranty: '6 tháng', category: 'may-giat' }
];

export default function PricingTable() {
  const getCategoryLabel = (cat: PricingItem['category']) => {
    switch (cat) {
      case 'dieu-hoa': return 'Dịch vụ Điều hòa';
      case 'tu-lanh': return 'Dịch vụ Tủ lạnh';
      case 'may-giat': return 'Dịch vụ Máy giặt';
    }
  };

  const categories: PricingItem['category'][] = ['dieu-hoa', 'tu-lanh', 'may-giat'];

  return (
    <section className="py-20 md:py-28 bg-white border-t border-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Header */}
        <div className="text-center mb-12 max-w-xl mx-auto">
          <p className="premium-kicker justify-center mb-2">
            <span className="w-5 h-px bg-blue-500 rounded-full inline-block" />
            Bảng giá niêm yết
          </p>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Giá cả minh bạch, không phí ẩn
          </h2>
          <p className="text-xs md:text-sm text-slate-500 mt-3 leading-relaxed">
            Điện Lạnh 247 cam kết cung cấp bảng giá tham khảo chuẩn mực. Mọi dịch vụ đều đi kèm phiếu nghiệm thu và chính sách bảo hành rõ ràng.
          </p>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {categories.map((cat) => {
            const items = pricingData.filter(item => item.category === cat);
            return (
              <div key={cat} className="flex flex-col bg-slate-50 border border-slate-100 rounded-[2rem] p-6 md:p-8 hover:border-blue-200 transition-colors shadow-sm">
                <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-200/60 pb-4 mb-5 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-blue-600 rounded-full inline-block" />
                  {getCategoryLabel(cat)}
                </h3>

                <div className="flex flex-col gap-5 flex-grow">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex flex-col pb-4 border-b border-slate-200/40 last:border-b-0 last:pb-0 group">
                      <div className="flex justify-between items-start gap-4">
                        <h4 className="text-xs font-bold text-slate-800 leading-snug group-hover:text-blue-600 transition-colors">{item.name}</h4>
                        <span className="text-xs font-extrabold text-slate-950 text-right shrink-0">{item.price}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-2 text-[10px] text-slate-500">
                        <ShieldCheck className="w-3.5 h-3.5 text-green-500 shrink-0" />
                        <span>Bảo hành: <strong className="text-slate-700 font-semibold">{item.warranty}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-slate-200/60">
                  <Link to="/service-booking" className="w-full">
                    <button className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-xl text-xs font-extrabold shadow-sm hover:shadow-md transition-all cursor-pointer">
                      <Calendar className="w-4 h-4" />
                      Đặt lịch kỹ thuật viên
                    </button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Alert Notice */}
        <div className="mt-10 flex gap-3 p-4 bg-orange-50/50 border border-orange-100 rounded-2xl max-w-2xl mx-auto">
          <AlertCircle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-600 leading-relaxed">
            <strong className="text-orange-700 font-bold">Lưu ý quan trọng:</strong> Bảng giá trên mang tính chất tham khảo. Kỹ thuật viên của chúng tôi sẽ đến kiểm tra chi tiết tận nhà và <strong className="text-slate-800 font-bold">báo giá chính xác trước khi thực hiện sửa chữa</strong>. Khách hàng hoàn toàn có quyền từ chối nếu không đồng ý phương án chẩn đoán.
          </div>
        </div>
      </div>
    </section>
  );
}
