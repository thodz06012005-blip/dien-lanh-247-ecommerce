# Mô hình dữ liệu Giai đoạn 5

## Nguyên tắc

- Migration chỉ thay đổi cấu trúc; dữ liệu mẫu chạy sau seed hệ thống.
- Không đổi tên hoặc xóa bảng sản phẩm, đơn hàng, yêu cầu sửa chữa và kỹ thuật viên.
- Nội dung công khai sử dụng `status`, `publishedAt`, `isActive` và `isFeatured`.
- Các thao tác xóa trên admin là soft archive/disable.

## ServiceCategory

Bảng đã có từ luồng yêu cầu sửa chữa và được mở rộng:

| Trường | Ý nghĩa |
|---|---|
| `id` | Mã ổn định, dùng cho quan hệ yêu cầu sửa chữa và dịch vụ |
| `name`, `slug` | Tên và URL duy nhất |
| `summary`, `description` | Tóm tắt và mô tả |
| `coverMediaId` | Ảnh đại diện |
| `isActive`, `isFeatured`, `sortOrder` | Điều khiển hiển thị |
| `seoTitle`, `seoDescription` | Metadata SEO |

## Service

- `slug` unique.
- `pricing`, `process`, `faq`, `relatedServiceSlugs` dùng JSON có cấu trúc.
- `status`: `DRAFT`, `PUBLISHED`, `ARCHIVED`.
- `publishedAt` cho phép lập lịch.
- Liên kết bắt buộc với `ServiceCategory`; ảnh đại diện liên kết `Media`.

## Project và ProjectMedia

`Project` lưu khách hàng, địa điểm, thời gian, nhiệm vụ, nội dung thực hiện, kết quả, trạng thái và SEO. `ProjectMedia` là bảng album nhiều-nhiều có `sortOrder` và `caption`.

## Post, Category, Tag và PostTag

Bảng `Category` hiện hữu được mở rộng bằng `categoryType`. Danh mục bài viết dùng `categoryType = POST`, còn danh mục sản phẩm tiếp tục dùng mặc định `PRODUCT`.

`Post` có:

- slug unique;
- tác giả liên kết `User`;
- danh mục liên kết `Category`;
- nhiều thẻ qua `PostTag`;
- lịch xuất bản;
- SEO title, description và canonical URL.

## Media

Media quản lý metadata ảnh/file độc lập:

- URL, alt text, MIME type;
- width, height, size;
- provider, public ID, folder;
- trạng thái hoạt động và người upload.

## Chỉ mục và ràng buộc

- UNIQUE: slug của Service, Project, Post, Tag; slug hiện có của Category và ServiceCategory.
- INDEX: status + publishedAt; category + featured; active + sortOrder.
- FK dùng `SET NULL` cho ảnh đại diện để nội dung không bị xóa dây chuyền.
- Bảng liên kết album/thẻ dùng `CASCADE` theo nội dung cha.
