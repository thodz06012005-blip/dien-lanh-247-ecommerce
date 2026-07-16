# Hướng dẫn thay thế ảnh — Điện Lạnh 247

## 1. Nơi lưu ảnh chuẩn

Tất cả ảnh mới phải được đặt trong:

```text
assets/images/
```

Không đặt ảnh mới trực tiếp trong component hoặc rải rác ở nhiều thư mục.

## 2. Bản đồ ảnh

File tra cứu chính:

```text
assets/images/manifest.json
```

Mỗi ảnh có:

- `key`: mã ảnh duy nhất, bắt đầu bằng `img_`;
- `category`: nhóm ảnh;
- `targetFile`: đường dẫn cần đặt ảnh mới;
- `currentSource`: nguồn ảnh cũ đang dùng;
- `usedBy`: file, seed hoặc trang đang sử dụng;
- `aspectRatio`: tỷ lệ cần giữ;
- `recommendedSize`: kích thước nguồn;
- `maxBytes`: ngân sách dung lượng.

## 3. Thư mục và vị trí sử dụng

| Thư mục | Nội dung | Trang/chức năng thường dùng |
|---|---|---|
| `assets/images/hero/` | Banner, ảnh LCP | `/`, `/services`, `/products` |
| `assets/images/products/` | Thiết bị, phụ kiện | `/products`, chi tiết sản phẩm, giỏ hàng, đơn hàng |
| `assets/images/services/` | Sửa chữa, vệ sinh, lắp đặt | `/services`, `/service-booking` |
| `assets/images/projects/` | Công trình | `/projects`, trang dự án |
| `assets/images/articles/` | Ảnh bìa bài viết | `/articles`, Open Graph |
| `assets/images/brands/` | Logo hãng | bộ lọc, partner section |
| `assets/images/avatars/` | Avatar | testimonial, tác giả, kỹ thuật viên |
| `assets/images/admin/` | Empty state, onboarding | Admin Workspace |
| `assets/images/placeholders/` | Fallback | toàn bộ frontend |

## 4. Quy trình thay một ảnh

Ví dụ thay ảnh sản phẩm Daikin FTKF25XVMV:

1. Mở manifest, tìm `img_product_daikin_ftkf25xvmv_01`.
2. Chuẩn bị WebP 1200×900, tối đa 120 KB.
3. Đặt file tại:

```text
assets/images/products/product-daikin-ftkf25xvmv-01.webp
```

4. Chạy:

```bash
npm run assets:sync
npm run assets:audit
```

5. Cập nhật URL trong các vị trí được liệt kê ở `usedBy` từ nguồn cũ sang:

```text
/images/products/product-daikin-ftkf25xvmv-01.webp
```

6. Chạy lại seed khi cần và kiểm tra:

- danh sách sản phẩm;
- chi tiết sản phẩm;
- giỏ hàng;
- lịch sử đơn hàng;
- website quản trị.

## 5. Những lỗi đã phát hiện khi rà ảnh seed

### Ảnh bị dùng lại cho nhiều loại sản phẩm

Một số URL Unsplash hiện được tái sử dụng cho nhiều model hoặc nhiều nhóm thiết bị. Điều này làm sản phẩm hiển thị sai ngữ cảnh, ví dụ:

- ảnh điều hòa dùng cho máy lọc không khí;
- ảnh máy giặt dùng cho máy sấy và nhiều model máy giặt;
- cùng một ảnh dùng cho bình nóng lạnh và tủ lạnh;
- cùng một ảnh dùng cho tủ lạnh LG và tủ đông Sanaky.

Các trường hợp này đã được đánh dấu trong manifest để thay từng file riêng.

### Phụ thuộc nguồn ngoài

Seed hiện còn dùng `images.unsplash.com`. Khi nguồn ngoài chậm hoặc chặn request:

- ảnh bị lỗi;
- fallback trở thành phần tử LCP;
- Lighthouse mobile giảm điểm;
- giao diện card mất tính nhất quán.

Nên chuyển dần các ảnh quan trọng sang asset local hoặc CDN do dự án quản lý.

## 6. Ảnh fallback

Fallback chuẩn:

```text
assets/images/placeholders/image-unavailable.svg
```

Bản public được đồng bộ tới:

```text
frontend-user/public/images/placeholders/image-unavailable.svg
frontend-admin/public/images/placeholders/image-unavailable.svg
```

Không chỉnh riêng từng bản public; chỉnh bản canonical rồi chạy `npm run assets:sync`.

## 7. Kiểm tra bắt buộc

```bash
npm run assets:sync
npm run assets:audit
npm run lint
npm run typecheck
npm run build:all
```

Kiểm tra giao diện tại:

- 390×844;
- 768×1024;
- 1440×900.

Đảm bảo:

- không méo ảnh;
- không layout shift;
- alt mô tả đúng;
- card cùng chiều cao;
- ảnh dưới màn hình lazy load;
- ảnh hero có `priority`;
- không còn URL ảnh hỏng hoặc không đúng nội dung.
