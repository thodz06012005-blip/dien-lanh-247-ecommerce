# Hướng Dẫn Chạy Các Chế Độ Phát Triển (DEV MODE & FALLBACK GUIDE)

Tài liệu này hướng dẫn cách vận hành hệ thống Điện Lạnh 247 ở hai chế độ: **Mock API Mode** (Chạy mô phỏng nhanh) và **Backend NestJS Mode** (Chạy với cơ sở dữ liệu và máy chủ thật).

---

## 1. Tổng Quan 2 Chế Độ Chạy

| Đặc tính | Chế độ 1: Mock API Mode | Chế độ 2: Backend NestJS Mode |
| :--- | :--- | :--- |
| **Mục đích** | Demo nhanh giao diện, kiểm thử giao diện tĩnh, dự phòng an toàn. | Kiểm thử tích hợp thật, chạy E2E thật, chuẩn bị sản xuất. |
| **API Base URL** | `http://localhost:3001/api/v1` | `http://localhost:3000/api/v1` |
| **Cơ sở dữ liệu** | Tệp tin JSON tĩnh (`mock-db.json`) | Hệ quản trị MySQL thật (local/XAMPP) |
| **Yêu cầu dịch vụ nền**| Không yêu cầu gì thêm. | Yêu cầu bật MySQL (XAMPP) và dịch vụ NestJS. |
| **Trạng thái E2E** | **PASS 100%** | **PASS 100%** |

---

## 2. Chế Độ 1: Mock API Mode (Mặc định)

Đây là chế độ mặc định của dự án. Toàn bộ cấu hình trong `.env.example` và `.env` của các ứng dụng Frontend đều trỏ về Mock API.

### Các bước khởi chạy:
1. **Khởi động Mock API Server** (cổng 3001):
   ```bash
   npm run dev:mock
   ```
2. **Khởi động Frontend User** (cổng 5173):
   ```bash
   npm run dev:user
   ```
3. **Khởi động Frontend Admin** (cổng 5174):
   ```bash
   npm run dev:admin
   ```

### Khi nào nên dùng:
* Khi cần chạy thử nhanh giao diện mà không muốn bật MySQL/XAMPP.
* Khi viết các bài test giao diện hoặc kiểm tra lỗi regression.

---

## 3. Chế Độ 2: Backend NestJS Mode (Thật)

Chế độ này kết nối trực tiếp giao diện Frontend với máy chủ NestJS thật và lưu trữ dữ liệu vào database MySQL.

### Các bước khởi chạy:
1. **Bật dịch vụ MySQL** trên bảng điều khiển XAMPP Control Panel.
2. **Khởi động máy chủ NestJS** (cổng 3000):
   ```bash
   cd backend
   npm run start
   ```
3. **Cấu hình cục bộ cho các Frontend** (để trỏ sang cổng 3000):
   Tạo tệp tin `.env.local` ở cả hai thư mục `frontend-user/` và `frontend-admin/` với nội dung:
   ```env
   VITE_API_BASE_URL=http://localhost:3000/api/v1
   ```
   *(Lưu ý: Tệp `.env.local` đã được cấu hình trong `.gitignore` nên sẽ không bị commit lên Git).*
4. **Khởi động các dự án Frontend**:
   * **User App:** `npm run dev:user`
   * **Admin App:** `npm run dev:admin`

### Khi nào nên dùng:
* Khi cần test các nghiệp vụ thật: Tính toán giá tiền phía máy chủ (Server-side Pricing), trừ kho sản phẩm khi đặt hàng và hoàn trả khi hủy đơn, phân công thợ theo kỹ năng/địa bàn, thu hồi/khóa trạng thái thợ bận.

---

## 4. Tài Khoản Quản Trị Cục Bộ (Admin Test Account)
Sử dụng tài khoản seed dưới đây để đăng nhập vào phân hệ quản trị (`frontend-admin`) ở cả 2 chế độ:
* **Email:** `admin@dienlanh247.vn`
* **Mật khẩu:** `admin123`
*(Lưu ý: Tài khoản này chỉ dùng cho môi trường phát triển cục bộ và môi trường thử nghiệm).*

---

## 5. Các Lệnh Kiểm Tra & Bảo Trì Chất Lượng

Luôn chạy các lệnh dưới đây trước khi commit code để đảm bảo dự án không bị lỗi cú pháp hoặc lỗi nghiệp vụ:

### A. Kiểm tra cú pháp & Kiểu dữ liệu (Root)
```bash
npm run check:all
```
*(Lệnh này tự động chạy kiểm tra typecheck và lint trên cả hai phân hệ frontend-user và frontend-admin).*

### B. Kiểm thử nghiệp vụ Mock API (Root)
```bash
node scratch/test_order_pricing.js
node scratch/test_service_request_lifecycle.js
node scratch/test_technician_rules.js
node scratch/test_enum_contract.js
```

### C. Kiểm thử tích hợp Backend NestJS thật (MySQL phải bật)
```bash
node scratch/test_nestjs_api.js
```

---

## 6. Cảnh Báo An Toàn & Quy Tắc Phát Triển
> [!WARNING]
> **Quy tắc tuyệt đối không được vi phạm:**
> 1. **Không commit tệp `.env.local`:** Tệp này chứa cấu hình môi trường local của máy cá nhân, tuyệt đối không được đưa lên hệ thống kiểm soát phiên bản.
> 2. **Không commit mật khẩu production:** Mọi thông tin nhạy cảm của môi trường production phải được cấu hình qua biến môi trường của hệ thống hosting.
> 3. **Không xóa Mock API:** Mock API là chốt chặn an toàn và phục vụ việc chạy thử nghiệm độc lập của Frontend, tuyệt đối giữ nguyên vẹn.
> 4. **Không đổi `.env.example` mặc định:** Giữ nguyên địa chỉ Mock API ở `.env.example` làm mặc định để các lập trình viên khác tải về có thể khởi chạy được ngay mà không cần cài đặt MySQL.
