import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Clock, ShieldCheck, Heart, Award, FileText, Calendar } from 'lucide-react';
import { useSettings } from '../../hooks/useSettings';

export default function Footer() {
  const { settings } = useSettings();
  const currentYear = new Date().getFullYear();

  const safeSettings = {
    hotline: settings?.hotline || '1900 1234',
    zalo: settings?.zalo || '0987654321',
    email: settings?.email || 'support@dienlanh247.vn',
    address: settings?.address || '123 Đường Cầu Giấy, Hà Nội',
  };

  const categoriesLinks = [
    { name: 'Điều hòa chính hãng', path: '/products?categoryId=dieu-hoa' },
    { name: 'Tủ lạnh cao cấp Inverter', path: '/products?categoryId=tu-lanh' },
    { name: 'Máy giặt & Máy sấy quần áo', path: '/products?categoryId=may-giat' },
    { name: 'Bình nóng lạnh an toàn', path: '/products?categoryId=binh-nong-lanh' },
    { name: 'Linh kiện thiết bị điện lạnh', path: '/products?categoryId=linh-kien' },
    { name: 'Dịch vụ sửa chữa & Bảo dưỡng', path: '/services' },
  ];

  const supportLinks = [
    { name: 'Giới thiệu về Điện Lạnh 247', path: '/about' },
    { name: 'Đặt lịch thợ kỹ thuật nhanh', path: '/service-booking' },
    { name: 'Chính sách bảo hành dịch vụ', path: '/policy/warranty' },
    { name: 'Chính sách lắp đặt giao nhận', path: '/policy/shipping' },
    { name: 'Chính sách bảo mật thông tin', path: '/policy/privacy' },
    { name: 'Gửi yêu cầu liên hệ / Góp ý', path: '/contact' },
  ];

  return (
    <footer className="bg-[#020b14] text-slate-400 border-t border-slate-900 mt-auto">
      {/* Brand value grid */}
      <div className="bg-[#03111f]/45 border-b border-slate-900/60 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex gap-4 items-start">
            <div className="w-11 h-11 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-center text-cyan-400 flex-shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Cam kết chính hãng 100%</h4>
              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">Đền bù gấp đôi nếu phát hiện hàng giả, hàng nhái kém chất lượng. Đầy đủ CO/CQ từ Daikin, Panasonic...</p>
            </div>
          </div>
          <div className="flex gap-4 items-start">
            <div className="w-11 h-11 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-center text-cyan-400 flex-shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Bảo hành siêu tốc tại nhà</h4>
              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">Chính sách bảo hành dịch vụ 3-12 tháng, tiếp nhận và xử lý bảo hành nhanh chóng ngay trong ngày.</p>
            </div>
          </div>
          <div className="flex gap-4 items-start">
            <div className="w-11 h-11 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-center text-cyan-400 flex-shrink-0">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Tư vấn báo giá trước khi sửa</h4>
              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">Kỹ thuật viên kiểm tra chi tiết và lập bảng giá cụ thể. Khách hàng duyệt chi phí mới bắt đầu thực hiện.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main footer contents */}
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Column 1: Brand Info */}
          <div className="flex flex-col gap-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-black text-sm">D</span>
              </div>
              <span className="font-black text-white text-base tracking-tight">
                Điện Lạnh <span className="text-cyan-400">247</span>
              </span>
            </Link>
            <p className="text-3xs md:text-2xs text-slate-400 leading-relaxed">
              Điện Lạnh 247 là hệ thống kỹ thuật điện lạnh toàn diện, cung cấp thiết bị chính hãng và dịch vụ sửa chữa, bảo dưỡng chuyên nghiệp hàng đầu tại Việt Nam.
            </p>
            <div className="flex flex-col gap-2 mt-2">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Khung giờ hoạt động</span>
              <div className="flex items-center gap-2 text-2xs text-slate-400">
                <Clock className="w-4 h-4 text-slate-600 shrink-0" />
                <span>8:00 - 21:00 (Hàng ngày, kể cả lễ Tết)</span>
              </div>
            </div>
          </div>

          {/* Column 2: Categories */}
          <div>
            <h3 className="text-xs font-bold text-white tracking-wider uppercase mb-5">Danh mục nổi bật</h3>
            <ul className="space-y-3">
              {categoriesLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-2xs text-slate-400 hover:text-cyan-400 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Customer Support Links */}
          <div>
            <h3 className="text-xs font-bold text-white tracking-wider uppercase mb-5">Hỗ trợ khách hàng</h3>
            <ul className="space-y-3">
              {supportLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-2xs text-slate-400 hover:text-cyan-400 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Contact details & Tracking */}
          <div className="flex flex-col gap-5">
            <div>
              <h3 className="text-xs font-bold text-white tracking-wider uppercase mb-4">Thông tin liên hệ</h3>
              <div className="flex flex-col gap-3 text-2xs">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-400 leading-relaxed">
                    Văn phòng: {safeSettings.address}
                  </span>
                </div>
                
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <a href={`tel:${safeSettings.hotline.replace(/\s+/g, '')}`} className="text-white hover:text-cyan-400 font-bold transition-colors">
                    {safeSettings.hotline}
                  </a>
                </div>

                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <a href={`mailto:${safeSettings.email}`} className="text-slate-400 hover:text-cyan-400 transition-colors truncate">
                    {safeSettings.email}
                  </a>
                </div>
              </div>
            </div>

            {/* Quick Service Tracking */}
            <div className="border-t border-slate-900/60 pt-4 flex flex-col gap-2.5">
              <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Theo dõi đơn đặt của bạn</h4>
              <div className="flex gap-2">
                <Link to="/my-services" className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-white/5 border border-white/8 hover:bg-white/10 text-3xs font-extrabold text-white rounded-lg transition-all shrink-0">
                  <Calendar className="w-3 h-3 text-cyan-400" />
                  Lịch sửa chữa
                </Link>
                <Link to="/account?tab=orders" className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-white/5 border border-white/8 hover:bg-white/10 text-3xs font-extrabold text-white rounded-lg transition-all shrink-0">
                  <FileText className="w-3 h-3 text-orange-400" />
                  Đơn mua hàng
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom footer text */}
        <div className="mt-12 border-t border-slate-900/60 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-2xs text-slate-500">
          <p>
            &copy; {currentYear} Điện Lạnh 247. Đã đăng ký bản quyền. Mã số doanh nghiệp: 0109284755.
          </p>
          <div className="flex gap-4">
            <span className="text-slate-600">Phát triển bởi Đội ngũ Senior Frontend</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
