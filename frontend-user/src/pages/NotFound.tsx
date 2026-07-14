import { Link } from 'react-router-dom';
import { ArrowLeft, Home, SearchX } from 'lucide-react';
import useDocumentTitle from '@/hooks/useDocumentTitle';

export default function NotFound() {
  useDocumentTitle('Không tìm thấy trang | Điện Lạnh 247');

  return (
    <section className="relative isolate flex min-h-[620px] items-center overflow-hidden bg-[#061527] px-4 py-20 text-white sm:px-6">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_75%_20%,rgba(6,182,212,0.22),transparent_32%),radial-gradient(circle_at_15%_85%,rgba(37,99,235,0.22),transparent_35%)]" />
      <div className="mx-auto max-w-3xl text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-cyan-300">
          <SearchX aria-hidden="true" className="h-8 w-8" />
        </div>
        <p className="mt-7 text-sm font-black uppercase tracking-[0.25em] text-cyan-300">Lỗi 404</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Trang bạn tìm không tồn tại</h1>
        <p className="mx-auto mt-5 max-w-xl text-base leading-8 text-slate-300">
          Đường dẫn có thể đã thay đổi hoặc nội dung chưa được công bố. Hãy quay lại trang chủ hoặc xem danh sách dịch vụ.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 text-sm font-black text-white hover:bg-orange-600">
            <Home aria-hidden="true" className="h-4 w-4" /> Về trang chủ
          </Link>
          <Link to="/services" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 text-sm font-black text-white hover:bg-white/15">
            <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Xem dịch vụ
          </Link>
        </div>
      </div>
    </section>
  );
}
