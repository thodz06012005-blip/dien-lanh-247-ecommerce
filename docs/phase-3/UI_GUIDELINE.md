# UI Guideline — Điện Lạnh 247

## 1. Nguyên tắc thiết kế

Giao diện phải thể hiện bốn đặc tính:

1. **Tin cậy:** thông tin rõ, trạng thái minh bạch, CTA không gây nhầm lẫn.
2. **Kỹ thuật nhưng thân thiện:** màu xanh lạnh và navy tạo cảm giác chuyên nghiệp; màu cam chỉ dùng cho hành động cần chú ý.
3. **Nhanh và dễ thao tác:** mục tiêu chính của website khách hàng là tìm dịch vụ và đặt lịch; mục tiêu chính của admin là xử lý yêu cầu với ít thao tác.
4. **Ổn định trên mọi thiết bị:** nội dung không phụ thuộc hover, không bắt buộc màn hình rộng và không dùng animation để truyền tải thông tin bắt buộc.

## 2. Màu thương hiệu

### Brand core

| Token | Giá trị | Mục đích |
|---|---:|---|
| Navy 950 | `#061527` | Header tối, sidebar admin, nền premium |
| Navy 900 | `#0C1B2E` | Gradient sidebar và section tối |
| Blue 700 | `#1D4ED8` | Active/pressed |
| Blue 600 | `#2563EB` | Primary action, link, focus |
| Blue 500 | `#3B82F6` | Accent phụ, biểu đồ |
| Cyan 500 | `#06B6D4` | Điểm nhấn lạnh, icon kỹ thuật |
| Orange 500 | `#F97316` | CTA thương mại, hotline, cảnh báo chú ý |

### Neutral

| Token | Giá trị | Mục đích |
|---|---:|---|
| Slate 950 | `#020617` | Tiêu đề quan trọng |
| Slate 900 | `#0F172A` | Nội dung chính |
| Slate 700 | `#334155` | Nội dung phụ đậm |
| Slate 500 | `#64748B` | Mô tả, metadata |
| Slate 300 | `#CBD5E1` | Border mạnh |
| Slate 200 | `#E2E8F0` | Border mặc định |
| Slate 100 | `#F1F5F9` | Nền phụ |
| Canvas user | `#F8FAFC` | Nền website khách hàng |
| Canvas admin | `#F5F7FB` | Nền dashboard |
| Surface | `#FFFFFF` | Card, modal, form |

### Semantic

| Trạng thái | Nền | Chữ/icon |
|---|---:|---:|
| Success | `#ECFDF5` | `#047857` |
| Warning | `#FFFBEB` | `#B45309` |
| Danger | `#FEF2F2` | `#B91C1C` |
| Info | `#EFF6FF` | `#1D4ED8` |

Không dùng màu đơn lẻ để truyền trạng thái. Badge và Alert phải có text hoặc icon đi kèm.

## 3. Typography

### Website khách hàng

- Font ưu tiên: **Be Vietnam Pro**.
- Fallback: system UI, Segoe UI, Roboto, Arial.
- Heading: 800–900.
- Body: 400–500.
- Label và button: 700–800.

### Website admin

- Font ưu tiên: **Inter**.
- Fallback: Be Vietnam Pro, system UI.
- Số liệu và bảng: dùng tabular numerals khi cần so sánh cột số.
- Không dùng font nhỏ hơn 12px cho nội dung cần đọc; 10–11px chỉ dùng cho eyebrow hoặc metadata không quan trọng.

### Thang chữ

| Cấp | Mobile | Desktop | Line height |
|---|---:|---:|---:|
| Display | 36px | 56px | 1.05–1.10 |
| H1 | 30px | 48px | 1.10–1.15 |
| H2 | 24px | 32px | 1.20 |
| H3 | 20px | 24px | 1.25 |
| Body large | 16px | 18px | 1.65 |
| Body | 14px | 16px | 1.55–1.70 |
| Caption | 12px | 12px | 1.45 |

## 4. Spacing

Dùng hệ 4px:

| Token | Giá trị |
|---|---:|
| 1 | 4px |
| 2 | 8px |
| 3 | 12px |
| 4 | 16px |
| 5 | 20px |
| 6 | 24px |
| 8 | 32px |
| 10 | 40px |
| 12 | 48px |
| 16 | 64px |
| 20 | 80px |
| 24 | 96px |

Quy tắc:

- Khoảng cách label–control: 8px.
- Khoảng cách control trong form: 20–24px.
- Padding card mobile: 16–20px.
- Padding card desktop: 24–32px.
- Khoảng cách section customer: 48–96px theo viewport.
- Khoảng cách module admin: 16–24px.

## 5. Radius và shadow

| Thành phần | Radius |
|---|---:|
| Input/Button nhỏ | 10–12px |
| Filter bar/Card admin | 16px |
| Card customer | 20–32px |
| Modal/Drawer | 24px |
| Badge | 999px |

Shadow chỉ dùng để biểu thị lớp nổi. Không dùng nhiều lớp bóng mạnh trên cùng màn hình.

## 6. Grid và container

### Customer

- Container tối đa: 1280px.
- Gutter mobile: 16px mỗi bên.
- Gutter tablet: 24px mỗi bên.
- Gutter desktop: 32px mỗi bên.
- Grid desktop: 12 cột.
- Grid tablet: 8 cột.
- Grid mobile: 4 cột.

### Admin

- Sidebar desktop mở: 260px.
- Sidebar desktop thu gọn: 72px.
- Content fluid, không khóa max-width cho bảng nghiệp vụ.
- Form chi tiết có thể dùng layout `1fr + 320px` ở desktop.
- Mobile chuyển về một cột.

## 7. Breakpoint

| Tên | Giá trị | Ý nghĩa |
|---|---:|---|
| sm | `640px` | Mobile lớn |
| md | `768px` | Tablet, table bắt đầu hiển thị dạng bảng |
| lg | `1024px` | Desktop, sidebar cố định |
| xl | `1280px` | Desktop rộng, grid nhiều cột |
| 2xl | `1536px` | Màn hình lớn |

Không thiết kế theo một kích thước duy nhất. Component phải hoạt động ở 320px chiều rộng.

## 8. Touch target

- Nút và control chính: tối thiểu 44px trên thiết bị coarse pointer.
- Icon button phải có `aria-label`.
- Khoảng cách giữa các icon button độc lập: tối thiểu 4–8px.
- Không đặt CTA quan trọng sát mép màn hình hoặc vùng gesture.

## 9. Motion

| Token | Thời lượng |
|---|---:|
| Fast | 140ms |
| Normal | 220ms |
| Slow | 360–420ms |

- Hover: 140–220ms.
- Modal/Drawer: 220–320ms.
- Page reveal: 220–360ms.
- Chỉ animate `opacity` và `transform` khi có thể.
- Không làm layout nhảy khi loading.
- Tôn trọng `prefers-reduced-motion`.

## 10. Form

- Label luôn hiển thị; placeholder không thay thế label.
- Trường bắt buộc có dấu `*` và thuộc tính `required` khi phù hợp.
- Lỗi đặt ngay dưới trường, có `aria-invalid` và `aria-describedby`.
- Nút submit hiển thị loading và bị khóa trong lúc gửi.
- Không xóa dữ liệu người dùng khi API lỗi.
- Form nhiều bước phải giữ dữ liệu khi quay lại.

## 11. Table admin

- Tablet/desktop: table có scroll ngang nếu tổng chiều rộng vượt viewport.
- Mobile: chuyển mỗi row thành card label–value.
- Cột hành động đặt cuối.
- Header ngắn, không dùng câu dài.
- Giá trị dài phải `overflow-wrap: anywhere` hoặc truncate kèm tooltip/chi tiết.
- Row clickable phải thao tác được bằng Enter và Space.

## 12. Overlay

Modal và Drawer bắt buộc:

- `role="dialog"`.
- `aria-modal="true"`.
- Tiêu đề liên kết bằng `aria-labelledby`.
- Focus chuyển vào overlay khi mở.
- Escape đóng overlay.
- Tab không thoát khỏi overlay.
- Khi đóng, focus trở về phần tử đã mở overlay.
- Khóa scroll body trong thời gian mở.

## 13. Trạng thái hệ thống

Mỗi module dữ liệu cần đủ:

- Loading.
- Empty.
- Error.
- Disabled.
- Permission denied.
- Success feedback sau mutation.

State panel phải mô tả tình trạng và đưa ra hành động tiếp theo khi có thể.
