import { useState } from 'react';
import { CalendarDays, Check, Filter, Plus, Send } from 'lucide-react';
import {
  Alert,
  Badge,
  Breadcrumb,
  Button,
  Card,
  Drawer,
  Input,
  Modal,
  Pagination,
  Select,
  Skeleton,
  StatePanel,
  Tabs,
  Textarea,
  useDesignSystemToast,
} from '@/design-system';

const colors = [
  { name: 'Navy 950', value: '#061527', text: 'text-white' },
  { name: 'Blue 600', value: '#2563eb', text: 'text-white' },
  { name: 'Cyan 500', value: '#06b6d4', text: 'text-slate-950' },
  { name: 'Orange 500', value: '#f97316', text: 'text-slate-950' },
  { name: 'Canvas', value: '#f8fafc', text: 'text-slate-950' },
  { name: 'Surface', value: '#ffffff', text: 'text-slate-950' },
];

export default function DesignSystem() {
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [tab, setTab] = useState('overview');
  const [page, setPage] = useState(2);
  const { toast } = useDesignSystemToast();

  return (
    <div className="ds-container ds-section space-y-12" id="main-content">
      <Breadcrumb
        items={[
          { label: 'Trang chủ', href: '#/' },
          { label: 'Tài liệu giao diện' },
        ]}
      />

      <header className="max-w-3xl">
        <Badge variant="info">Phase 3 · Customer UI</Badge>
        <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
          Design System Điện Lạnh 247
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
          Bộ component tái sử dụng dành cho website khách hàng, tối ưu cho thao tác cảm ứng, bàn phím,
          trạng thái lỗi và bố cục responsive.
        </p>
      </header>

      <section aria-labelledby="colors-title" className="space-y-5">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-primary-600">Foundation</p>
          <h2 id="colors-title" className="mt-2 text-2xl font-black text-slate-950">
            Màu thương hiệu và token nền tảng
          </h2>
        </div>
        <div className="ds-demo-grid">
          {colors.map((color) => (
            <Card key={color.name} padding="sm">
              <div className="ds-demo-swatch" style={{ backgroundColor: color.value }} />
              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="font-bold text-slate-900">{color.name}</span>
                <code className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600">{color.value}</code>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section aria-labelledby="buttons-title" className="space-y-5">
        <h2 id="buttons-title" className="text-2xl font-black text-slate-950">
          Button và trạng thái tương tác
        </h2>
        <Card>
          <div className="flex flex-wrap gap-3">
            <Button leftIcon={<Plus className="h-4 w-4" />}>Đặt lịch ngay</Button>
            <Button variant="secondary">Xem dịch vụ</Button>
            <Button variant="outline">Tìm hiểu thêm</Button>
            <Button variant="ghost">Bỏ qua</Button>
            <Button variant="danger">Hủy yêu cầu</Button>
            <Button loading loadingLabel="Đang gửi">
              Gửi yêu cầu
            </Button>
            <Button disabled>Không khả dụng</Button>
            <Button size="icon" aria-label="Thêm lịch hẹn">
              <CalendarDays className="h-5 w-5" />
            </Button>
          </div>
        </Card>
      </section>

      <section aria-labelledby="forms-title" className="space-y-5">
        <h2 id="forms-title" className="text-2xl font-black text-slate-950">
          Form controls
        </h2>
        <Card>
          <div className="grid gap-5 md:grid-cols-2">
            <Input label="Họ và tên" required placeholder="Nguyễn Văn A" hint="Tên người tiếp nhận kỹ thuật viên." />
            <Input label="Số điện thoại" type="tel" placeholder="09xxxxxxxx" error="Số điện thoại chưa đúng định dạng." />
            <Select
              label="Loại dịch vụ"
              required
              defaultValue=""
              options={[
                { value: 'repair', label: 'Sửa chữa' },
                { value: 'cleaning', label: 'Vệ sinh' },
                { value: 'installation', label: 'Lắp đặt' },
              ]}
            />
            <Select label="Khu vực" disabled defaultValue="" options={[]} hint="Chọn tỉnh/thành trước khi chọn khu vực." />
            <div className="md:col-span-2">
              <Textarea label="Mô tả sự cố" placeholder="Mô tả dấu hiệu, tiếng ồn hoặc mã lỗi..." />
            </div>
          </div>
        </Card>
      </section>

      <section aria-labelledby="feedback-title" className="space-y-5">
        <h2 id="feedback-title" className="text-2xl font-black text-slate-950">
          Badge, Alert và Toast
        </h2>
        <Card>
          <div className="flex flex-wrap gap-2">
            <Badge>Mặc định</Badge>
            <Badge variant="info">Đã tiếp nhận</Badge>
            <Badge variant="success">Hoàn thành</Badge>
            <Badge variant="warning">Chờ linh kiện</Badge>
            <Badge variant="danger">Khẩn cấp</Badge>
          </div>
          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            <Alert variant="info" title="Lịch hẹn đã được giữ">
              Kỹ thuật viên sẽ gọi xác nhận trước khi đến.
            </Alert>
            <Alert variant="success" title="Gửi yêu cầu thành công">
              Mã yêu cầu của bạn là SR-240714.
            </Alert>
            <Alert variant="warning" title="Cần tắt nguồn thiết bị">
              Phát hiện mô tả có dấu hiệu mùi khét hoặc chập điện.
            </Alert>
            <Alert variant="danger" title="Không thể kết nối máy chủ">
              Kiểm tra mạng và thử gửi lại.
            </Alert>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() =>
                toast({
                  variant: 'success',
                  title: 'Đã lưu thông tin',
                  description: 'Thay đổi được đồng bộ vào hồ sơ khách hàng.',
                })
              }
            >
              Mở toast thành công
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                toast({
                  variant: 'danger',
                  title: 'Không thể gửi yêu cầu',
                  description: 'Vui lòng kiểm tra các trường bắt buộc.',
                })
              }
            >
              Mở toast lỗi
            </Button>
          </div>
        </Card>
      </section>

      <section aria-labelledby="overlay-title" className="space-y-5">
        <h2 id="overlay-title" className="text-2xl font-black text-slate-950">
          Modal, Drawer và Tabs
        </h2>
        <Card>
          <Tabs
            value={tab}
            onChange={setTab}
            items={[
              { id: 'overview', label: 'Tổng quan' },
              { id: 'history', label: 'Lịch sử', badge: 3 },
              { id: 'warranty', label: 'Bảo hành' },
              { id: 'disabled', label: 'Đã khóa', disabled: true },
            ]}
          />
          <div role="tabpanel" className="mt-5 rounded-2xl bg-slate-50 p-5 text-sm leading-6 text-slate-600">
            Nội dung tab hiện tại: <strong className="text-slate-900">{tab}</strong>. Dùng phím mũi tên trái/phải để chuyển tab.
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button onClick={() => setModalOpen(true)}>Mở Modal</Button>
            <Button variant="outline" leftIcon={<Filter className="h-4 w-4" />} onClick={() => setDrawerOpen(true)}>
              Mở Drawer
            </Button>
          </div>
        </Card>
      </section>

      <section aria-labelledby="states-title" className="space-y-5">
        <h2 id="states-title" className="text-2xl font-black text-slate-950">
          Loading, empty, error và permission denied
        </h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <StatePanel state="loading" />
          <StatePanel state="empty" action={<Button variant="outline">Khám phá dịch vụ</Button>} />
          <StatePanel state="error" action={<Button>Thử lại</Button>} />
          <StatePanel state="permission-denied" action={<Button variant="outline">Đăng nhập tài khoản khác</Button>} />
        </div>
      </section>

      <section aria-labelledby="cards-title" className="space-y-5">
        <h2 id="cards-title" className="text-2xl font-black text-slate-950">
          Card, Skeleton và Pagination
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card interactive>
            <Badge variant="success">Phổ biến</Badge>
            <h3 className="mt-4 text-lg font-black text-slate-950">Vệ sinh điều hòa</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">Quy trình 7 bước, kiểm tra áp suất và vệ sinh dàn nóng.</p>
            <Button className="mt-5" fullWidth rightIcon={<Send className="h-4 w-4" />}>
              Đặt lịch
            </Button>
          </Card>
          <Card>
            <Skeleton className="h-36 w-full" />
            <Skeleton className="mt-4 h-5 w-2/3" />
            <Skeleton className="mt-3 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-5/6" />
          </Card>
          <Card>
            <div className="flex h-full min-h-44 flex-col items-center justify-center text-center">
              <Check className="h-8 w-8 text-emerald-600" />
              <p className="mt-3 font-black text-slate-950">Không có lỗi tràn chữ</p>
              <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500 ds-safe-text">
                Chuỗi-rất-dài-không-có-khoảng-trắng-vẫn-được-xử-lý-an-toàn-trên-mobile.
              </p>
            </div>
          </Card>
        </div>
        <Pagination page={page} pageCount={8} onPageChange={setPage} />
      </section>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Xác nhận đặt lịch"
        description="Kiểm tra thông tin trước khi gửi yêu cầu."
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Quay lại
            </Button>
            <Button onClick={() => setModalOpen(false)}>Xác nhận</Button>
          </div>
        }
      >
        <Alert variant="info" title="Thời gian dự kiến phản hồi">
          Trong vòng 15 phút vào khung giờ làm việc.
        </Alert>
      </Modal>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Bộ lọc dịch vụ"
        description="Lọc theo loại thiết bị, khu vực và mức độ ưu tiên."
        footer={<Button fullWidth onClick={() => setDrawerOpen(false)}>Áp dụng bộ lọc</Button>}
      >
        <div className="grid gap-5">
          <Select
            label="Thiết bị"
            defaultValue=""
            options={[
              { value: 'air-conditioner', label: 'Điều hòa' },
              { value: 'washing-machine', label: 'Máy giặt' },
              { value: 'fridge', label: 'Tủ lạnh' },
            ]}
          />
          <Select
            label="Mức độ"
            defaultValue=""
            options={[
              { value: 'normal', label: 'Bình thường' },
              { value: 'urgent', label: 'Khẩn cấp' },
            ]}
          />
        </div>
      </Drawer>
    </div>
  );
}
