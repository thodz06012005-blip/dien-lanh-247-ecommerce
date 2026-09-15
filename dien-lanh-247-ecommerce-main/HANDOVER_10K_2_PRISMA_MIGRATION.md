# Báo Cáo Chuẩn Bị Migration Cơ Sở Dữ Liệu (HANDOVER 10K-2)

Báo cáo chi tiết về việc xây dựng tệp migration SQL đầu tiên và tối ưu hóa quy trình làm việc với cơ sở dữ liệu (Prisma ORM) cho môi trường Staging và Production.

---

## 1. Mục Tiêu Của Giai Đoạn 10K-2
* Chuyển đổi cơ chế đồng bộ hóa cơ sở dữ liệu từ `db push` sang cơ chế kiểm soát phiên bản chính thức thông qua **Prisma Migrations** (`prisma/migrations/`).
* Tạo tệp SQL migration đầu tiên (`20260629000000_init_backend_schema/migration.sql`) mà không làm ảnh hưởng hoặc mất mát dữ liệu hiện tại của máy cục bộ.
* Chuẩn hóa và tự động hóa các câu lệnh thao tác với Prisma trong `backend/package.json`.

---

## 2. Trạng Thái Trước Khi Sửa & Phương Án Xử Lý
* **Trước khi thực hiện**: Dự án chưa hề có thư mục `backend/prisma/migrations/`. Cơ sở dữ liệu local/dev được đồng bộ tự do bằng `db push`.
* **Trở ngại gặp phải**: Lệnh `npx prisma migrate dev` yêu cầu môi trường tương tác (interactive mode) và sẽ cố gắng reset database local. Điều này vi phạm nghiêm trọng yêu cầu an toàn dữ liệu cục bộ.
* **Phương án khắc phục (Không tương tác & An toàn)**:
  1. Tạo thư mục migration thủ công: `backend/prisma/migrations/20260629000000_init_backend_schema`.
  2. Sử dụng lệnh so sánh cấu trúc không tương tác:
     ```bash
     npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script
     ```
     và kết xuất trực tiếp vào tệp `migration.sql` tương ứng.
  3. Phương pháp này tạo ra tệp migration SQL sạch 100%, chứa toàn bộ định nghĩa bảng và ràng buộc khóa ngoại (Foreign Keys), sẵn sàng cho môi trường staging/production mà không làm gián đoạn hay mất mát dữ liệu của máy cục bộ.

---

## 3. Các Lệnh Đã Chạy & Kết Quả Kiểm Định (100% PASS)

| Phân hệ | Lệnh thực thi | Kết quả | Ghi chú |
| :--- | :--- | :---: | :--- |
| **Backend** | Tạo thư mục migration | **PASS** | Đã tạo thư mục `20260629000000_init_backend_schema`. |
| **Backend** | `npx prisma migrate diff ...` | **PASS** | Kết xuất thành công tệp `migration.sql` dài 404 dòng. |
| **Backend** | `npx prisma generate` | **PASS** | Biên dịch Prisma Client thành công. |
| **Backend** | `npm run build` | **PASS** | NestJS build thành công. |
| **Backend** | `npx prisma db seed` | **PASS** | Nạp dữ liệu hạt giống thành công, không tạo trùng. |

---

## 4. Các Script Prisma Đã Được Chuẩn Hóa (`backend/package.json`)
* **`npm run prisma:generate`**: Sinh mã nguồn Prisma Client.
* **`npm run prisma:migrate:dev`**: Tạo và áp dụng migration ở môi trường dev.
* **`npm run prisma:migrate:deploy`**: Áp dụng migration một cách an toàn trên staging/production.
* **`npm run prisma:seed`**: Nạp dữ liệu hạt giống.

---

## 5. Quy Trình Vận Hành Cơ Sở Dữ Liệu Chuẩn

### A. Môi Trường Local / Development
1. Khi có sự thay đổi cấu trúc bảng trong `schema.prisma`.
2. Tạo tệp migration mới bằng lệnh:
   ```bash
   npx prisma migrate dev --name <tên_migration>
   ```
3. Chạy seed nếu cần nạp lại dữ liệu mẫu:
   ```bash
   npx prisma db seed
   ```

### B. Môi Trường Staging / Production (Tuyệt đối an toàn)
* **Quy tắc 1**: **Tuyệt đối không sử dụng `npx prisma db push` hoặc `npx prisma migrate dev` trên production**.
* **Quy tắc 2**: **Luôn luôn thực hiện sao lưu (Backup) cơ sở dữ liệu trước khi chạy bất kỳ lệnh cập nhật nào**.
* **Quy tắc 3**: Chạy áp dụng các file migration SQL chính thức bằng lệnh:
   ```bash
   npx prisma migrate deploy
   ```
* **Quy tắc 4**: Chạy Smoke Test (các bài kiểm tra giao dịch nhỏ) ngay sau khi migrate thành công để đảm bảo hệ thống vận hành bình thường.

---

## 6. Kết Luận
Cơ chế kiểm soát phiên bản cơ sở dữ liệu đã được chuẩn bị hoàn tất và cực kỳ an toàn.

**Đủ điều kiện chuyển sang 10K-3 Security Hardening.**
