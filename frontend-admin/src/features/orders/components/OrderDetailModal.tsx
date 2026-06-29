import Modal from '../../../components/ui/Modal';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import type { Order } from '../types';

interface OrderDetailModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

const getStatusBadgeVariant = (status: string): 'warning' | 'success' | 'danger' | 'info' | 'primary' | 'neutral' => {
  switch (status) {
    case 'delivered':
      return 'success';
    case 'pending':
      return 'warning';
    case 'confirmed':
      return 'info';
    case 'processing':
      return 'primary';
    case 'shipping':
      return 'info';
    case 'cancelled':
      return 'danger';
    default:
      return 'neutral';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'delivered':
      return 'Đã giao hàng';
    case 'pending':
      return 'Chờ xác nhận';
    case 'confirmed':
      return 'Đã xác nhận';
    case 'processing':
      return 'Đang xử lý';
    case 'shipping':
      return 'Đang giao hàng';
    case 'cancelled':
      return 'Đã hủy';
    default:
      return status;
  }
};

const getPaymentStatusBadgeVariant = (status: string): 'warning' | 'success' | 'danger' | 'neutral' => {
  switch (status) {
    case 'paid':
      return 'success';
    case 'failed':
      return 'danger';
    case 'refunded':
      return 'neutral';
    case 'unpaid':
    default:
      return 'warning';
  }
};

const getPaymentStatusLabel = (status: string) => {
  switch (status) {
    case 'paid':
      return 'Đã thanh toán';
    case 'failed':
      return 'Thất bại';
    case 'refunded':
      return 'Đã hoàn tiền';
    case 'unpaid':
    default:
      return 'Chưa thanh toán';
  }
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

export default function OrderDetailModal({
  order,
  isOpen,
  onClose
}: OrderDetailModalProps) {
  if (!order) return null;

  return (
    <Modal
      title={`Chi tiết đơn hàng ${order.code}`}
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
    >
      <div className="flex flex-col gap-6 text-xs">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5">
            <h3 className="font-extrabold text-slate-900 text-[11px] mb-4 uppercase tracking-widest flex items-center gap-2">
              <div className="w-1.5 h-4 bg-primary-500 rounded-full"></div>
              Thông tin giao hàng
            </h3>
            <div className="text-xs text-slate-600 flex flex-col gap-3">
              <div className="flex justify-between items-start border-b border-slate-200/50 pb-2">
                <strong className="text-slate-500 font-bold shrink-0 w-24">Người nhận:</strong>
                <span className="font-extrabold text-slate-800 text-right">{order.customerName}</span>
              </div>
              <div className="flex justify-between items-start border-b border-slate-200/50 pb-2">
                <strong className="text-slate-500 font-bold shrink-0 w-24">Điện thoại:</strong>
                <span className="font-bold text-slate-700 text-right">{order.phone}</span>
              </div>
              <div className="flex justify-between items-start border-b border-slate-200/50 pb-2">
                <strong className="text-slate-500 font-bold shrink-0 w-24">Email:</strong>
                <span className="font-bold text-slate-700 text-right">{order.email || '—'}</span>
              </div>
              <div className="flex justify-between items-start">
                <strong className="text-slate-500 font-bold shrink-0 w-24">Địa chỉ:</strong>
                <span className="font-bold text-slate-700 text-right leading-relaxed">
                  {order.address.detail}<br/>{order.address.district}, {order.address.province}
                </span>
              </div>
              {order.note && (
                <div className="bg-amber-100/50 border border-amber-200/60 p-3 rounded-xl mt-2">
                  <strong className="text-amber-800 block text-[10px] uppercase font-bold tracking-widest mb-1">
                    Ghi chú khách hàng
                  </strong>
                  <span className="text-amber-900 font-medium text-xs italic">
                    "{order.note}"
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5">
            <h3 className="font-extrabold text-slate-900 text-[11px] mb-4 uppercase tracking-widest flex items-center gap-2">
              <div className="w-1.5 h-4 bg-cyan-500 rounded-full"></div>
              Trạng thái & Thanh toán
            </h3>
            <div className="flex flex-col gap-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-bold">Trạng thái đơn:</span>
                <Badge variant={getStatusBadgeVariant(order.status)} pill dot>
                  {getStatusLabel(order.status)}
                </Badge>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200/50 pt-3">
                <span className="text-slate-500 font-bold">Thanh toán:</span>
                <Badge variant={getPaymentStatusBadgeVariant(order.paymentStatus)} pill>
                  {getPaymentStatusLabel(order.paymentStatus)}
                </Badge>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200/50 pt-3">
                <span className="text-slate-500 font-bold">Phương thức:</span>
                <span className="font-extrabold text-slate-800 uppercase text-xs">{order.paymentMethod}</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-3 text-[10px] text-slate-500 font-bold flex flex-col gap-1.5 mt-2 shadow-sm">
                <div className="flex justify-between">
                  <span>Ngày đặt:</span>
                  <span className="text-slate-800">{new Date(order.createdAt).toLocaleString('vi-VN')}</span>
                </div>
                {order.deliveredAt && (
                  <div className="flex justify-between text-emerald-600 border-t border-slate-100 pt-1.5">
                    <span>Ngày giao:</span>
                    <span>{new Date(order.deliveredAt).toLocaleString('vi-VN')}</span>
                  </div>
                )}
                {order.cancelledAt && (
                  <div className="flex justify-between text-red-500 border-t border-slate-100 pt-1.5">
                    <span>Ngày hủy:</span>
                    <span>{new Date(order.cancelledAt).toLocaleString('vi-VN')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-extrabold text-slate-900 text-xs mb-3.5 uppercase tracking-wider border-b border-slate-100 pb-2">
            Sản phẩm đã mua
          </h3>
          <div className="overflow-x-auto border border-slate-100 rounded-2xl bg-white shadow-inner">
            <table className="min-w-full divide-y divide-slate-100 table-auto">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                    Ảnh
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                    Tên sản phẩm
                  </th>
                  <th className="px-4 py-3 text-right text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                    Đơn giá
                  </th>
                  <th className="px-4 py-3 text-center text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                    SL
                  </th>
                  <th className="px-4 py-3 text-right text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                    Thành tiền
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 bg-white text-[11px] text-slate-600 font-semibold">
                {order.items.map((item, idx) => (
                  <tr key={item.productId || idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <img
                        src={item.thumbnail}
                        alt={item.name}
                        className="w-10 h-10 object-cover rounded-lg border border-slate-100"
                      />
                    </td>
                    <td className="px-4 py-3 max-w-[200px] truncate">
                      <div className="font-extrabold text-slate-800 truncate" title={item.name}>
                        {item.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-bold mt-0.5">SKU: {item.sku}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-bold">
                      {formatCurrency(item.price)}
                    </td>
                    <td className="px-4 py-3 text-center font-bold">{item.quantity}</td>
                    <td className="px-4 py-3 text-right font-black text-slate-900">
                      {formatCurrency(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end pt-3">
          <div className="w-72 bg-slate-50 p-4.5 rounded-2xl border border-slate-100 flex flex-col gap-2.5 text-[11px] font-bold text-slate-600">
            <div className="flex justify-between">
              <span>Tạm tính:</span>
              <span className="text-slate-800">
                {formatCurrency(order.subtotal)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Phí giao hàng:</span>
              <span className="text-slate-800">
                +{formatCurrency(order.shippingFee)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Giảm giá voucher:</span>
              <span className="text-red-500 font-extrabold">
                -{formatCurrency(order.discount)}
              </span>
            </div>
            <hr className="border-slate-200/60 my-1" />
            <div className="flex justify-between text-xs font-black text-slate-900">
              <span>Tổng thanh toán:</span>
              <span className="text-primary-600">
                {formatCurrency(order.total)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={onClose} variant="primary">
            Đóng
          </Button>
        </div>
      </div>
    </Modal>
  );
}
