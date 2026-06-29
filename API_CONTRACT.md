# HỢP ĐỒNG API (API CONTRACT) - ĐIỆN LẠNH 247 PLATFORM

Tài liệu này đặc tả toàn bộ hệ thống API hiện tại giữa cổng người dùng (`frontend-user`), cổng quản trị (`frontend-admin`) và máy chủ API mô phỏng (`mock-api`). Tài liệu này đóng vai trò làm tài liệu kỹ thuật chuẩn để xây dựng và migrate sang backend NestJS thật sau này.

---

## 1. BỐI CẢNH HỆ THỐNG
* **Mock API Base URL:** `http://localhost:3001/api/v1` (Nguồn dữ liệu hoạt động chính hiện tại của cả hai phân hệ frontend).
* **Frontend User Port:** `5173` (Cổng giao diện khách hàng).
* **Frontend Admin Port:** `5174` (Cổng giao diện quản trị).
* **Backend NestJS Port:** `3000` (Hiện tại đang là nền tảng dự phòng, chưa đấu nối trực tiếp với frontend).
* **Cơ chế xác thực Admin:** Sử dụng mã thông báo Bearer Token (`Authorization: Bearer <token>`) được lưu ở `localStorage` của trình duyệt.

---

## 2. ENUM & CONSTANT CHUẨN HÓA

### 2.1 ServiceRequestStatus (Trạng thái yêu cầu dịch vụ)
* `pending`: Chờ xác nhận (Trạng thái khi khách hàng vừa gửi yêu cầu).
* `confirmed`: Đã xác nhận (Admin đã duyệt thông tin).
* `assigned`: Đã phân công (Đã gán kỹ thuật viên phụ trách).
* `completed`: Hoàn thành (Đã sửa chữa xong và thu tiền).
* `cancelled`: Đã hủy.
* *Lưu ý: Chưa áp dụng trạng thái `in_progress` ở thời điểm hiện tại.*

### 2.2 ServiceRequestPriority (Độ ưu tiên dịch vụ)
* `low`: Thấp.
* `medium`: Thường (mặc định).
* `high`: Cao.
* `urgent`: Khẩn cấp.

### 2.3 TechnicianStatus (Trạng thái kỹ thuật viên)
* `available`: Sẵn sàng nhận việc.
* `busy`: Đang làm việc (đang có ít nhất một yêu cầu sửa chữa ở trạng thái `assigned`).
* `offline`: Ngoại tuyến.
* `inactive`: Ngừng hoạt động.

### 2.4 OrderStatus (Trạng thái đơn hàng)
* `pending`: Chờ xử lý.
* `processing`: Đang xử lý.
* `shipped`: Đang giao hàng.
* `delivered`: Đã giao hàng.
* `cancelled`: Đã hủy.

### 2.5 PaymentStatus (Trạng thái thanh toán)
* `unpaid`: Chưa thanh toán.
* `paid`: Đã thanh toán.
* `failed`: Thanh toán thất bại.
* `refunded`: Đã hoàn tiền.

### 2.6 PaymentMethod (Phương thức thanh toán)
* **Gói tin API & Frontend:** Luôn sử dụng chữ thường (`lowercase`):
  * `cod`: Thanh toán khi nhận hàng.
  * `bank_transfer`: Chuyển khoản ngân hàng.
* **Database (mock-db.json):** Lưu trữ dạng chữ hoa (`uppercase`):
  * `COD`
  * `BANK_TRANSFER`
* *Lưu ý: Server chịu trách nhiệm tự động chuẩn hóa (normalize) sang chữ hoa khi lưu vào DB, và chuyển ngược lại thành chữ thường khi trả dữ liệu về qua API.*

### 2.7 District / WorkingArea (Khu vực địa lý)
Mọi tên quận huyện đều phải dùng định dạng chuẩn hóa có tiền tố `"Quận "` ở phía trước. Danh sách 12 quận huyện được hỗ trợ:
* `Quận Cầu Giấy`, `Quận Đống Đa`, `Quận Ba Đình`, `Quận Hai Bà Trưng`, `Quận Hoàn Kiếm`, `Quận Thanh Xuân`, `Quận Tây Hồ`, `Quận Long Biên`, `Quận Nam Từ Liêm`, `Quận Bắc Từ Liêm`, `Quận Hà Đông`, `Quận Hoàng Mai`.

---

## 3. NHÓM API PUBLIC & USER (KHÁCH HÀNG)

### 3.1 Lấy danh sách sản phẩm
* **Endpoint:** `GET /products`
* **Query Params:**
  * `categoryId` (optional): Lọc theo danh mục.
  * `brandId` (optional): Lọc theo thương hiệu.
  * `priceMin` (optional): Giá tối thiểu.
  * `priceMax` (optional): Giá tối đa.
  * `inStock` (optional, `'true' | 'false'`): Lọc theo tình trạng còn hàng.
  * `hasPromo` (optional, `'true' | 'false'`): Lọc sản phẩm khuyến mãi.
  * `inverter` (optional, `'true' | 'false'`): Lọc công nghệ Inverter.
  * `capacity` (optional): Lọc công suất lạnh.
  * `q` (optional): Tìm kiếm theo tên sản phẩm, SKU, mô tả.
  * `sort` (optional): Sắp xếp (`priceAsc`, `priceDesc`, `bestSeller`, `promoHot`).
  * `page` (optional, mặc định `1`): Trang hiện tại.
  * `limit` (optional, mặc định `12`): Số lượng sản phẩm mỗi trang.
* **Response Shape (200):**
  ```json
  {
    "success": true,
    "message": "Lấy danh sách sản phẩm thành công",
    "data": [
      {
        "id": "dh-daikin-ftkf25xvmv",
        "name": "Điều hòa Daikin Inverter 1 HP FTKF25XVMV",
        "slug": "dieu-hoa-daikin-inverter-1-hp-ftkf25xvmv",
        "sku": "FTKF25XVMV",
        "price": 10490000,
        "basePrice": 11990000,
        "salePrice": 10490000,
        "stock": 18,
        "thumbnail": "...",
        "images": [{"url": "..."}],
        "specifications": {
          "Công suất lạnh": "1 HP (9.200 BTU)",
          "Công nghệ tiết kiệm điện": "Inverter"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 12,
      "total": 24,
      "totalPages": 2
    }
  }
  ```

### 3.2 Lấy chi tiết sản phẩm
* **Endpoint:** `GET /products/:identifier`
* **Path Variable:** `identifier` nhận vào `id` hoặc `slug` sản phẩm.
* **Response Shape (200):** Trả về chi tiết một đối tượng sản phẩm đã map tương thích.

### 3.3 Lấy danh sách sản phẩm nổi bật
* **Endpoint:** `GET /products/featured`
* **Response Shape (200):** Trả về danh sách sản phẩm có `isFeatured === true` và `status === 'active'`.

### 3.4 Tìm kiếm sản phẩm nhanh (Autocomplete)
* **Endpoint:** `GET /products/search`
* **Query Params:** `q` (bắt buộc).
* **Response Shape (200):** Trả về tối đa 10 sản phẩm hoạt động khớp từ khóa.

### 3.5 Lấy danh mục sản phẩm & thương hiệu
* **Endpoints:** 
  * `GET /categories`
  * `GET /brands`

### 3.6 Lấy thông tin cấu hình công khai
* **Endpoint:** `GET /settings/public`
* **Response Shape (200):** Trả về các thông tin `hotline`, `zalo`, `email`, `address`, `shippingFee`, `freeShippingThreshold`.

### 3.7 Lấy danh sách danh mục dịch vụ
* **Endpoint:** `GET /service-categories`

### 3.8 Đặt lịch sửa chữa (Tạo Service Request)
* **Endpoint:** `POST /service-requests`
* **Request Body:**
  ```json
  {
    "customerName": "Nguyễn Văn A",
    "customerPhone": "0912345678",
    "customerAddress": "Số 123 Đường Cầu Giấy",
    "district": "Quận Cầu Giấy",
    "serviceCategoryId": "ve-sinh-dieu-hoa",
    "applianceType": "Điều hòa treo tường Daikin",
    "issueDescription": "Máy chạy yếu, phả gió không mát",
    "preferredDate": "2026-07-01",
    "preferredTimeSlot": "10:00 - 12:00",
    "note": "Gọi trước khi đến 15 phút"
  }
  ```
* **Logic xử lý của Server:**
  * Validate số điện thoại đúng định dạng di động Việt Nam.
  * Kiểm tra `serviceCategoryId` có tồn tại trong DB.
  * Tự động bổ sung tiền tố `"Quận "` vào trường `district` nếu client gửi thiếu.
  * Tự động gán độ ưu tiên mặc định là `medium` và trạng thái ban đầu là `pending`.

### 3.9 Khách hàng tra cứu lịch sửa chữa
* **Endpoints:**
  * `GET /my-service-requests?phone=<phone>`: Danh sách lịch sử yêu cầu của khách hàng theo số điện thoại.
  * `GET /service-requests/:id?phone=<phone>`: Chi tiết một yêu cầu dịch vụ cụ thể (phải khớp số điện thoại để xác thực).

### 4. ĐẶT HÀNG (POST /orders) - ĐẶC TẢ CHI TIẾT

Đây là endpoint áp dụng cơ chế **Server-side Pricing** để đảm bảo tính an toàn tài chính tuyệt đối, chống lại các hành vi sửa đổi gói tin từ phía client.

* **Endpoint:** `POST /orders`
* **Request Body:**
  ```json
  {
    "customerName": "Nguyễn Văn A",
    "phone": "0912345678",
    "email": "customer@gmail.com",
    "city": "Hà Nội",
    "district": "Quận Cầu Giấy",
    "addressDetail": "Số 12, Ngõ 34 Cầu Giấy",
    "note": "Giao giờ hành chính",
    "paymentMethod": "cod",
    "voucherCode": "GIAM50K",
    "items": [
      {
        "productId": "lk-remote-daikin",
        "quantity": 2
      }
    ]
  }
  ```
  > [!IMPORTANT]
  > Client tuyệt đối không được gửi các trường tổng tiền như `totalAmount`, `discountAmount`, hay `shippingFee`. Nếu cố tình gửi lên, server sẽ bỏ qua hoàn toàn.

* **Logic xử lý và tính toán tại Server:**
  1. **Validate đầu vào:**
     * Chặn nếu mảng `items` rỗng.
     * Chặn nếu `productId` không tồn tại hoặc sản phẩm không ở trạng thái hoạt động (`status !== 'active'`).
     * Chặn nếu `quantity` không phải số nguyên dương (`<= 0`).
     * Chặn nếu `quantity` vượt quá tồn kho thực tế (`p.stock`).
  2. **Tính toán Subtotal:**
     * Duyệt qua từng sản phẩm trong DB, lấy đơn giá chính xác (ưu tiên `salePrice` nếu có và hợp lệ, ngược lại dùng `basePrice`).
     * `subtotal = sum(price * quantity)`.
  3. **Tính toán Phí vận chuyển (shippingFee):**
     * Nếu `subtotal >= freeShippingThreshold` (cấu hình trong settings, mặc định `5.000.000đ`): `shippingFee = 0`.
     * Ngược lại, kiểm tra nếu trong giỏ hàng có thiết bị cồng kềnh thuộc danh mục (`dieu-hoa`, `tu-lanh`, `may-giat`, `may-say`, `tu-dong`): `shippingFee = 150.000đ`.
     * Nếu không có thiết bị lớn: `shippingFee = settings.shippingFee` (mặc định `30.000đ`).
  4. **Tính toán Giảm giá (discountAmount):**
     * So khớp `voucherCode` với danh sách voucher tĩnh của hệ thống.
     * Nếu voucher hợp lệ và `subtotal` đạt ngưỡng tối thiểu (`minOrderValue`):
       * `percentage` voucher: `discount = (subtotal * value) / 100` (giới hạn bởi `maxDiscount`).
       * `fixed` voucher: `discount = value`.
     * Đảm bảo số tiền giảm giá không vượt quá `subtotal`. Nếu không đủ điều kiện hoặc mã sai, gán `discountAmount = 0`.
  5. **Tính tổng tiền (totalAmount):**
     * `totalAmount = Math.max(0, subtotal + shippingFee - discountAmount)`.
  6. **Trừ tồn kho (Stock):**
     * Thực hiện trừ kho trực tiếp: `p.stock -= quantity`.
     * Nếu tồn kho chạm `0`, tự động cập nhật trạng thái sản phẩm sang `'out_of_stock'`.
  7. **Chuẩn hóa PaymentMethod:**
     * Validate phương thức thanh toán phải nằm trong danh mục cho phép. Chuẩn hóa giá trị từ chữ thường (`cod` / `bank_transfer`) sang chữ hoa (`COD` / `BANK_TRANSFER`) trước khi lưu vào DB.

### 4.1 Khách hàng tra cứu đơn hàng
* **Endpoints:**
  * `GET /orders?phone=<phone>`: Danh sách đơn hàng theo số điện thoại.
  * `GET /orders/:id?phone=<phone>`: Chi tiết đơn hàng (phải khớp số điện thoại để xác thực).
  * `PATCH /orders/:id/cancel`: Khách hàng tự hủy đơn hàng (chỉ khả dụng khi đơn hàng ở trạng thái `pending`). Hệ thống sẽ tự động khôi phục số lượng tồn kho sản phẩm tương ứng.

---

## 5. NHÓM API CUSTOMER AUTH & CONTACT

### 5.1 Khách hàng đăng nhập / đăng ký (Mock Auth)
* `POST /auth/login`: Nhận `email` và trả về thông tin người dùng mock.
* `POST /auth/register`: Nhận `email`, `firstName`, `lastName` và tạo tài khoản mock.
* `POST /auth/logout`: Đăng xuất tài khoản.
* `GET /auth/me`: Lấy thông tin tài khoản hiện tại.

### 5.2 Gửi thông tin liên hệ
* `POST /contact`: Nhận `name`, `phone`, `email`, `message` để lưu lại yêu cầu hỗ trợ.

---

## 6. NHÓM API ADMIN AUTH, DASHBOARD & SETTINGS

### 6.1 Đăng nhập quản trị
* **Endpoint:** `POST /admin/auth/login`
* **Request Body:**
  ```json
  {
    "email": "owner@dienlanh247.vn",
    "password": "Admin@123"
  }
  ```
* **Response thành công (200):** Trả về Bearer Token để client sử dụng cho các request tiếp theo.

### 6.2 Lấy thông tin cá nhân Admin / Đăng xuất
* `GET /admin/auth/me` (Yêu cầu Bearer Token).
* `POST /admin/auth/logout`: Xóa session admin khỏi bộ nhớ đệm máy chủ.

### 6.3 Lấy thông số thống kê Dashboard
* **Endpoint:** `GET /admin/dashboard` (Yêu cầu Bearer Token).
* **Response Shape (200):** Trả về doanh thu trong ngày (`todayRevenue`), số đơn hàng chờ duyệt (`pendingOrders`), số khách hàng mới (`newCustomers`), tổng số sản phẩm (`totalProducts`), tổng số đơn hàng (`totalOrders`), và danh sách 5 đơn hàng mới nhất (`recentOrders`).

### 6.4 Lấy và cập nhật cấu hình hệ thống
* `GET /admin/settings` (Yêu cầu Bearer Token).
* `PATCH /admin/settings` (Yêu cầu Bearer Token): Cập nhật thông số hệ thống.

---

## 7. NHÓM API ADMIN PRODUCTS
Các endpoint này yêu cầu quyền quản trị viên (`Bearer token`).

* **GET /admin/products:** Lấy toàn bộ danh sách sản phẩm kèm thông tin tồn kho.
* **POST /admin/products:** Tạo mới sản phẩm.
* **PATCH /admin/products/:id:** Cập nhật thông tin sản phẩm.
* **DELETE /admin/products/:id:** Xóa sản phẩm.
* **Các thuộc tính quan trọng:**
  * `id`, `name`, `slug`, `sku`, `categoryId`, `brandId`, `basePrice`, `salePrice`, `stock`, `status` (`'active' | 'hidden' | 'out_of_stock'`), `thumbnail`, `images`.
* **Quy tắc validate của Server:**
  * `basePrice` phải lớn hơn `0`.
  * `salePrice` (nếu có) phải lớn hơn `0` và nhỏ hơn hoặc bằng `basePrice`.
  * `stock` không được âm (`>= 0`).
  * `name`, `categoryId`, `brandId` là các trường bắt buộc.

---

## 8. NHÓM API ADMIN SERVICE REQUESTS

### 8.1 Lấy danh sách yêu cầu dịch vụ
* **Endpoint:** `GET /admin/service-requests` (Yêu cầu Bearer Token).
* **Query Params:** `status`, `serviceCategoryId`, `district`, `q`.

### 8.2 Phân công kỹ thuật viên (Assign Technician)
* **Endpoint:** `PATCH /admin/service-requests/:id/assign-technician` (Yêu cầu Bearer Token).
* **Request Body:**
  ```json
  {
    "technicianId": "TECH-001"
  }
  ```
* **Logic xử lý và Validate nghiêm ngặt tại Server:**
  1. Yêu cầu dịch vụ phải tồn tại và chưa ở trạng thái `completed` hoặc `cancelled`.
  2. Kỹ thuật viên phải tồn tại trong hệ thống.
  3. Kỹ thuật viên phải ở trạng thái `"available"` (hoặc chính là người đang được phân công cho yêu cầu này).
  4. **Kiểm tra Kỹ năng:** `tech.skills` phải chứa `request.serviceCategoryId`.
  5. **Kiểm tra Địa bàn:** `tech.workingAreas` phải chứa `request.district` (so sánh chuỗi khớp tuyệt đối có tiền tố `"Quận "`).
  6. **Cập nhật trạng thái:**
     * Yêu cầu chuyển trạng thái sang `"assigned"`.
     * Kỹ thuật viên mới chuyển trạng thái sang `"busy"`.
     * **Giải phóng thợ cũ đúng cách:** Nếu trước đó yêu cầu đã được gán cho thợ cũ (`oldTechId`), tiến hành kiểm tra xem thợ cũ còn công việc nào ở trạng thái `"assigned"` hay không. Nếu không còn, tự động trả thợ cũ về `"available"`, ngược lại giữ nguyên `"busy"`.

### 8.3 Hoàn thành / Hủy yêu cầu dịch vụ (Complete / Cancel)
* **Endpoint:** `PATCH /admin/service-requests/:id/status` (Yêu cầu Bearer Token).
* **Request Body (Hoàn thành):**
  ```json
  {
    "status": "completed",
    "finalPrice": 250000,
    "note": "Đã thay thế tụ điện thành công"
  }
  ```
* **Request Body (Hủy):**
  ```json
  {
    "status": "cancelled",
    "note": "Khách hàng báo bận đột xuất"
  }
  ```
* **Logic xử lý của Server:**
  * Chỉ cho phép chuyển trạng thái theo đúng luồng:
    * `pending` -> `confirmed` / `cancelled`
    * `confirmed` -> `assigned` / `cancelled`
    * `assigned` -> `completed` / `cancelled`
  * Chặn hoàn toàn hành vi chuyển đổi trạng thái từ `completed` hoặc `cancelled` đi nơi khác.
  * **Khi Hoàn thành (completed):**
    * Yêu cầu phải có `assignedTechnicianId` và `finalPrice` phải là số hợp lệ `>= 0`.
    * Tự động tăng số lần hoàn thành công việc của thợ phụ trách: `tech.completedCount += 1`.
    * Ghi nhận thời gian hoàn thành vào trường `completedAt`.
  * **Giải phóng kỹ thuật viên:**
    * Cả khi hoàn thành hoặc hủy đơn, server sẽ tự động đếm các công việc `"assigned"` khác của kỹ thuật viên đó. Nếu không còn công việc nào, chuyển thợ về `"available"`, ngược lại giữ `"busy"`.

---

## 9. NHÓM API ADMIN TECHNICIANS

* **GET /admin/technicians:** Lấy danh sách kỹ thuật viên kèm thông tin số lượng việc trong ngày (`todayJobs`) và công việc hiện tại (`currentJob`).
* **POST /admin/technicians:** Tạo mới hồ sơ thợ.
* **PATCH /admin/technicians/:id:** Cập nhật thông tin thợ.
* **DELETE /admin/technicians/:id:** Xóa hồ sơ thợ.

### 9.1 Quy tắc Whitelist cập nhật (PATCH)
* **Các trường cho phép sửa:** `name`, `phone`, `email`, `avatar`, `rating`, `skills`, `workingAreas`, `status`.
* **Các trường cấm ghi đè:** `id`, `completedCount`, `createdAt`, `updatedAt`, `assignedRequestIds`. (Server sẽ tự động lọc bỏ các trường này ra khỏi gói tin cập nhật).

### 9.2 Ràng buộc nghiệp vụ và khóa trạng thái
* **Chống trùng lặp:** Chặn tạo mới hoặc cập nhật nếu `phone` hoặc `email` trùng với kỹ thuật viên khác.
* **Định dạng số điện thoại:** Số điện thoại phải đúng định dạng di động Việt Nam.
* **Khóa trạng thái thợ bận (State Locking):** Nếu kỹ thuật viên đang có yêu cầu dịch vụ ở trạng thái `"assigned"` hoạt động:
  * Chặn việc thay đổi trạng thái hoạt động của thợ sang bất kỳ trạng thái nào khác ngoài `"busy"` (không cho phép chuyển về `available`, `offline`, hay `inactive`).
  * Chặn hoàn toàn việc xóa hồ sơ thợ kỹ thuật đó ra khỏi hệ thống.

---

## 10. ĐỊNH DẠNG PHẢN HỒI LỖI (ERROR RESPONSE)
Hệ thống sử dụng một cấu trúc phản hồi lỗi đồng nhất:
```json
{
  "success": false,
  "message": "Thông điệp lỗi chi tiết hiển thị cho người dùng",
  "error": "MÃ_LỖI_HỆ_THỐNG"
}
```
**Các mã lỗi thường gặp:**
* `INVALID_PHONE_FORMAT`: Số điện thoại không đúng định dạng.
* `PHONE_DUPLICATE` / `EMAIL_DUPLICATE`: Trùng lặp thông tin liên hệ.
* `INSUFFICIENT_STOCK`: Không đủ hàng tồn kho.
* `INVALID_TRANSITION`: Chuyển đổi trạng thái dịch vụ không hợp lệ.
* `TECHNICIAN_HAS_ACTIVE_JOB`: Thợ đang bận làm việc, không thể sửa trạng thái hoặc xóa.

---

## 11. ĐƯỜNG DẪN DEV / RESET DATABASE
Để phục vụ việc kiểm thử tích hợp tự động và phát triển cục bộ, mock-api cung cấp endpoint reset dữ liệu mẫu:
* **Endpoint:** `POST /dev/reset-db`
* **Response Shape (200):** Trả về thông báo thành công và ghi đè trạng thái DB trong `mock-db.json` về trạng thái ban đầu của hạt giống (seed).

---

## 12. GHI CHÚ DI TRÚ (MIGRATION NOTES) CHO NESTJS
Khi tiến hành xây dựng backend thật bằng NestJS, cần lưu ý các điểm sau để đảm bảo tương thích ngược 100% với hai phân hệ frontend:
1. **Chuẩn hóa kiểu dữ liệu đầu ra:**
   * Đối với đối tượng Đơn hàng (Order), đảm bảo phương thức thanh toán (`paymentMethod`) trả về qua API phải ở dạng viết thường (`cod` / `bank_transfer`), mặc dù trong cơ sở dữ liệu thực tế lưu trữ ở dạng viết hoa (`COD` / `BANK_TRANSFER`).
   * Đối với đối tượng Sản phẩm (Product), đảm bảo các trường giá bán (`basePrice`, `salePrice`) và tồn kho (`stock`) phải được trả về dưới dạng số (`number`), tránh chuyển thành chuỗi văn bản.
2. **Hỗ trợ Guest Checkout:**
   * Endpoint tạo đơn hàng phải cho phép khách vãng lai đặt hàng mà không bắt buộc đính kèm JWT token của tài khoản người dùng.
3. **Logic đồng bộ trạng thái tự động:**
   * Phân hệ Service Request và Technician yêu cầu cơ chế đồng bộ trạng thái tự động (Event-driven hoặc Transactional). Khi trạng thái của Service Request thay đổi, trạng thái của Technician tương ứng phải được cập nhật ngay lập tức trong cùng một transaction để tránh lệch dữ liệu.
