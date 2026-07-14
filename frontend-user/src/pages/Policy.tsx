import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  FileCheck2,
  Lock,
  RotateCcw,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import Breadcrumb from '@/components/common/Breadcrumb';
import useDocumentTitle from '@/hooks/useDocumentTitle';

interface PolicySection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
}

interface PolicyDocument {
  title: string;
  summary: string;
  updatedAt: string;
  icon: React.ElementType;
  sections: PolicySection[];
}

const policies: Record<string, PolicyDocument> = {
  warranty: {
    title: 'Chính sách bảo hành dịch vụ',
    summary: 'Quy định phạm vi, thời hạn và cách tiếp nhận bảo hành cho các dịch vụ kỹ thuật do Điện Lạnh 247 thực hiện.',
    updatedAt: '14/07/2026',
    icon: ShieldCheck,
    sections: [
      {
        heading: '1. Phạm vi áp dụng',
        paragraphs: ['Chính sách áp dụng cho công việc sửa chữa, vệ sinh, lắp đặt và thay thế linh kiện được ghi nhận trên phiếu hoặc yêu cầu dịch vụ.'],
        bullets: [
          'Thời hạn bảo hành phụ thuộc loại công việc và linh kiện sử dụng.',
          'Thông tin bảo hành phải gắn với mã yêu cầu, số điện thoại hoặc chứng từ bàn giao.',
          'Bảo hành chỉ áp dụng cho hạng mục đã được Điện Lạnh 247 thực hiện.',
        ],
      },
      {
        heading: '2. Thời hạn tham khảo',
        bullets: [
          'Vệ sinh và xử lý đường thoát nước: theo nội dung bàn giao, thông thường 30 ngày.',
          'Sửa chữa và thay thế linh kiện: thông thường 3–12 tháng tùy hạng mục.',
          'Lắp đặt và di dời thiết bị: thông thường 12 tháng đối với lỗi kỹ thuật thi công.',
        ],
      },
      {
        heading: '3. Trường hợp không thuộc phạm vi bảo hành',
        bullets: [
          'Thiết bị bị can thiệp bởi bên thứ ba sau thời điểm bàn giao.',
          'Hư hỏng do nguồn điện, thiên tai, cháy nổ, côn trùng hoặc sử dụng sai hướng dẫn.',
          'Sự cố phát sinh ở hạng mục khác với nội dung đã thực hiện trước đó.',
        ],
      },
      {
        heading: '4. Cách yêu cầu bảo hành',
        paragraphs: ['Khách hàng liên hệ hotline hoặc gửi yêu cầu kèm mã dịch vụ, số điện thoại và hình ảnh tình trạng. Đội ngũ sẽ xác minh và sắp xếp lịch kiểm tra phù hợp.'],
      },
    ],
  },
  privacy: {
    title: 'Chính sách bảo mật thông tin',
    summary: 'Mô tả loại dữ liệu được thu thập, mục đích sử dụng, thời gian lưu trữ và quyền của khách hàng.',
    updatedAt: '14/07/2026',
    icon: Lock,
    sections: [
      {
        heading: '1. Thông tin được thu thập',
        bullets: [
          'Họ tên, số điện thoại, email và địa chỉ phục vụ.',
          'Thông tin thiết bị, mô tả sự cố, hình ảnh và lịch hẹn.',
          'Lịch sử trao đổi, báo giá, thanh toán và bảo hành liên quan đến yêu cầu.',
        ],
      },
      {
        heading: '2. Mục đích sử dụng',
        bullets: [
          'Xác nhận khách hàng và điều phối kỹ thuật viên.',
          'Liên hệ tư vấn, báo giá, thực hiện và bảo hành dịch vụ.',
          'Cải thiện quy trình, chất lượng hỗ trợ và an toàn hệ thống.',
        ],
      },
      {
        heading: '3. Chia sẻ thông tin',
        paragraphs: ['Điện Lạnh 247 không bán dữ liệu cá nhân. Thông tin chỉ được chia sẻ cho nhân sự hoặc đối tác cần thiết để thực hiện dịch vụ, hoặc khi có yêu cầu hợp pháp từ cơ quan có thẩm quyền.'],
      },
      {
        heading: '4. Quyền của khách hàng',
        bullets: [
          'Yêu cầu xem, cập nhật hoặc điều chỉnh thông tin đã cung cấp.',
          'Yêu cầu ngừng nhận nội dung tiếp thị.',
          'Gửi phản ánh về cách dữ liệu được xử lý qua kênh liên hệ chính thức.',
        ],
      },
    ],
  },
  terms: {
    title: 'Điều khoản sử dụng website và dịch vụ',
    summary: 'Các nguyên tắc khi sử dụng website, gửi yêu cầu, nhận báo giá và sử dụng dịch vụ Điện Lạnh 247.',
    updatedAt: '14/07/2026',
    icon: FileCheck2,
    sections: [
      {
        heading: '1. Thông tin trên website',
        paragraphs: ['Nội dung, mức giá và thời gian phản hồi trên website mang tính tham khảo. Báo giá chính thức được xác nhận sau khi có đủ thông tin hoặc sau khi kỹ thuật viên kiểm tra thực tế.'],
      },
      {
        heading: '2. Trách nhiệm của khách hàng',
        bullets: [
          'Cung cấp thông tin liên hệ và tình trạng thiết bị chính xác.',
          'Bảo đảm khu vực làm việc an toàn và có người đại diện xác nhận.',
          'Kiểm tra nội dung báo giá, nghiệm thu và thông tin bảo hành trước khi hoàn tất.',
        ],
      },
      {
        heading: '3. Xác nhận và thay đổi lịch',
        paragraphs: ['Lịch hẹn chỉ được xem là xác nhận khi có phản hồi từ Điện Lạnh 247. Hai bên có thể điều chỉnh lịch khi phát sinh điều kiện thời tiết, giao thông, an toàn hoặc yêu cầu kỹ thuật đặc biệt.'],
      },
      {
        heading: '4. Giới hạn trách nhiệm',
        paragraphs: ['Điện Lạnh 247 chịu trách nhiệm trong phạm vi hạng mục đã thống nhất và thực hiện. Các vấn đề ngoài phạm vi, lỗi tiềm ẩn hoặc hư hỏng do nguyên nhân khách quan sẽ được thông báo và đề xuất phương án riêng.'],
      },
    ],
  },
  shipping: {
    title: 'Chính sách giao nhận và lắp đặt',
    summary: 'Quy định thời gian giao nhận, xác nhận địa điểm, vật tư và nghiệm thu khi giao lắp thiết bị.',
    updatedAt: '14/07/2026',
    icon: Truck,
    sections: [
      { heading: '1. Phạm vi giao nhận', paragraphs: ['Thời gian giao nhận phụ thuộc khu vực, tình trạng hàng hóa, điều kiện vận chuyển và lịch lắp đặt đã xác nhận.'] },
      { heading: '2. Kiểm tra khi nhận', bullets: ['Kiểm tra model, số lượng và tình trạng bao bì.', 'Xác nhận vật tư phát sinh trước khi lắp đặt.', 'Chạy thử và ký nhận sau khi hoàn tất.'] },
      { heading: '3. Thay đổi lịch', paragraphs: ['Khách hàng nên thông báo sớm khi cần đổi lịch. Các trường hợp không bảo đảm an toàn thi công có thể được hẹn lại.'] },
    ],
  },
  return: {
    title: 'Chính sách đổi trả sản phẩm',
    summary: 'Điều kiện tiếp nhận đổi trả đối với sản phẩm do Điện Lạnh 247 cung cấp.',
    updatedAt: '14/07/2026',
    icon: RotateCcw,
    sections: [
      { heading: '1. Điều kiện tiếp nhận', bullets: ['Sản phẩm thuộc đơn hàng hợp lệ.', 'Tình trạng, phụ kiện và chứng từ được giữ đầy đủ.', 'Yêu cầu được gửi trong thời hạn áp dụng của từng nhóm sản phẩm.'] },
      { heading: '2. Quy trình xác minh', paragraphs: ['Đội ngũ tiếp nhận thông tin, kiểm tra tình trạng và phối hợp nhà sản xuất hoặc nhà cung cấp khi cần. Kết quả được thông báo trước khi thực hiện đổi hoặc hoàn trả.'] },
    ],
  },
  payment: {
    title: 'Chính sách thanh toán',
    summary: 'Các phương thức thanh toán và nguyên tắc xác nhận chi phí cho sản phẩm, vật tư và dịch vụ.',
    updatedAt: '14/07/2026',
    icon: CreditCard,
    sections: [
      { heading: '1. Phương thức', bullets: ['Tiền mặt sau khi nghiệm thu.', 'Chuyển khoản theo thông tin xác nhận chính thức.', 'Phương thức khác nếu được ghi rõ trên đơn hàng hoặc hợp đồng.'] },
      { heading: '2. Xác nhận chi phí', paragraphs: ['Mọi chi phí phát sinh cần được thông báo và đồng ý trước khi thực hiện. Khách hàng nên lưu chứng từ hoặc xác nhận thanh toán để đối chiếu khi cần.'] },
    ],
  },
};

const policyNavigation = [
  { slug: 'warranty', label: 'Bảo hành' },
  { slug: 'privacy', label: 'Bảo mật' },
  { slug: 'terms', label: 'Điều khoản' },
  { slug: 'shipping', label: 'Giao nhận' },
  { slug: 'return', label: 'Đổi trả' },
  { slug: 'payment', label: 'Thanh toán' },
];

export default function Policy() {
  const { slug = 'warranty' } = useParams<{ slug: string }>();
  const document = policies[slug];
  useDocumentTitle(document ? `${document.title} | Điện Lạnh 247` : 'Chính sách không tồn tại');

  if (!document) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-primary-600">Không tìm thấy nội dung</p>
        <h1 className="mt-3 text-3xl font-black text-slate-950">Chính sách này chưa được công bố</h1>
        <p className="mt-4 text-sm leading-6 text-slate-600">Hãy quay lại trang chính sách bảo hành hoặc liên hệ để được hỗ trợ.</p>
        <Link to="/policy/warranty" className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary-600 px-5 text-sm font-black text-white">
          <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Xem chính sách bảo hành
        </Link>
      </section>
    );
  }

  const Icon = document.icon;

  return (
    <div className="bg-slate-50">
      <section className="bg-white py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Breadcrumb items={[{ name: 'Chính sách' }, { name: document.title }]} />
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[240px_1fr] lg:px-8 lg:py-16">
        <aside className="lg:sticky lg:top-32 lg:self-start" aria-label="Danh sách chính sách">
          <nav className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            {policyNavigation.map((item) => (
              <Link
                key={item.slug}
                to={`/policy/${item.slug}`}
                aria-current={item.slug === slug ? 'page' : undefined}
                className={`block rounded-xl px-4 py-3 text-sm font-black transition ${
                  item.slug === slug ? 'bg-primary-600 text-white' : 'text-slate-700 hover:bg-slate-100 hover:text-primary-700'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <article className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-200 bg-[#061527] p-6 text-white sm:p-9">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-cyan-300">
              <Icon aria-hidden="true" className="h-7 w-7" />
            </span>
            <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">{document.title}</h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">{document.summary}</p>
            <p className="mt-4 text-xs font-bold text-slate-400">Cập nhật lần cuối: {document.updatedAt}</p>
          </header>

          <div className="p-6 sm:p-9">
            <div className="space-y-9">
              {document.sections.map((section) => (
                <section key={section.heading}>
                  <h2 className="text-xl font-black text-slate-950">{section.heading}</h2>
                  {section.paragraphs?.map((paragraph) => (
                    <p key={paragraph} className="mt-3 text-sm leading-7 text-slate-700">{paragraph}</p>
                  ))}
                  {section.bullets && (
                    <ul className="mt-4 grid gap-3">
                      {section.bullets.map((bullet) => (
                        <li key={bullet} className="flex items-start gap-3 text-sm leading-7 text-slate-700">
                          <CheckCircle2 aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}
            </div>

            <div className="mt-12 rounded-2xl border border-blue-100 bg-blue-50 p-6">
              <h2 className="text-lg font-black text-slate-950">Cần giải thích thêm?</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Gửi câu hỏi kèm mã đơn hàng hoặc mã yêu cầu để được kiểm tra chính xác theo trường hợp thực tế.</p>
              <Link to="/contact" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-primary-600 px-5 text-sm font-black text-white">Liên hệ hỗ trợ</Link>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
