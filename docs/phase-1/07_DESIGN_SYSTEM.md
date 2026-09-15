# 07. Design System

## 1. Nguyên tắc thị giác

- Hiện đại nhưng không lạnh lẽo.
- Tin cậy, kỹ thuật, sạch và minh bạch.
- Dùng xanh lạnh làm màu chính; cam chỉ dùng cho cảnh báo/CTA phụ.
- Khoảng trắng rộng ở website khách hàng; mật độ cao hơn ở admin.

## 2. Color tokens

```css
--navy-950: #071426;
--navy-900: #0A1B33;
--blue-700: #0759D7;
--blue-600: #0877F9;
--blue-500: #1B91FF;
--cyan-400: #49D8FF;
--orange-500: #FF7A1A;
--green-500: #1BBF76;
--red-500: #E11D48;
--slate-950: #0F172A;
--slate-600: #475569;
--slate-200: #E2E8F0;
--slate-50: #F8FAFC;
```

## 3. Typography

Font đề xuất: **Be Vietnam Pro** hoặc font sans-serif tiếng Việt có độ đọc tốt.

| Token | Desktop | Mobile | Weight |
|---|---:|---:|---:|
| Display | 64–72 | 40–52 | 700–800 |
| H1 | 48–56 | 36–44 | 700 |
| H2 | 36–48 | 30–38 | 700 |
| H3 | 20–28 | 18–24 | 600–700 |
| Body L | 18 | 16 | 400 |
| Body | 16 | 15–16 | 400 |
| Small | 12–14 | 12–14 | 400–600 |

## 4. Spacing

Dùng hệ 4px:

`4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 104`

## 5. Radius

- Input: 12–14px.
- Card: 18–26px.
- Hero/CTA lớn: 28–36px.
- Badge: pill.

## 6. Component inventory

### Website khách hàng

- Header, mobile navigation.
- Hero.
- Service card.
- Project card.
- Process timeline.
- Testimonial card.
- Sticky CTA.
- Multi-step form.
- Upload field.
- Calendar/slot picker.
- Success state.
- Footer.

### Admin

- Sidebar.
- Topbar.
- Metric card.
- Data table.
- Quick filter.
- Search field.
- Status badge.
- SLA badge.
- Detail drawer.
- Filter drawer.
- Toast.
- Empty/loading/error state.

## 7. Component states

Mọi component tương tác phải có:

- Default.
- Hover.
- Focus-visible.
- Active/pressed.
- Disabled.
- Loading.
- Error.
- Success nếu phù hợp.

## 8. Content rules

- Nút dùng động từ: “Đặt lịch”, “Lưu thay đổi”, “Xem chi tiết”.
- Không dùng câu mơ hồ như “Click here”.
- Trạng thái viết nhất quán theo enum.
- Cảnh báo phải giải thích hành động tiếp theo.
