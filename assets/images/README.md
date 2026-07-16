# Thư viện ảnh Điện Lạnh 247

Thư mục này là **nguồn ảnh chuẩn duy nhất** của repository. Không đặt ảnh mới rải rác trong component, seed hoặc thư mục gốc của frontend.

## Cấu trúc

```text
assets/images/
├── hero/          Ảnh banner và ảnh LCP
├── products/      Ảnh sản phẩm, phụ kiện và thiết bị
├── services/      Ảnh dịch vụ sửa chữa, vệ sinh, lắp đặt
├── projects/      Ảnh công trình và dự án đã thực hiện
├── articles/      Ảnh bìa và ảnh nội dung bài viết
├── brands/        Logo thương hiệu
├── avatars/       Ảnh khách hàng, tác giả và nhân sự
├── admin/         Ảnh minh họa chỉ dùng trong trang quản trị
└── placeholders/  Ảnh dự phòng khi nguồn chính lỗi
```

## Quy trình thay ảnh

1. Mở `assets/images/manifest.json` và tìm mã ảnh bắt đầu bằng `img_`.
2. Đọc trường `usedBy` để biết ảnh đang xuất hiện ở trang, component hoặc seed nào.
3. Chuẩn bị ảnh đúng tỷ lệ và dung lượng ghi trong manifest.
4. Đặt ảnh mới vào đúng `targetFile`.
5. Chạy:

```bash
npm run assets:sync
npm run assets:audit
```

6. Khởi động lại frontend và kiểm tra desktop, tablet, mobile.

## Quy tắc tên file

```text
hero-home-main.avif
product-daikin-ftkf25xvmv-01.webp
service-air-conditioner-repair-cover.webp
project-office-maintenance-01.webp
article-air-conditioner-energy-saving-cover.webp
brand-daikin.svg
avatar-customer-nguyen-minh-anh.webp
placeholder-image-unavailable.svg
```

Không dùng các tên như `image1.jpg`, `anh-moi.png`, `final-final.jpg`.

## Tỷ lệ và ngân sách

| Nhóm | Tỷ lệ khuyến nghị | Kích thước nguồn | Dung lượng tối đa |
|---|---:|---:|---:|
| Hero | 16:7 hoặc 16:8 | 1920×840 | 250 KB |
| Product card | 4:3 hoặc 1:1 | 1200×900 | 120 KB |
| Service cover | 3:2 | 1200×800 | 160 KB |
| Project | 16:10 | 1600×1000 | 180 KB |
| Article cover | 16:9 | 1600×900 | 160 KB |
| Avatar | 1:1 | 512×512 | 80 KB |
| Logo | theo logo | SVG ưu tiên | 40 KB |

## Định dạng

- Ảnh chụp: ưu tiên AVIF, sau đó WebP.
- Logo và hình phẳng: SVG.
- PNG chỉ dùng khi thật sự cần nền trong suốt.
- Không thêm GIF động nặng.
- Không lưu ảnh chứa dữ liệu cá nhân hoặc thông tin khách hàng thật.

## Đồng bộ ra frontend

`scripts/sync-image-assets.mjs` sao chép ảnh từ thư mục này sang:

```text
frontend-user/public/images/
frontend-admin/public/images/
```

Không chỉnh trực tiếp bản sao trong `public/images`; lần đồng bộ sau có thể ghi đè chúng.
