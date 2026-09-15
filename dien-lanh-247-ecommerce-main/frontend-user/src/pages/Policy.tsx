import { useParams, Link } from 'react-router-dom';
import { ShieldCheck, ArrowRight, RotateCcw, Truck, CreditCard, Lock, HelpCircle } from 'lucide-react';
import Breadcrumb from '../components/common/Breadcrumb';
import Button from '../components/ui/Button';

interface PolicyContent {
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

export default function Policy() {
  const { slug } = useParams<{ slug: string }>();

  const policies: Record<string, PolicyContent> = {
    warranty: {
      title: 'Chính sách bảo hành dài hạn',
      icon: <ShieldCheck className="w-10 h-10 text-primary-600" />,
      content: (
        <div className="flex flex-col gap-4 text-xs text-slate-600 leading-relaxed">
          <p>
            Tất cả sản phẩm thiết bị điện máy, điện lạnh do <strong>Điện Lạnh 247</strong> phân phối đều được bảo hành kép nhằm tối ưu lợi ích và an tâm tuyệt đối của khách hàng.
          </p>
          <h3 className="font-bold text-slate-900 text-sm mt-4">1. Bảo hành chính hãng từ nhà sản xuất</h3>
          <p>
            Sản phẩm được đăng ký bảo hành điện tử chính hãng thông qua số seri máy trực tiếp với tổng đài của hãng (Daikin, Panasonic, LG, Samsung, Casper...).
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Điều hòa: Bảo hành cục lạnh 1 - 2 năm, máy nén (Block) 5 - 7 năm.</li>
            <li>Tủ lạnh: Bảo hành thiết bị 2 năm, máy nén Inverter 10 - 12 năm.</li>
            <li>Máy giặt: Bảo hành bo mạch 2 năm, động cơ truyền động 10 - 11 năm.</li>
          </ul>

          <h3 className="font-bold text-slate-900 text-sm mt-4">2. Bảo hành kỹ thuật lắp ráp từ Điện Lạnh 247</h3>
          <p>
            Cam kết bảo hành miễn phí 12 tháng cho toàn bộ khâu kết nối lắp ráp kỹ thuật của đội thợ Điện Lạnh 247:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Bảo hành lỗi chảy nước dàn lạnh (do đặt nghiêng, thông đường ống thoát nước sai cách).</li>
            <li>Bảo hành lỗi rò rỉ gas tại các giắc co nối ống đồng.</li>
            <li>Có mặt khắc phục xử lý sự cố trong vòng 2 giờ kể từ khi tiếp nhận yêu cầu qua Hotline.</li>
          </ul>

          <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl text-amber-800 text-2xs mt-4 flex gap-3">
            <HelpCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <strong>Lưu ý quan trọng:</strong> Trường hợp máy hỏng do lỗi bên thứ 3 tự ý tháo dỡ, di dời vị trí dàn nóng lạnh hoặc thiên tai cháy nổ, Điện Lạnh 247 sẽ từ chối bảo hành miễn phí mà chỉ hỗ trợ sửa chữa tính phí ưu đãi.
            </div>
          </div>
        </div>
      ),
    },
    return: {
      title: 'Chính sách đổi trả trong 7 ngày',
      icon: <RotateCcw className="w-10 h-10 text-primary-600" />,
      content: (
        <div className="flex flex-col gap-4 text-xs text-slate-600 leading-relaxed">
          <p>
            Điện Lạnh 247 áp dụng chính sách đổi trả linh hoạt hỗ trợ người dùng tối đa khi phát sinh lỗi sản xuất nghiêm trọng.
          </p>
          <h3 className="font-bold text-slate-900 text-sm mt-4">1. Thời hạn và điều kiện đổi mới 1-đổi-1</h3>
          <p>
            Trong vòng 7 ngày kể từ thời điểm bàn giao nghiệm thu máy, nếu thiết bị phát sinh lỗi phần cứng nghiêm trọng do lỗi của nhà sản xuất (hỏng block, lỗi mạch khiển không thể phục hồi):
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Khách hàng được đổi mới 100% sản phẩm cùng model hoặc tương đương miễn phí hoàn toàn.</li>
            <li>Vỏ hộp, bao bì, phụ kiện đi kèm và phiếu bảo hành chính hãng phải còn nguyên vẹn.</li>
            <li>Sản phẩm không có dấu hiệu móp méo, trầy xước bên ngoài do va đập của người sử dụng.</li>
          </ul>

          <h3 className="font-bold text-slate-900 text-sm mt-4">2. Quy trình thẩm định đổi trả</h3>
          <p>
            Kỹ thuật viên của Điện Lạnh 247 phối hợp cùng đại diện hãng đến kiểm tra trực tiếp tình trạng máy tại nhà khách hàng trong vòng 24 giờ. Khi xác nhận đúng lỗi kỹ thuật của nhà sản xuất, chúng tôi sẽ tiến hành thu hồi máy cũ và giao lắp máy mới ngay trong ngày.
          </p>
        </div>
      ),
    },
    shipping: {
      title: 'Chính sách giao nhận & Lắp ráp 2h',
      icon: <Truck className="w-10 h-10 text-primary-600" />,
      content: (
        <div className="flex flex-col gap-4 text-xs text-slate-600 leading-relaxed">
          <p>
            Với mong muốn đáp ứng nhu cầu làm mát khẩn cấp của khách hàng, Điện Lạnh 247 xây dựng dịch vụ giao nhận lắp ráp siêu tốc.
          </p>
          <h3 className="font-bold text-slate-900 text-sm mt-4">1. Phạm vi và thời gian giao hàng</h3>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Khu vực Nội thành (Hà Nội & TP.HCM):</strong> Giao lắp siêu tốc trong vòng 2 giờ đối với các đơn hàng điều hòa, tủ lạnh, máy giặt có sẵn trong kho.</li>
            <li><strong>Khu vực Ngoại thành & Lân cận:</strong> Giao hàng và lắp ráp hẹn giờ trong vòng 12 - 24 giờ.</li>
          </ul>

          <h3 className="font-bold text-slate-900 text-sm mt-4">2. Bảng phí giao lắp</h3>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Miễn phí vận chuyển cho đơn hàng có tổng trị giá từ 5.000.000đ trở lên.</li>
            <li>Đơn hàng dưới 5.000.000đ: Phí vận chuyển phụ kiện/linh kiện là 30.000đ, phí vận chuyển thiết bị cồng kềnh là 150.000đ.</li>
            <li>Công lắp đặt và giá vật tư ống đồng, giá đỡ dàn nóng, dây điện nối dài được niêm yết công khai trên bảng giá vật tư tại cửa hàng, cam kết không thu thêm phí phụ ngoài bảng giá.</li>
          </ul>
        </div>
      ),
    },
    payment: {
      title: 'Chính sách thanh toán linh hoạt',
      icon: <CreditCard className="w-10 h-10 text-primary-600" />,
      content: (
        <div className="flex flex-col gap-4 text-xs text-slate-600 leading-relaxed">
          <p>
            Điện Lạnh 247 hỗ trợ đa dạng phương thức thanh toán an toàn, minh bạch cho khách hàng dễ dàng giao dịch.
          </p>
          <h3 className="font-bold text-slate-900 text-sm mt-4">1. Thanh toán COD (Thanh toán khi nhận hàng)</h3>
          <p>
            Đây là phương thức được 90% khách hàng lựa chọn tại Điện Lạnh 247:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Khách đặt hàng qua Web/Hotline không cần đặt cọc trước (áp dụng với các dòng máy phổ thông).</li>
            <li>Thợ giao lắp mang máy đến lắp ráp, chạy thử ổn định.</li>
            <li>Khách kiểm tra máy chính hãng nguyên đai nguyên kiện mới tiến hành thanh toán tiền mặt hoặc chuyển khoản ngân hàng trực tiếp cho kỹ thuật viên.</li>
          </ul>

          <h3 className="font-bold text-slate-900 text-sm mt-4">2. Chuyển khoản ngân hàng</h3>
          <p>
            Áp dụng đối với khách mua máy số lượng lớn, khách hàng doanh nghiệp cần thanh toán qua tài khoản công ty để xuất hóa đơn tài chính VAT.
          </p>
        </div>
      ),
    },
    privacy: {
      title: 'Chính sách bảo mật thông tin',
      icon: <Lock className="w-10 h-10 text-primary-600" />,
      content: (
        <div className="flex flex-col gap-4 text-xs text-slate-600 leading-relaxed">
          <p>
            Điện Lạnh 247 cam kết bảo vệ tuyệt đối thông tin cá nhân của khách hàng khi đặt mua sản phẩm và dịch vụ trên hệ thống.
          </p>
          <h3 className="font-bold text-slate-900 text-sm mt-4">1. Mục đích thu thập thông tin</h3>
          <p>
            Chúng tôi thu thập họ tên, số điện thoại, địa chỉ giao hàng và email của khách hàng chỉ nhằm mục đích:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Xử lý và giao lắp đơn hàng chính xác.</li>
            <li>Đăng ký và kích hoạt bảo hành điện tử chính hãng.</li>
            <li>Chăm sóc khách hàng, nhắc hẹn lịch vệ sinh máy lạnh định kỳ.</li>
          </ul>

          <h3 className="font-bold text-slate-900 text-sm mt-4">2. Cam kết bảo mật</h3>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Không chia sẻ, trao đổi thông tin khách hàng cho bên thứ ba vì bất kỳ mục đích thương mại nào.</li>
            <li>Dữ liệu khách hàng được lưu trữ bảo mật trên hệ thống máy chủ nội bộ của Điện Lạnh 247.</li>
          </ul>
        </div>
      ),
    },
  };

  const activePolicy = slug ? policies[slug] : undefined;

  if (!activePolicy) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-xl font-bold text-slate-800">Chính sách không tồn tại</h2>
        <p className="text-sm text-slate-500 mt-2">Vui lòng quay lại trang chủ.</p>
        <Link to="/">
          <Button variant="primary" className="mt-6 rounded-xl">Quay lại trang chủ</Button>
        </Link>
      </div>
    );
  }

  const breadcrumbItems = [
    { name: 'Chính sách' },
    { name: activePolicy.title },
  ];

  const policyLinks = [
    { name: 'Chính sách bảo hành', slug: 'warranty' },
    { name: 'Chính sách đổi trả', slug: 'return' },
    { name: 'Chính sách giao lắp', slug: 'shipping' },
    { name: 'Chính sách thanh toán', slug: 'payment' },
    { name: 'Chính sách bảo mật', slug: 'privacy' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Breadcrumbs */}
      <Breadcrumb items={breadcrumbItems} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Policy List */}
        <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-4">
          <h3 className="font-bold text-slate-900 text-xs border-b border-slate-50 pb-2.5 uppercase tracking-wider">
            Các chính sách hỗ trợ
          </h3>
          <div className="flex flex-col gap-1.5 text-xs font-semibold">
            {policyLinks.map((link) => (
              <Link
                key={link.slug}
                to={`/policy/${link.slug}`}
                className={`flex justify-between items-center px-4 py-3 rounded-xl transition-all ${
                  slug === link.slug
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>{link.name}</span>
                <ArrowRight className={`w-3.5 h-3.5 ${slug === link.slug ? 'text-primary-600' : 'text-slate-300'}`} />
              </Link>
            ))}
          </div>
        </div>

        {/* Right Column: Policy details */}
        <div className="lg:col-span-8 bg-white p-6 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col gap-6">
          <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
            <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center flex-shrink-0">
              {activePolicy.icon}
            </div>
            <div>
              <h2 className="text-base md:text-lg font-black text-slate-900 leading-snug">
                {activePolicy.title}
              </h2>
              <p className="text-3xs text-slate-400 mt-1 uppercase tracking-wider font-bold">Điện Lạnh 247 Cam kết uy tín</p>
            </div>
          </div>

          <div>{activePolicy.content}</div>
        </div>
      </div>
    </div>
  );
}
