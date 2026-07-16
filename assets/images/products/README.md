# Ảnh sản phẩm

Mỗi model phải có bộ ảnh riêng; không dùng chung một ảnh cho tủ lạnh, máy giặt, điều hòa hoặc máy lọc không khí.

## Quy tắc

- Tên: `product-<brand>-<model>-<number>.webp`.
- Tỷ lệ mặc định: 4:3; ảnh catalog nền trắng có thể dùng 1:1.
- Ảnh chính dùng hậu tố `-01`, ảnh chi tiết dùng `-02`, `-03`.
- Tối đa 120 KB/ảnh card; ảnh gallery tối đa 180 KB.
- Dùng `object-contain` khi cần nhìn toàn bộ thiết bị, `object-cover` cho ảnh không gian sử dụng.

Danh sách file cần thay được quản lý tại `assets/images/manifest.json`.