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
├── icons/         Favicon, sprite và biểu tượng dùng chung
├── placeholders/  Ảnh dự phòng khi nguồn chính lỗi
└── legacy/        Tài nguyên cũ được giữ để tránh mất dữ liệu
```

## Quy trình thay ảnh

1. Mở `assets/images/manifest.json`.
2. Tìm `assetKey` bắt đầu bằng `img_`.
3. Đọc các trường `tepCanonical`, `duongDanPublic`, `routeSuDung`, `componentSuDung`, `seedSuDung` và `usedBy`.
4. Chuẩn bị ảnh đúng tỷ lệ, kích thước và dung lượng.
5. Đặt ảnh mới vào đúng `tepCanonical`.
6. Chạy trực tiếp:

```bash
node scripts/sync-image-assets.mjs
node scripts/audit-image-assets.mjs
```

7. Sau khi đã đăng ký alias npm trên máy local, có thể dùng:

```bash
npm run assets:sync
npm run assets:audit
```

8. Khởi động lại frontend và kiểm tra desktop, tablet, mobile.

## Quy tắc tên file tiếng Việt không dấu

```text
anh-hero-trang-chu-chinh-01.avif
anh-sp-dieu-hoa-daikin-ftkf25xvmv-mat-truoc-01.webp
anh-dv-sua-dieu-hoa-anh-bia-01.webp
anh-da-bao-tri-dieu-hoa-van-phong-anh-bia-01.webp
anh-bv-tiet-kiem-dien-dieu-hoa-anh-bia-01.webp
logo-th-daikin-chinh-01.svg
anh-dd-khach-hang-nguyen-minh-anh-01.webp
anh-bg-khong-co-hinh-01.svg
```

Không dùng dấu tiếng Việt, khoảng trắng hoặc tên như `image1.jpg`, `anh-moi.png`, `final-final.jpg`.

## Asset key và tên file

`assetKey` được giữ ổn định để code và dữ liệu dễ tra cứu. Tên file có thể được chuẩn hóa mà không đổi `assetKey`.

Ví dụ:

```text
assetKey: img_product_daikin_ftkf25xvmv_01
file: products/anh-sp-dieu-hoa-daikin-ftkf25xvmv-mat-truoc-01.webp
```

## Tỷ lệ và ngân sách

| Nhóm | Tỷ lệ khuyến nghị | Kích thước nguồn | Dung lượng tối đa |
|---|---:|---:|---:|
| Hero | 16:7 hoặc 16:8 | 1920×840 | 250 KB |
| Product card | 4:3 hoặc 1:1 | 1200×900 | 120 KB |
| Service cover | 3:2 | 1200×800 | 160 KB |
| Project | 16:10 | 1600×1000 | 180 KB |
| Article cover | 16:9 | 1600×900 | 160 KB |
| Avatar | 1:1 | 512×512 | 80 KB |
| Logo | Theo logo | SVG ưu tiên | 40 KB |

## Định dạng

- Ảnh chụp: ưu tiên AVIF, sau đó WebP.
- Logo và hình phẳng: SVG.
- PNG chỉ dùng khi thật sự cần nền trong suốt.
- Không thêm GIF động nặng.
- Không lưu ảnh chứa dữ liệu cá nhân hoặc thông tin khách hàng thật.
- Không tải tự động hàng loạt ảnh Unsplash/Pexels nếu chưa xác định quyền sử dụng.

## Đồng bộ ra frontend

`scripts/sync-image-assets.mjs` đọc manifest và sao chép file canonical sang:

```text
frontend-user/public/images/
frontend-admin/public/images/
```

Script có các bảo đảm:

- Không xóa file đích.
- Không ghi lại khi SHA-256 nguồn và đích giống nhau.
- Hỗ trợ `aliases` để giữ tương thích tên cũ.
- Dừng khi file `requiredLocal` bị thiếu.

Không chỉnh trực tiếp bản sao trong `public/images`; lần đồng bộ sau có thể ghi đè chúng.

## Fallback canonical

```text
assets/images/placeholders/anh-bg-khong-co-hinh-01.svg
```

Alias tương thích được giữ:

```text
assets/images/placeholders/image-unavailable.svg
```

Không xóa alias trong cùng giai đoạn chuyển đổi.

## Tài liệu liên quan

- `docs/quy-uoc/QY_ANH_quy-tac-dat-ten-hinh-anh_gd15_v01.md`
- `docs/bao-cao/BC_ANH_kiem-toan-hinh-anh_gd15_v01.md`
- `assets/images/manifest.json`
