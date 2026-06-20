import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Clock, ShieldCheck, Heart, Award } from 'lucide-react';
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
    { name: 'Điều hòa treo tường & âm trần', path: '/products?categoryId=dieu-hoa' },
    { name: 'Tủ lạnh cao cấp', path: '/products?categoryId=tu-lanh' },
    { name: 'Máy giặt & Máy sấy quần áo', path: '/products?categoryId=may-giat' },
    { name: 'Bình nóng lạnh an toàn', path: '/products?categoryId=binh-nong-lanh' },
    { name: 'Linh kiện điện lạnh chính hãng', path: '/products?categoryId=linh-kien' },
    { name: 'Dịch vụ sửa chữa vệ sinh nhanh', path: '/products?categoryId=dich-vu' },
  ];

  const supportLinks = [
    { name: 'Giới thiệu Điện Lạnh 247', path: '/about' },
    { name: 'Chính sách bảo hành dài hạn', path: '/policy/warranty' },
    { name: 'Chính sách đổi trả 7 ngày', path: '/policy/return' },
    { name: 'Chính sách giao lắp siêu tốc', path: '/policy/shipping' },
    { name: 'Chính sách bảo mật thông tin', path: '/policy/privacy' },
    { name: 'Liên hệ / Góp ý', path: '/contact' },
  ];

  return (
    <footer className="bg-[#061527] text-slate-300 border-t border-slate-800/40 mt-auto">
      {/* Brand value grid */}
      <div className="border-b border-slate-800/40 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex gap-4 items-center">
            <div className="w-12 h-12 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-center text-cyan-400 flex-shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Cam kết chính hãng</h4>
              <p className="text-2xs text-slate-400 mt-0.5">Đền bù 200% nếu phát hiện hàng giả, hàng nhái kém chất lượng.</p>
            </div>
          </div>
          <div className="flex gap-4 items-center">
            <div className="w-12 h-12 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-center text-cyan-400 flex-shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Bảo hành siêu tốc</h4>
              <p className="text-2xs text-slate-400 mt-0.5">Xử lý yêu cầu bảo hành sự cố kỹ thuật tận nơi trong vòng 2 giờ.</p>
            </div>
          </div>
          <div className="flex gap-4 items-center">
            <div className="w-12 h-12 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-center text-cyan-400 flex-shrink-0">
              <Heart className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Tư vấn tận tâm</h4>
              <p className="text-2xs text-slate-400 mt-0.5">Kỹ thuật viên tư vấn giải pháp tiết kiệm điện, tối ưu công suất miễn phí.</p>
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
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center">
                <span className="text-white font-black text-lg">D</span>
              </div>
              <span className="font-black text-white text-lg tracking-tight">
                Điện Lạnh <span className="text-cyan-400">247</span>
              </span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed">
              Điện Lạnh 247 là hệ thống phân phối thiết bị điện máy, điện lạnh chính hãng và cung cấp dịch vụ sửa chữa bảo trì hàng đầu tại Việt Nam. Sự an tâm của khách hàng là tôn chỉ của chúng tôi.
            </p>
            <div className="flex flex-col gap-2 mt-2">
              <span className="text-3xs font-bold text-slate-500 uppercase tracking-wider">Thời gian làm việc</span>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Clock className="w-4 h-4 text-slate-550" />
                <span>8:00 - 21:00 (Kể cả Thứ 7, Chủ nhật và ngày lễ)</span>
              </div>
            </div>
          </div>

          {/* Column 2: Categories */}
          <div>
            <h3 className="text-sm font-bold text-white tracking-wider uppercase mb-5">Danh mục nổi bật</h3>
            <ul className="space-y-3.5">
              {categoriesLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-xs text-slate-400 hover:text-cyan-400 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Customer Support Links */}
          <div>
            <h3 className="text-sm font-bold text-white tracking-wider uppercase mb-5">Hỗ trợ khách hàng</h3>
            <ul className="space-y-3.5">
              {supportLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-xs text-slate-400 hover:text-cyan-400 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Contact details */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-bold text-white tracking-wider uppercase mb-1">Thông tin liên hệ</h3>
            <div className="flex flex-col gap-3.5 mt-1 text-xs">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                <span className="text-slate-400 leading-relaxed">
                  Trụ sở chính: {safeSettings.address}
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                <div>
                  <a href={`tel:${safeSettings.hotline.replace(/\s+/g, '')}`} className="text-white hover:text-cyan-400 font-bold transition-colors">
                    {safeSettings.hotline}
                  </a>
                  <span className="text-slate-400 ml-2">(Miễn phí)</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                <a href={`mailto:${safeSettings.email}`} className="text-slate-400 hover:text-cyan-400 transition-colors">
                  {safeSettings.email}
                </a>
              </div>
            </div>

            <div className="flex gap-2.5 mt-4">
              <a
                href={`https://zalo.me/${safeSettings.zalo.replace(/\s+/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-4 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 rounded-xl transition-all shadow-md shadow-blue-500/10 w-full"
              >
                Chat Zalo hỗ trợ kỹ thuật
              </a>
            </div>
          </div>
        </div>

        {/* Bottom footer text */}
        <div className="mt-12 border-t border-slate-800/40 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
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
