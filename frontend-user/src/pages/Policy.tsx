import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, ChevronRight, ShieldCheck } from 'lucide-react';
import Breadcrumb from '../components/common/Breadcrumb';
import useDocumentTitle from '../hooks/useDocumentTitle';

const policies = {
  warranty: {
    title: 'Chính sách bảo hành dịch vụ',
    summary: 'Quy định tiếp nhận và xử lý bảo hành sau sửa chữa, bảo dưỡng.',
    sections: [
      ['Phạm vi bảo hành', 'Hạng mục sửa chữa và linh kiện thay thế được bảo hành theo thời hạn ghi trên phiếu nghiệm thu.'],
      ['Điều kiện áp dụng', 'Yêu cầu còn trong thời hạn, đúng thiết bị và không phát sinh hư hỏng do sử dụng sai hướng dẫn hoặc tác động bên ngoài.'],
      ['Cách yêu cầu hỗ trợ', 'Khách hàng cung cấp mã yêu cầu và số điện thoại. Bộ phận kỹ thuật sẽ xác minh, hẹn lịch và thông báo rõ phương án xử lý.'],
    ],
  },
  'service-process': {
    title: 'Quy trình phục vụ tại nhà',
    summary: 'Các bước từ tiếp nhận yêu cầu đến nghiệm thu dịch vụ.',
    sections: [
      ['Tiếp nhận và xác nhận', 'Điện Lạnh 247 xác nhận thiết bị, tình trạng, địa chỉ và khung giờ trước khi phân công kỹ thuật viên.'],
      ['Kiểm tra và báo giá', 'Kỹ thuật viên chẩn đoán tại chỗ, giải thích phương án và chỉ thực hiện sau khi khách hàng đồng ý chi phí.'],
      ['Nghiệm thu và bảo hành', 'Khách hàng kiểm tra kết quả, xác nhận hoàn thành và nhận thông tin bảo hành minh bạch.'],
    ],
  },
  payment: {
    title: 'Chính sách thanh toán dịch vụ',
    summary: 'Chi phí chỉ được ghi nhận sau khi khách hàng duyệt báo giá.',
    sections: [
      ['Báo giá trước khi làm', 'Phí kiểm tra, tiền công và linh kiện dự kiến phải được thông báo rõ trước khi sửa chữa.'],
      ['Phương thức thanh toán', 'Khách hàng có thể thanh toán theo phương thức được xác nhận trên phiếu dịch vụ sau khi nghiệm thu.'],
      ['Đối soát', 'Mọi khoản đã thu và công nợ đều gắn với mã yêu cầu để khách hàng và cửa hàng có thể kiểm tra lại.'],
    ],
  },
  privacy: {
    title: 'Chính sách bảo mật thông tin',
    summary: 'Thông tin khách hàng chỉ được sử dụng để cung cấp và hỗ trợ dịch vụ.',
    sections: [
      ['Dữ liệu được sử dụng', 'Tên, số điện thoại, địa chỉ và thông tin thiết bị được dùng để xác nhận lịch, điều phối thợ và bảo hành.'],
      ['Giới hạn chia sẻ', 'Thông tin chỉ được cung cấp cho nhân sự phụ trách yêu cầu hoặc cơ quan có thẩm quyền theo quy định.'],
      ['Quyền của khách hàng', 'Khách hàng có thể liên hệ để kiểm tra hoặc yêu cầu cập nhật thông tin liên quan đến hồ sơ dịch vụ.'],
    ],
  },
} as const;

export default function Policy() {
  const { slug = 'warranty' } = useParams();
  const policy = policies[slug as keyof typeof policies] || policies.warranty;
  useDocumentTitle(`${policy.title} | Điện Lạnh 247`, policy.summary);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumb items={[{ name: policy.title }]} />
      <header className="rounded-3xl bg-slate-950 p-7 text-white sm:p-10">
        <ShieldCheck className="h-9 w-9 text-cyan-300" aria-hidden="true" />
        <h1 className="mt-5 text-3xl font-black tracking-tight">{policy.title}</h1>
        <p className="mt-3 max-w-2xl leading-7 text-slate-300">{policy.summary}</p>
      </header>
      <div className="mt-8 grid gap-4">
        {policy.sections.map(([title, description], index) => (
          <section key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex gap-4">
              <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-blue-600" aria-hidden="true" />
              <div><h2 className="font-bold text-slate-950">{index + 1}. {title}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{description}</p></div>
            </div>
          </section>
        ))}
      </div>
      <Link to="/service-booking" className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-xl bg-orange-500 px-5 font-bold text-white hover:bg-orange-600">Đặt lịch sửa chữa <ChevronRight className="h-4 w-4" /></Link>
    </div>
  );
}
