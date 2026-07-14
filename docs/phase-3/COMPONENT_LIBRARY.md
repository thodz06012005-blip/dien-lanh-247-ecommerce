# Component Library

## 1. Import

### Customer app

```tsx
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
```

### Admin app

```tsx
import {
  AdminHeader,
  AdminSidebar,
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
  StatePanel,
  Tabs,
  Textarea,
  useAdminToast,
} from '@/design-system';
```

## 2. Button

### Props chính

| Prop | Giá trị | Mặc định |
|---|---|---|
| `variant` | primary, secondary, outline, ghost, danger | primary |
| `size` | sm, md, lg, icon | md |
| `loading` | boolean | false |
| `loadingLabel` | string | Đang xử lý |
| `fullWidth` | boolean | false |
| `leftIcon` | ReactNode | — |
| `rightIcon` | ReactNode | — |

### Quy tắc

- Một vùng chỉ nên có một primary action.
- `danger` chỉ dùng cho thao tác phá hủy hoặc không thể hoàn tác.
- Icon-only button phải có `aria-label`.
- Khi `loading`, component tự khóa thao tác và thêm `aria-busy`.

## 3. Input, Select và Textarea

Các component hỗ trợ:

- `label`.
- `hint`.
- `error`.
- `required`.
- `disabled`.
- Native HTML props và ref forwarding.

Khi có `error`, component tự thiết lập `aria-invalid` và nối thông báo bằng `aria-describedby`.

## 4. Modal và Drawer

### Modal

```tsx
<Modal
  open={open}
  onClose={() => setOpen(false)}
  title="Xác nhận cập nhật"
  description="Kiểm tra dữ liệu trước khi lưu."
  footer={<Button>Lưu</Button>}
>
  Nội dung
</Modal>
```

### Drawer

Dùng cho:

- Bộ lọc nâng cao.
- Xem nhanh chi tiết.
- Form phụ không cần rời trang.

Không dùng Drawer cho quy trình dài hoặc dữ liệu bắt buộc so sánh nhiều cột.

## 5. Tabs

- Dùng controlled state qua `value` và `onChange`.
- Hỗ trợ Arrow Left/Right.
- Tab disabled không nhận focus.
- Badge chỉ dùng để hiển thị số lượng ngắn.

## 6. Badge

| Variant | Trường hợp |
|---|---|
| neutral | Draft, inactive, metadata |
| info | New, confirmed, assigned |
| success | Completed, paid, active |
| warning | Waiting, SLA warning |
| danger | Urgent, overdue, failed |

Không truyền raw status trực tiếp cho người dùng; luôn map sang label tiếng Việt.

## 7. Alert

- `info`: thông tin hỗ trợ.
- `success`: kết quả thành công cần lưu ý.
- `warning`: cảnh báo có thể tiếp tục.
- `danger`: lỗi hoặc rủi ro cao.

Alert dài phải dùng đoạn văn ngắn, không nhồi nhiều CTA.

## 8. Toast

### Customer

```tsx
const { toast } = useDesignSystemToast();

toast({
  variant: 'success',
  title: 'Đã gửi yêu cầu',
  description: 'Mã yêu cầu SR-260714-001',
});
```

### Admin

```tsx
const { toast } = useAdminToast();
```

- Toast không thay thế lỗi inline trong form.
- Toast tự đóng sau 5 giây mặc định.
- Tối đa bốn toast hiển thị đồng thời.
- Error toast dùng `role="alert"`; loại khác dùng live region polite.

## 9. StatePanel

Các state:

- `loading`.
- `empty`.
- `error`.
- `permission-denied`.

Dùng `action` để đưa người dùng về bước tiếp theo, ví dụ thử lại, xóa bộ lọc hoặc quay về dashboard.

## 10. Breadcrumb

Customer Breadcrumb nhận danh sách `{ label, href? }`.

- Phần tử cuối có `aria-current="page"`.
- Trên mobile cho phép scroll ngang thay vì ép chữ xuống nhiều dòng.

## 11. Pagination

- Controlled bằng `page`, `pageCount`, `onPageChange`.
- Luôn có label Trang trước/Trang sau.
- Trang hiện tại có `aria-current="page"`.
- Không render toàn bộ hàng trăm số trang.

## 12. Card

Customer Card hỗ trợ:

- `interactive`: hover/focus visual cho card có hành động.
- `padding`: none, sm, md, lg.

Không gắn `onClick` vào card nếu bên trong có nhiều nút khác nhau.

## 13. DataTable

```tsx
const columns: DataTableColumn<Row>[] = [
  {
    key: 'customer',
    header: 'Khách hàng',
    render: (row) => row.customerName,
  },
];

<DataTable
  rows={rows}
  columns={columns}
  rowKey={(row) => row.id}
  caption="Danh sách yêu cầu"
/>
```

### Responsive

- Từ `md` trở lên: semantic table.
- Dưới `md`: mỗi row thành article card.
- `mobileLabel` có thể thay label cột dài.
- Nội dung dài dùng safe wrapping.

### Row click

Khi truyền `onRowClick`:

- Row có `tabIndex=0`.
- Enter và Space kích hoạt.
- Nút con phải `stopPropagation` nếu có hành động riêng.

## 14. FilterBar

Gồm:

- Search input.
- Quick filters.
- Advanced filter trigger.
- Action area.

Trên màn hình nhỏ mọi nhóm tự wrap hoặc chuyển cột, không cố giữ một hàng.

## 15. ConfirmDialog

Dùng cho:

- Xóa.
- Hủy yêu cầu.
- Đóng đơn.
- Reset dữ liệu.
- Thao tác nguy hiểm.

`danger=true` đổi CTA sang màu đỏ. Mô tả phải nêu rõ đối tượng bị tác động.

## 16. FormLayout

FormLayout có:

- Header title/description.
- Grid hai cột responsive.
- Action footer.
- Aside hướng dẫn hoặc summary.

Field cần full width dùng wrapper `sm:col-span-2`.

## 17. AdminSidebar và AdminHeader

Hai component được cung cấp để tái sử dụng trong layout admin hoặc module độc lập.

### AdminSidebar

- Nhận group và item.
- Hỗ trợ collapsed.
- Hỗ trợ mobile width.
- Active item dùng `aria-current="page"`.
- Item disabled không nhận focus.

### AdminHeader

- Menu toggle.
- Page title/eyebrow.
- Action slot.
- Notification button.
- Profile summary.

## 18. Quy ước mở rộng

Khi thêm component mới:

1. Dùng token hiện có trước khi thêm màu/radius mới.
2. Hỗ trợ disabled và focus-visible.
3. Kiểm tra 320px, 768px, 1024px và 1440px.
4. Thêm demo vào trang Design System.
5. Thêm architecture test cho semantic bắt buộc.
6. Không thêm package chỉ để giải quyết một component đơn giản.
