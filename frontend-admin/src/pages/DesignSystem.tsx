import { useMemo, useState } from 'react';
import { Eye, MoreHorizontal, Plus, SlidersHorizontal, Trash2, UserRound } from 'lucide-react';
import {
  Alert,
  Badge,
  Button,
  ConfirmDialog,
  DataTable,
  Drawer,
  FilterBar,
  FormLayout,
  Input,
  Modal,
  Select,
  Skeleton,
  StatePanel,
  Tabs,
  Textarea,
  useAdminToast,
  type DataTableColumn,
} from '@/design-system';

interface DemoRequest {
  id: string;
  customer: string;
  phone: string;
  service: string;
  district: string;
  priority: 'normal' | 'high' | 'urgent';
  status: 'new' | 'assigned' | 'in_progress' | 'completed';
  technician?: string;
}

const requests: DemoRequest[] = [
  {
    id: 'SR-260714-001',
    customer: 'Nguyễn Minh Anh',
    phone: '0912 345 678',
    service: 'Sửa điều hòa không lạnh',
    district: 'Quận Cầu Giấy',
    priority: 'urgent',
    status: 'new',
  },
  {
    id: 'SR-260714-002',
    customer: 'Trần Hoàng Nam',
    phone: '0988 321 456',
    service: 'Vệ sinh điều hòa',
    district: 'Quận Đống Đa',
    priority: 'normal',
    status: 'assigned',
    technician: 'Nguyễn Văn Hùng',
  },
  {
    id: 'SR-260714-003',
    customer: 'Công ty Minh Phát với tên doanh nghiệp rất dài để kiểm tra tràn chữ',
    phone: '0905 777 888',
    service: 'Bảo trì hệ thống điều hòa trung tâm',
    district: 'Quận Nam Từ Liêm',
    priority: 'high',
    status: 'in_progress',
    technician: 'Lê Quốc Bảo',
  },
];

const priorityMap = {
  normal: { label: 'Bình thường', variant: 'neutral' as const },
  high: { label: 'Cao', variant: 'warning' as const },
  urgent: { label: 'Khẩn cấp', variant: 'danger' as const },
};

const statusMap = {
  new: { label: 'Mới', variant: 'info' as const },
  assigned: { label: 'Đã phân công', variant: 'warning' as const },
  in_progress: { label: 'Đang thực hiện', variant: 'info' as const },
  completed: { label: 'Hoàn thành', variant: 'success' as const },
};

export default function DesignSystem() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [tab, setTab] = useState('components');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selected, setSelected] = useState<DemoRequest | null>(null);
  const { toast } = useAdminToast();

  const filteredRows = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return requests.filter((request) => {
      const matchesKeyword =
        !keyword ||
        [request.id, request.customer, request.phone, request.service, request.district]
          .join(' ')
          .toLowerCase()
          .includes(keyword);
      const matchesStatus = !status || request.status === status;
      return matchesKeyword && matchesStatus;
    });
  }, [query, status]);

  const columns: DataTableColumn<DemoRequest>[] = [
    {
      key: 'request',
      header: 'Yêu cầu',
      render: (row) => (
        <div className="min-w-44">
          <p className="font-black text-slate-950">{row.id}</p>
          <p className="mt-1 max-w-xs text-xs leading-5 text-slate-500 admin-safe-text">{row.service}</p>
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'Khách hàng',
      render: (row) => (
        <div className="min-w-40">
          <p className="font-bold text-slate-900 admin-safe-text">{row.customer}</p>
          <p className="mt-1 text-xs text-slate-500">{row.phone}</p>
        </div>
      ),
    },
    { key: 'district', header: 'Khu vực', render: (row) => row.district },
    {
      key: 'priority',
      header: 'Ưu tiên',
      render: (row) => <Badge variant={priorityMap[row.priority].variant}>{priorityMap[row.priority].label}</Badge>,
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (row) => <Badge variant={statusMap[row.status].variant}>{statusMap[row.status].label}</Badge>,
    },
    {
      key: 'technician',
      header: 'Kỹ thuật viên',
      render: (row) => row.technician || <span className="text-slate-400">Chưa phân công</span>,
    },
    {
      key: 'actions',
      header: 'Thao tác',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (row) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Xem ${row.id}`}
            onClick={(event) => {
              event.stopPropagation();
              setSelected(row);
              setModalOpen(true);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Thêm thao tác cho ${row.id}`}
            onClick={(event) => event.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="admin-demo-container space-y-8 py-6" id="admin-main-content">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Badge variant="info">Phase 3 · Admin UI</Badge>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Thư viện giao diện quản trị</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Bộ component phục vụ dashboard, form vận hành, bảng dữ liệu và các thao tác có rủi ro. Bảng tự chuyển thành card trên mobile để tránh tràn ngang.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" leftIcon={<SlidersHorizontal className="h-4 w-4" />} onClick={() => setDrawerOpen(true)}>
            Xem Filter Drawer
          </Button>
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setModalOpen(true)}>
            Tạo yêu cầu
          </Button>
        </div>
      </header>

      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { id: 'components', label: 'Components' },
          { id: 'table', label: 'Data Table', badge: requests.length },
          { id: 'forms', label: 'Form Layout' },
          { id: 'states', label: 'System States' },
        ]}
      />

      <section aria-labelledby="foundation-title" className="space-y-4">
        <h2 id="foundation-title" className="text-xl font-black text-slate-950">Foundation và feedback</h2>
        <div className="admin-demo-grid">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-black text-slate-950">Buttons</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="danger">Danger</Button>
              <Button loading>Loading</Button>
              <Button disabled>Disabled</Button>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-black text-slate-950">Badges</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge>Draft</Badge>
              <Badge variant="info">Đã tiếp nhận</Badge>
              <Badge variant="success">Hoàn thành</Badge>
              <Badge variant="warning">Gần quá SLA</Badge>
              <Badge variant="danger">Khẩn cấp</Badge>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-black text-slate-950">Toast</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => toast({ variant: 'success', title: 'Cập nhật thành công', description: 'Bản ghi đã được lưu.' })}
              >
                Success toast
              </Button>
              <Button
                variant="outline"
                onClick={() => toast({ variant: 'danger', title: 'Không thể cập nhật', description: 'Bạn không có quyền thực hiện thao tác.' })}
              >
                Error toast
              </Button>
            </div>
          </div>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <Alert variant="info" title="Dữ liệu được đồng bộ theo thời gian thực">Các thay đổi trạng thái sẽ được ghi vào nhật ký hoạt động.</Alert>
          <Alert variant="warning" title="Hành động cần xác nhận">Các thao tác xóa hoặc đóng yêu cầu phải dùng Confirm Dialog.</Alert>
        </div>
      </section>

      <section aria-labelledby="table-title" className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 id="table-title" className="text-xl font-black text-slate-950">Data Table và Filter Bar</h2>
          <Badge variant="neutral">Responsive cards on mobile</Badge>
        </div>
        <FilterBar
          searchValue={query}
          onSearchChange={setQuery}
          searchPlaceholder="Mã yêu cầu, khách hàng, số điện thoại..."
          filters={
            <Select
              aria-label="Lọc trạng thái"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              options={[
                { value: 'new', label: 'Mới' },
                { value: 'assigned', label: 'Đã phân công' },
                { value: 'in_progress', label: 'Đang thực hiện' },
                { value: 'completed', label: 'Hoàn thành' },
              ]}
              className="min-w-44"
            />
          }
          onOpenAdvanced={() => setDrawerOpen(true)}
          actions={<Button leftIcon={<Plus className="h-4 w-4" />}>Tạo mới</Button>}
        />
        <DataTable
          rows={filteredRows}
          columns={columns}
          rowKey={(row) => row.id}
          caption="Danh sách yêu cầu sửa chữa mẫu"
          onRowClick={(row) => {
            setSelected(row);
            setModalOpen(true);
          }}
        />
      </section>

      <section aria-labelledby="form-title" className="space-y-4">
        <h2 id="form-title" className="text-xl font-black text-slate-950">Form Layout</h2>
        <FormLayout
          title="Thông tin yêu cầu dịch vụ"
          description="Bố cục hai cột trên desktop và một cột trên mobile."
          actions={
            <>
              <Button variant="ghost">Hủy</Button>
              <Button onClick={() => toast({ variant: 'success', title: 'Đã lưu bản nháp' })}>Lưu thay đổi</Button>
            </>
          }
          aside={
            <div>
              <p className="font-black text-slate-950">Hướng dẫn nhập liệu</p>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-500">
                <li>Kiểm tra lại số điện thoại.</li>
                <li>Không ghi thông tin nhạy cảm vào ghi chú.</li>
                <li>Ưu tiên ảnh hiện trạng rõ nét.</li>
              </ul>
            </div>
          }
        >
          <Input label="Tên khách hàng" required placeholder="Nguyễn Văn A" />
          <Input label="Số điện thoại" required type="tel" placeholder="09xxxxxxxx" />
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
          <Select
            label="Mức ưu tiên"
            defaultValue="normal"
            options={[
              { value: 'normal', label: 'Bình thường' },
              { value: 'high', label: 'Cao' },
              { value: 'urgent', label: 'Khẩn cấp' },
            ]}
          />
          <div className="sm:col-span-2">
            <Textarea label="Ghi chú điều phối" hint="Chỉ hiển thị trong hệ thống quản trị." />
          </div>
        </FormLayout>
      </section>

      <section aria-labelledby="states-title" className="space-y-4">
        <h2 id="states-title" className="text-xl font-black text-slate-950">Loading, empty, error và permission denied</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <StatePanel state="loading" />
          <StatePanel state="empty" action={<Button variant="outline">Xóa bộ lọc</Button>} />
          <StatePanel state="error" action={<Button>Thử lại</Button>} />
          <StatePanel state="permission-denied" action={<Button variant="outline">Về Dashboard</Button>} />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="font-black text-slate-950">Skeleton table row</p>
          <div className="mt-4 grid gap-3">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        </div>
      </section>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selected ? `Chi tiết ${selected.id}` : 'Tạo yêu cầu mới'}
        description="Modal có focus trap, Escape để đóng và trả focus về nút mở."
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Đóng</Button>
            <Button onClick={() => setModalOpen(false)}>Lưu</Button>
          </div>
        }
      >
        {selected ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Khách hàng" value={selected.customer} readOnly />
            <Input label="Số điện thoại" value={selected.phone} readOnly />
            <div className="sm:col-span-2">
              <Textarea label="Nội dung" value={selected.service} readOnly />
            </div>
            <Button variant="danger" leftIcon={<Trash2 className="h-4 w-4" />} onClick={() => setConfirmOpen(true)}>
              Hủy yêu cầu
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            <Input label="Tên khách hàng" required />
            <Input label="Số điện thoại" required />
          </div>
        )}
      </Modal>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Bộ lọc nâng cao"
        description="Drawer tự khóa scroll nền và hỗ trợ Escape."
        footer={<Button fullWidth onClick={() => setDrawerOpen(false)}>Áp dụng bộ lọc</Button>}
      >
        <div className="grid gap-5">
          <Select
            label="Mức ưu tiên"
            defaultValue=""
            options={[
              { value: 'normal', label: 'Bình thường' },
              { value: 'high', label: 'Cao' },
              { value: 'urgent', label: 'Khẩn cấp' },
            ]}
          />
          <Select
            label="Kỹ thuật viên"
            defaultValue=""
            options={[
              { value: 'TECH-001', label: 'Nguyễn Văn Hùng' },
              { value: 'TECH-002', label: 'Lê Quốc Bảo' },
            ]}
          />
          <Input label="Từ ngày" type="date" />
          <Input label="Đến ngày" type="date" />
        </div>
      </Drawer>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          setModalOpen(false);
          toast({ variant: 'success', title: 'Đã hủy yêu cầu', description: selected?.id });
        }}
        title="Xác nhận hủy yêu cầu"
        description={`Bạn đang hủy ${selected?.id || 'yêu cầu đã chọn'}.`}
        confirmLabel="Hủy yêu cầu"
        danger
      />

      <div className="sr-only" aria-hidden="true">
        <UserRound />
      </div>
    </div>
  );
}
