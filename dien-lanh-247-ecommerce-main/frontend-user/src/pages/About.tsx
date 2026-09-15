import { ShieldCheck, Users, Zap, Award, Sparkles, Building } from 'lucide-react';
import Breadcrumb from '../components/common/Breadcrumb';

export default function About() {
  const stats = [
    { num: '10+', label: 'Năm hoạt động' },
    { num: '50.000+', label: 'Khách hàng hài lòng' },
    { num: '50+', label: 'Kỹ thuật viên lành nghề' },
    { num: '03+', label: 'Chi nhánh lớn tại HN & HCM' },
  ];

  const values = [
    {
      icon: <Award className="w-6 h-6 text-primary-600" />,
      title: 'Chất lượng hàng đầu',
      desc: 'Mọi thiết bị điện máy bán ra đều cam kết chính hãng 100%, bảo hành hãng và bảo hành lắp ráp dài lâu.',
    },
    {
      icon: <Zap className="w-6 h-6 text-primary-600" />,
      title: 'Tốc độ phục vụ',
      desc: 'Chúng tôi hiểu mùa hè oi bức thế nào, vì vậy quy trình giao lắp được thiết lập khẩn cấp tối đa chỉ trong 2 giờ.',
    },
    {
      icon: <Users className="w-6 h-6 text-primary-600" />,
      title: 'Nhân sự chuẩn mực',
      desc: 'Kỹ thuật viên được đào tạo chuyên môn định kỳ, văn hóa làm việc trung thực, nhiệt tình và giữ gìn vệ sinh căn hộ khách.',
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-primary-600" />,
      title: 'Trách nhiệm trọn đời',
      desc: 'Không dừng lại sau khi lắp ráp xong, chúng tôi cung cấp gói chăm sóc bảo trì định kỳ trọn đời cho thiết bị nhà bạn.',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-14">
      {/* Breadcrumbs */}
      <div>
        <Breadcrumb items={[{ name: 'Giới thiệu' }]} />
        <h1 className="text-xl md:text-2xl font-black text-slate-900 mt-2">
          Giới thiệu về Điện Lạnh 247
        </h1>
      </div>

      {/* Grid Story and Image */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-6 flex flex-col gap-5 text-xs text-slate-600 leading-relaxed">
          <span className="text-3xs font-extrabold text-primary-600 uppercase tracking-widest flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 fill-primary-600/10" />
            Lịch sử hình thành & Phát triển
          </span>
          <h2 className="text-lg md:text-xl font-bold text-slate-900">
            Hơn 10 năm đồng hành mang làn gió mát lành tới gia đình Việt
          </h2>
          <p>
            Được thành lập từ năm 2016, khởi điểm từ một đội thợ sửa chữa điều hòa nhỏ tại Hà Nội, <strong>Điện Lạnh 247</strong> đã không ngừng nỗ lực, cải tiến quy trình phục vụ để vươn lên thành một trong những hệ thống cung cấp thiết bị điện máy và dịch vụ bảo trì uy tín hàng đầu tại Việt Nam.
          </p>
          <p>
            Chúng tôi nhận thấy khách hàng khi mua điều hòa, tủ lạnh lớn thường gặp khó khăn trong khâu lắp đặt: thợ ngoài lắp sai kỹ thuật gây rò gas, chảy nước dàn lạnh, hoặc bảo hành chậm trễ trong những ngày nắng nóng đỉnh điểm. Vì vậy, Điện Lạnh 247 tiên phong mô hình <strong>"Sản phẩm chuẩn hãng - Lắp ráp chuẩn kỹ thuật - Bảo hành kép siêu tốc"</strong>.
          </p>
          <p>
            Đến nay, chúng tôi tự hào được phục vụ hàng vạn hộ gia đình, căn hộ trọ, văn phòng công ty và nhận được sự hài lòng tối đa của đối tác nhờ tay nghề kỹ thuật vững vàng và sự trung thực tuyệt đối của nhân viên.
          </p>
        </div>

        <div className="lg:col-span-6 aspect-video rounded-[2.5rem] overflow-hidden border border-slate-200 shadow-lg relative bg-slate-100 flex items-center justify-center">
          <img
            src="https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=1200&auto=format&fit=crop"
            alt="Dien Lanh Technical work team"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-primary-950/10" />
        </div>
      </section>

      {/* Stats Numbers Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-6 bg-primary-900 text-white rounded-[2rem] p-8 md:p-12 text-center shadow-lg shadow-primary-500/10">
        {stats.map((st, idx) => (
          <div key={idx} className="flex flex-col gap-1">
            <span className="text-3xl md:text-4xl font-black text-primary-300 font-mono">
              {st.num}
            </span>
            <span className="text-2xs text-slate-300">{st.label}</span>
          </div>
        ))}
      </section>

      {/* Core Values Section */}
      <section className="flex flex-col gap-10">
        <div className="text-center max-w-xl mx-auto">
          <span className="text-3xs font-extrabold text-primary-600 uppercase tracking-widest">
            Giá trị cốt lõi
          </span>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 mt-2">
            Kim chỉ nam trong mọi hành động
          </h2>
          <p className="text-xs text-slate-500 mt-3 leading-relaxed">
            Điện Lạnh 247 cam kết duy trì những tiêu chuẩn dịch vụ khắt khe nhất để bảo vệ lợi ích tối đa của khách hàng.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {values.map((val, idx) => (
            <div key={idx} className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex gap-4 items-start hover:shadow-xl transition-all">
              <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600 flex-shrink-0">
                {val.icon}
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-xs font-bold text-slate-900">{val.title}</h3>
                <p className="text-2xs text-slate-500 leading-relaxed">{val.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Branch networks */}
      <section className="bg-slate-50 border border-slate-200 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex gap-4 items-center">
          <div className="w-12 h-12 bg-white rounded-2xl border border-slate-200 flex items-center justify-center text-primary-600 flex-shrink-0 shadow-sm">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">Chi nhánh phân phối toàn quốc</h4>
            <p className="text-2xs text-slate-500 mt-0.5 max-w-md leading-relaxed">
              Mạng lưới chi nhánh Điện Lạnh 247 được trang bị đầy đủ kho linh kiện thay thế và xe tải vận chuyển chuyên dụng sẵn sàng phục vụ.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <span className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-3xs font-extrabold text-slate-600">
            Hà Nội
          </span>
          <span className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-3xs font-extrabold text-slate-600">
            TP. Hồ Chí Minh
          </span>
        </div>
      </section>

    </div>
  );
}
