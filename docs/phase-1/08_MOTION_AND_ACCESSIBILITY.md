# 08. Motion, Performance và Accessibility

## 1. Nguyên tắc motion

Animation chỉ được dùng để:

- Giải thích quan hệ trước–sau.
- Chuyển bước form.
- Phản hồi hover, tap, loading và success.
- Giúp người dùng nhận biết drawer/modal mở hoặc đóng.
- Hướng chú ý đến thay đổi trạng thái.

Không dùng animation lặp vô hạn bên cạnh form hoặc bảng dữ liệu.

## 2. Motion tokens

```text
motion-fast: 120–180ms
motion-normal: 220–320ms
motion-slow: 400–600ms
motion-celebration: tối đa 800ms
```

Easing đề xuất:

```css
--ease-standard: cubic-bezier(.22, 1, .36, 1);
--ease-in: cubic-bezier(.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, .2, 1);
```

## 3. Hiệu năng

Ưu tiên animate:

- `transform`
- `opacity`

Hạn chế animate liên tục:

- `width`, `height`
- `top`, `left`
- `box-shadow` lớn
- `filter: blur()` trên vùng rộng

Dùng IntersectionObserver cho reveal; không gắn scroll listener nặng.

## 4. Reduced motion

Bắt buộc có:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .001ms !important;
    transition-duration: .001ms !important;
    scroll-behavior: auto !important;
  }
}
```

Trong React, dùng hook reduced motion của thư viện animation khi triển khai production.

## 5. Keyboard và focus

- Mọi chức năng dùng được bằng bàn phím.
- Modal giữ focus bên trong và trả focus khi đóng.
- `Escape` đóng modal/drawer.
- `focus-visible` rõ ràng, không loại bỏ outline nếu không có thay thế.
- Skip link ở đầu trang.

## 6. Target size

- CTA chính: cao tối thiểu 44px.
- Icon-only button: tối thiểu 40–44px.
- Khoảng cách giữa target nhỏ đủ tránh bấm nhầm.

## 7. Form accessibility

- Label gắn với input.
- Error đặt gần trường và có mô tả rõ.
- Không chỉ dùng màu để báo lỗi.
- Focus trường lỗi đầu tiên sau submit.
- Progress có text “Bước x/y”.

## 8. Contrast

- Text thường mục tiêu tối thiểu 4.5:1.
- Text lớn mục tiêu tối thiểu 3:1.
- Badge và trạng thái phải có text, không chỉ màu.
