# Quy ước đặt tên và thay thế hình ảnh — Giai đoạn 15

## Mục tiêu

Tập trung toàn bộ hình ảnh vào một thư viện canonical, dùng tên tiếng Việt không dấu có tiền tố rõ ràng, đồng thời giữ `assetKey` ổn định để tránh phải sửa code nhiều lần.

## Nguồn ảnh chuẩn

```text
assets/images/
```

Không chỉnh trực tiếp ảnh tại:

```text
frontend-user/public/images/
frontend-admin/public/images/
```

Hai thư mục trên là bản được đồng bộ bằng `npm run assets:sync`.

## Cấu trúc thư mục

```text
assets/images/
├── hero/
├── products/
├── services/
├── projects/
├── articles/
├── brands/
├── avatars/
├── admin/
├── icons/
├── placeholders/
└── legacy/
    └── vite-template/
```

## Quy tắc tên

```text
<TIEN_TO>-<doi-tuong>-<vai-tro>-<so-thu-tu>.<dinh-dang>
```

### Tiền tố ảnh

| Tiền tố | Loại ảnh |
|---|---|
| `anh-hero` | Banner và ảnh LCP |
| `anh-sp` | Sản phẩm, thiết bị, linh kiện |
| `anh-dv` | Dịch vụ sửa chữa, vệ sinh, lắp đặt |
| `anh-da` | Dự án, công trình |
| `anh-bv` | Bài viết |
| `logo-th` | Logo thương hiệu |
| `anh-dd` | Ảnh đại diện |
| `anh-qt` | Ảnh minh họa quản trị |
| `icon-ui` | Favicon, sprite, biểu tượng |
| `anh-bg` | Ảnh dự phòng |
| `anh-legacy` | Ảnh mẫu hoặc tài nguyên cũ |

### Ví dụ

```text
anh-hero-trang-chu-chinh-01.avif
anh-sp-dieu-hoa-daikin-ftkf25xvmv-mat-truoc-01.webp
anh-sp-tu-lanh-lg-grb256bl-mat-truoc-01.webp
anh-dv-sua-dieu-hoa-anh-bia-01.webp
anh-da-bao-tri-van-phong-anh-bia-01.webp
anh-bv-tiet-kiem-dien-anh-bia-01.webp
logo-th-daikin-chinh-01.svg
anh-dd-ky-thuat-vien-01.webp
anh-bg-khong-co-hinh-01.svg
```

## Quy tắc kỹ thuật

- Không dùng dấu tiếng Việt trong filename hoặc URL.
- Không có khoảng trắng.
- Không dùng tên `image1`, `anh-moi`, `final-final`, `test2`.
- Ảnh chụp ưu tiên AVIF, sau đó WebP.
- Logo và hình phẳng ưu tiên SVG.
- PNG chỉ dùng khi cần nền trong suốt.
- Không lưu ảnh người thật nếu chưa có quyền sử dụng.
- Không tải tự động hàng loạt ảnh Unsplash hoặc Pexels vào repository.

## Tỷ lệ và ngân sách

| Nhóm | Tỷ lệ | Kích thước nguồn | Dung lượng tối đa |
|---|---:|---:|---:|
| Hero | 16:7 hoặc 16:8 | 1920×840 | 250 KB |
| Product card | 4:3 hoặc 1:1 | 1200×900 | 120 KB |
| Service cover | 3:2 | 1200×800 | 160 KB |
| Project | 16:10 | 1600×1000 | 180 KB |
| Article cover | 16:9 | 1600×900 | 160 KB |
| Avatar | 1:1 | 512×512 | 80 KB |
| Logo | Theo logo | SVG | 40 KB |

## Asset key

`assetKey` là mã ổn định dùng trong code và manifest. Không đổi `assetKey` chỉ vì đổi tên file.

Ví dụ:

```text
assetKey: img_product_daikin_ftkf25xvmv_front_01
file: products/anh-sp-dieu-hoa-daikin-ftkf25xvmv-mat-truoc-01.webp
```

## Manifest bắt buộc

Mỗi entry trong `assets/images/manifest.json` cần có:

- `assetKey`;
- `tenHienThi`;
- `nhom`;
- `tepCanonical`;
- `duongDanPublic`;
- `nguonCu` nếu đang dùng URL ngoài;
- `trangThai`;
- `tyLe`;
- `kichThuocDeXuat`;
- `dungLuongToiDa`;
- `alt`;
- `routeSuDung`;
- `componentSuDung`;
- `seedSuDung`;
- `duLieuSuDung`;
- `ghiChuThayThe`.

## Trạng thái đề xuất

- `local`: đã có file canonical.
- `du-kien`: đã quy hoạch tên nhưng chưa có file.
- `nguon-ngoai-tam-thoi`: đang dùng URL ngoài và đã ghi manifest.
- `can-thay`: ảnh sai hoặc cần chuyển về local.
- `sai-noi-dung`: ảnh không đúng loại thiết bị/model.
- `trung-lap`: cùng nguồn đang bị tái sử dụng không hợp lý.
- `chua-ro-ban-quyen`: chưa xác minh quyền sử dụng.

## Quy trình thay ảnh

1. Tìm `assetKey` trong manifest.
2. Đọc `tepCanonical`, tỷ lệ và dung lượng.
3. Đặt ảnh vào đúng thư mục canonical và giữ nguyên filename.
4. Chạy `npm run assets:sync`.
5. Chạy `npm run assets:audit`.
6. Chuyển URL trong seed/code sang `duongDanPublic` khi file local đã tồn tại.
7. Kiểm tra desktop, tablet, mobile và ảnh fallback.

## Tương thích

Khi đổi tên ảnh đang được dùng:

- Giữ alias tên cũ trong ít nhất một chu kỳ phát hành nếu cần.
- Script sync không được xóa ảnh public mặc định.
- Chỉ dùng `--prune` khi đã có báo cáo ảnh không còn tham chiếu.
- Không xóa ảnh legacy trong cùng commit với đổi đường dẫn code.

## Tiêu chí nghiệm thu

- Không có ảnh méo hoặc layout shift.
- Không dùng chung ảnh cho model không liên quan.
- Ảnh nghiệp vụ có `alt`, `width`, `height`.
- Ảnh hero dùng `priority` phù hợp.
- URL ngoài đều được ghi trong manifest.
- File local đều có manifest.
- Không có ảnh required bị thiếu.