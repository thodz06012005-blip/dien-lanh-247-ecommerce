# Quy trình biên tập và xuất bản

## 1. Vai trò

### Người có `content.view`

- Xem danh sách.
- Tìm kiếm, lọc, sort và export.
- Xem preview.
- Xem lịch sử revision.
- Không được tạo, sửa, publish hoặc archive.

### Người có `content.manage`

- Tạo và chỉnh sửa nội dung.
- Upload media.
- Publish ngay hoặc theo lịch.
- Unpublish.
- Soft archive và restore.
- Thực hiện bulk archive.

Backend luôn kiểm tra permission; quyền không chỉ được kiểm soát bằng giao diện.

## 2. Tạo nội dung mới

1. Mở `Admin → Nội dung`.
2. Chọn module.
3. Nhấn **Tạo**.
4. Điền tab Nội dung.
5. Chọn media tại tab Media.
6. Hoàn thiện SEO.
7. Kiểm tra thiết lập hiển thị.
8. Lưu.

Kết quả:

- Bản ghi ở trạng thái DRAFT.
- `version = 1`.
- Có revision `CREATE`.
- Chưa xuất hiện trên public website.

## 3. Preview

Preview sử dụng endpoint admin và đọc cả DRAFT/ARCHIVED.

Rich content được hiển thị trong iframe `sandbox` để không chạy script hoặc truy cập context của admin.

Preview không thay đổi trạng thái và không tạo revision.

## 4. Cập nhật

Khi lưu chỉnh sửa:

```text
version = version + 1
updatedById = admin hiện tại
updatedAt = NOW()
revision action = UPDATE
```

Nếu nội dung đang PUBLISHED, cập nhật được lưu ngay trên cùng bản ghi. Quy trình vận hành khuyến nghị:

1. Unpublish khi thay đổi lớn.
2. Chỉnh sửa và preview.
3. Publish lại.

Với thay đổi nhỏ đã được kiểm duyệt, có thể cập nhật bản đang publish; lịch sử vẫn ghi đầy đủ.

## 5. Publish ngay

1. Chọn biểu tượng Publish.
2. Để trống lịch xuất bản.
3. Xác nhận.

Public API phản ánh nội dung ngay sau khi transaction hoàn tất và cache frontend hết hạn/refetch.

## 6. Publish theo lịch

1. Chọn Publish.
2. Chọn ngày/giờ tương lai.
3. Xác nhận.

Database lưu:

```text
status = PUBLISHED
publishedAt = thời điểm tương lai
```

Public API có điều kiện `publishedAt <= NOW()`, vì vậy nội dung tự xuất hiện đúng lịch mà không cần cron thay đổi trạng thái.

Đối với Banner, hệ thống còn kiểm tra `startsAt` và `endsAt`.

## 7. Unpublish

Unpublish đưa nội dung về DRAFT:

- Không còn xuất hiện công khai.
- Không mất nội dung.
- Không mất relation/media.
- Có revision `UNPUBLISH`.

## 8. Archive

Archive là soft delete:

- Nội dung publishable chuyển thành ARCHIVED.
- Taxonomy/media/author chuyển inactive.
- `deletedAt` được thiết lập.
- Bản ghi vẫn tồn tại.
- Relation vẫn hợp lệ.
- Có revision `ARCHIVE`.

Bulk archive thực hiện từng bản ghi qua API, để mỗi bản ghi có audit riêng.

## 9. Restore

Restore:

- Xóa `deletedAt`.
- Nội dung publishable trở về DRAFT.
- Taxonomy/media/author trở lại active.
- Không tự publish.
- Có revision `RESTORE`.

Việc không tự publish giúp nội dung được kiểm tra lại trước khi quay lại website.

## 10. Quy trình theo module

### Dịch vụ

Bắt buộc kiểm tra:

- Danh mục.
- Mô tả ngắn và nội dung.
- Bảng giá JSON.
- Quy trình JSON.
- Bảo hành.
- FAQ.
- Cover/social image.
- SEO.

### Dự án

Bắt buộc kiểm tra:

- Khách hàng và địa điểm.
- Thời gian thực hiện.
- Nhiệm vụ.
- Kết quả.
- Album media đúng thứ tự.
- Cover/social image.

### Bài viết

Bắt buộc kiểm tra:

- Danh mục.
- Tác giả.
- Thẻ.
- Nội dung.
- Canonical URL nếu nội dung được tái xuất bản.
- Social image.
- Lịch xuất bản.

### Banner

Bắt buộc kiểm tra:

- Placement.
- Desktop/mobile media.
- CTA URL.
- Khoảng thời gian hiệu lực.
- Nội dung trên mobile.

### SiteSection

Khóa `sectionKey` ổn định và viết hoa. Không đổi key tùy tiện vì frontend dùng key để xác định vị trí.

Các key chuẩn:

```text
HOME_*
CONTACT
FOOTER
FOOTER_*
```

## 11. Kiểm duyệt nội dung HTML

Backend loại bỏ:

- `script`.
- `style`.
- `iframe`.
- `object`.
- `embed`.
- Thuộc tính `on*`.
- `javascript:` URL.
- `data:text/html`.

Người biên tập vẫn cần kiểm tra:

- Heading đúng cấp.
- Link hợp lệ.
- Alt text.
- Không copy inline style phức tạp.
- Không chèn form hoặc mã theo dõi vào nội dung.

## 12. Xử lý sự cố

### Nội dung đã publish nhưng chưa xuất hiện

Kiểm tra:

1. `status = PUBLISHED`.
2. `isActive = true`.
3. `deletedAt IS NULL`.
4. `publishedAt <= NOW()`.
5. Banner `startsAt/endsAt`.
6. Section key đúng vị trí frontend.
7. Cache/refetch của frontend.

### Không thể xóa nội dung

CMS không hỗ trợ hard delete. Dùng Archive. Đây là hành vi bắt buộc để bảo vệ dữ liệu tham chiếu.

### Preview khác giao diện website

Preview tập trung vào nội dung và metadata. Bố cục cuối phụ thuộc component frontend tại vị trí hiển thị. Kiểm tra staging sau publish trước khi triển khai production lớn.
