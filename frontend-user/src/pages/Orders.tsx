import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  CreditCard,
  MapPin,
  Package,
  Truck,
} from 'lucide-react';
import { useState } from 'react';
import Breadcrumb from '@/components/common/Breadcrumb';
import PageTransition from '@/components/common/PageTransition';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import api from '@/services/api';

interface AccountOrderItem {
  id: number;
  productName: string;
  variantName: string;
  price: number | string;
  quantity: number;
}

interface AccountOrder {
  id: number;
  orderNumber: string;
  subtotal: number | string;
  shippingFee: number | string;
  discount: number | string;
  totalAmount: number | string;
  status: string;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
  address?: {
    fullName: string;
    phone: string;
    province: string;
    district: string;
    ward: string;
    streetAddress: string;
  };
  payment?: {
    method: string;
    status: string;
    amount: number | string;
    paidAt?: string | null;
  } | null;
  shipping?: {
    carrier?: string | null;
    trackingNumber?: string | null;
    status: string;
    estimatedDate?: string | null;
    deliveredAt?: string | null;
  } | null;
  items: AccountOrderItem[];
}

const statusLabels: Record<string, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  PROCESSING: 'Đang xử lý',
  SHIPPED: 'Đang giao hàng',
  DELIVERED: 'Đã giao',
  CANCELLED: 'Đã hủy',
  REFUNDED: 'Đã hoàn tiền',
};

const statusClasses: Record<string, string> = {
  PENDING: 'border-amber-200 bg-amber-50 text-amber-700',
  CONFIRMED: 'border-blue-200 bg-blue-50 text-blue-700',
  PROCESSING: 'border-cyan-200 bg-cyan-50 text-cyan-700',
  SHIPPED: 'border-violet-200 bg-violet-50 text-violet-700',
  DELIVERED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  CANCELLED: 'border-red-200 bg-red-50 text-red-700',
  REFUNDED: 'border-slate-200 bg-slate-100 text-slate-700',
};

const money = (value: number | string | undefined) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value || 0));

export default function Orders({ isEmbed = false }: { isEmbed?: boolean }) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const listQuery = useQuery({
    queryKey: ['account-orders'],
    queryFn: async () => (await api.get('/account/orders')).data.data as AccountOrder[],
  });
  const detailQuery = useQuery({
    queryKey: ['account-order', selectedId],
    queryFn: async () => (await api.get(`/account/orders/${selectedId}`)).data.data as AccountOrder,
    enabled: selectedId !== null,
  });

  const orders = listQuery.data || [];
  const selected = detailQuery.data;

  const content = selectedId !== null ? (
    <div className="space-y-6">
      <button type="button" onClick={() => setSelectedId(null)} className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500 hover:text-primary-600">
        <ArrowLeft className="h-4 w-4" /> Quay lại danh sách
      </button>
      {detailQuery.isLoading || !selected ? (
        <><Skeleton className="h-36 rounded-3xl" /><Skeleton className="h-72 rounded-3xl" /></>
      ) : (
        <>
          <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-7 text-white shadow-xl sm:p-9">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-500/15 blur-3xl" />
            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div><p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">Đơn hàng thuộc tài khoản</p><h1 className="mt-3 font-mono text-2xl font-black">{selected.orderNumber}</h1><p className="mt-2 text-sm text-slate-400">Tạo lúc {new Date(selected.createdAt).toLocaleString('vi-VN')}</p></div>
              <span className={`w-fit rounded-full border px-3 py-1.5 text-xs font-black ${statusClasses[selected.status] || 'border-slate-600 bg-white/5 text-white'}`}>{statusLabels[selected.status] || selected.status}</span>
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <h2 className="text-lg font-black text-slate-950">Sản phẩm</h2>
              <div className="mt-5 divide-y divide-slate-100">
                {selected.items.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0">
                    <div><strong className="text-sm text-slate-900">{item.productName}</strong><p className="mt-1 text-xs text-slate-500">{item.variantName} · Số lượng {item.quantity}</p></div>
                    <strong className="shrink-0 text-sm text-primary-700">{money(Number(item.price) * item.quantity)}</strong>
                  </div>
                ))}
              </div>
            </section>

            <div className="space-y-6">
              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-primary-600" /><h2 className="font-black text-slate-950">Thanh toán</h2></div>
                <div className="mt-4 space-y-3 text-sm"><Row label="Tạm tính" value={money(selected.subtotal)} /><Row label="Phí giao hàng" value={money(selected.shippingFee)} /><Row label="Giảm giá" value={`-${money(selected.discount)}`} /><div className="flex justify-between border-t border-slate-100 pt-3"><span className="font-bold text-slate-600">Tổng cộng</span><strong className="text-lg text-primary-700">{money(selected.totalAmount)}</strong></div></div>
                {selected.payment && <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-xs leading-6 text-slate-600">Phương thức: <strong>{selected.payment.method}</strong><br />Trạng thái: <strong>{selected.payment.status}</strong></div>}
              </section>

              {selected.address && <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center gap-2"><MapPin className="h-5 w-5 text-primary-600" /><h2 className="font-black text-slate-950">Địa chỉ nhận hàng</h2></div><p className="mt-4 text-sm font-bold text-slate-800">{selected.address.fullName} · {selected.address.phone}</p><p className="mt-2 text-sm leading-6 text-slate-500">{selected.address.streetAddress}, {selected.address.ward}, {selected.address.district}, {selected.address.province}</p></section>}

              {selected.shipping && <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center gap-2"><Truck className="h-5 w-5 text-primary-600" /><h2 className="font-black text-slate-950">Vận chuyển</h2></div><p className="mt-4 text-sm text-slate-600">{selected.shipping.carrier || 'Đơn vị vận chuyển đang được phân công'}</p>{selected.shipping.trackingNumber && <p className="mt-2 font-mono text-sm font-black text-slate-900">{selected.shipping.trackingNumber}</p>}</section>}
            </div>
          </div>
        </>
      )}
    </div>
  ) : (
    <div>
      {!isEmbed && (
        <>
          <Breadcrumb items={[{ name: 'Đơn hàng của tôi' }]} />
          <section className="relative mb-8 overflow-hidden rounded-[2rem] bg-slate-950 p-7 text-white shadow-xl sm:p-10">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-500/15 blur-3xl" />
            <div className="relative"><p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">Lịch sử giao dịch bảo mật</p><h1 className="mt-3 text-3xl font-black">Đơn hàng của tôi</h1><p className="mt-2 max-w-xl text-sm leading-7 text-slate-300">Danh sách được truy vấn bằng userId trong JWT. Số điện thoại không còn được truyền qua URL để xác định quyền xem.</p></div>
          </section>
        </>
      )}

      {listQuery.isLoading ? (
        <div className="space-y-4"><Skeleton className="h-28 rounded-3xl" /><Skeleton className="h-28 rounded-3xl" /></div>
      ) : listQuery.isError ? (
        <Empty title="Không thể tải đơn hàng" body="Phiên đăng nhập hoặc kết nối đang gián đoạn." action="Thử lại" onAction={() => listQuery.refetch()} />
      ) : orders.length === 0 ? (
        <Empty title="Chưa có đơn hàng" body="Các đơn hàng thuộc đúng tài khoản sẽ xuất hiện tại đây." action="Xem sản phẩm" onAction={() => { window.location.hash = '#/products'; }} />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <button key={order.id} type="button" onClick={() => setSelectedId(order.id)} className="flex w-full flex-col gap-5 rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-lg sm:flex-row sm:items-center">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-primary-600"><Package className="h-6 w-6" /></div>
              <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><strong className="font-mono text-sm text-slate-950">{order.orderNumber}</strong><span className={`rounded-full border px-2.5 py-1 text-[10px] font-black ${statusClasses[order.status] || 'border-slate-200 bg-slate-50 text-slate-700'}`}>{statusLabels[order.status] || order.status}</span></div><p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500"><CalendarDays className="h-3.5 w-3.5" />{new Date(order.createdAt).toLocaleString('vi-VN')} · {order.items.length} dòng sản phẩm</p></div>
              <div className="flex items-center justify-between gap-5 border-t border-slate-100 pt-4 sm:border-0 sm:pt-0"><strong className="text-primary-700">{money(order.totalAmount)}</strong><ChevronRight className="h-5 w-5 text-slate-400" /></div>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return <PageTransition><div className={isEmbed ? 'w-full' : 'mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8'}>{content}</div></PageTransition>;
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-4"><span className="text-slate-500">{label}</span><strong className="text-slate-900">{value}</strong></div>;
}

function Empty({ title, body, action, onAction }: { title: string; body: string; action: string; onAction: () => void }) {
  return <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"><ClipboardList className="h-7 w-7" /></div><h2 className="mt-5 text-xl font-black text-slate-900">{title}</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{body}</p><Button className="mt-6" leftIcon={<CheckCircle2 className="h-4 w-4" />} onClick={onAction}>{action}</Button></div>;
}
