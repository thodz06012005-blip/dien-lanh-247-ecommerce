# P0 — Hợp đồng vận hành và nghiệm thu C01–C05

Phạm vi: sửa nền tảng chạy thật, chưa thiết kế lại giao diện và chưa tự xác nhận danh mục/giá/khu vực thực tế của cửa hàng. Base URL NestJS: `/api/v1`. Mock API chỉ dùng phát triển, không thay NestJS trong production.

## 1. Frontend và cấu hình

- App chỉ dùng lazy import, một App và một cây route; MainLayout có một Outlet.
- `GET /settings/public`: `{success:true,data:{hotline,zalo,email,address,shippingFee,freeShippingThreshold,businessConfig}}`.
- Public businessConfig chỉ gồm appliances, serviceAreas, timeSlots, pricing; không trả chính sách tài chính, quyền hoặc PIN.
- Cấu hình mới chưa khai báo trả danh sách rỗng và phí 0, không bật khoảng giá. Giao diện báo chưa mở đặt lịch. API hỏng/sai schema: hiển thị lỗi và nút thử lại, không dùng vùng phục vụ hay giá mẫu.
- `GET /admin/settings`: ADMIN/SUPERADMIN đọc đầy đủ. `PATCH /admin/settings`: SUPERADMIN, gửi businessConfig đầy đủ; sai cấu trúc trả 400. Các cấu hình mẫu trong mock là dữ liệu thử nghiệm, không phải xác nhận của chủ cửa hàng.
- appliances: `{id,name,active,issues:string[],priceMin,priceMax}`; serviceAreas: `{id,name,active,travelFee}`; timeSlots: `{id,label,active}`; pricing: `{inspectionFee,emergencySurcharge,showPriceRanges,disclaimer}`. Tiền VND không âm, giá tối đa không nhỏ hơn tối thiểu. Backend kiểm tra ID/tên trùng và cấu trúc lồng nhau.

## 2. Hợp đồng endpoint

JSON thành công: `{success:true,data,message?}`; lỗi HTTP: `{success:false,message,...}`. `message` có thể là chuỗi hoặc danh sách lỗi validation. Frontend dựa vào HTTP status, không phụ thuộc chuỗi tiếng Việt. GET/PATCH trả 200, POST tạo yêu cầu/đăng nhập thợ/đăng xuất thợ trả 201. Admin login trả 200.

| Endpoint | Quyền | Input / data |
|---|---|---|
| POST /service-requests | Công khai | customerName, customerPhone, customerAddress, district, serviceCategoryId, applianceType, issueDescription, preferredDate YYYY-MM-DD, preferredTimeSlot; images/mediaMetadata/note tùy chọn. Trả yêu cầu với id để tra cứu. |
| GET /service-requests/lookup/:id?phone=... | Mã + điện thoại | Yêu cầu công khai: thông tin lịch, trạng thái, giá, timeline, thợ tối thiểu. Không trả snapshot tài chính. Thiếu phone 400; sai mã/phone 404. |
| PATCH /admin/service-requests/:id/status | STAFF/ADMIN/SUPERADMIN | status, note?, finalPrice khi hoàn thành |
| PATCH /admin/service-requests/:id/assign-technician | STAFF/ADMIN/SUPERADMIN | technicianId; kiểm tra khu vực/chuyên môn/trạng thái thợ |
| PATCH /admin/service-requests/:id/inspection | STAFF/ADMIN/SUPERADMIN | inspectionNote, estimatedPrice, customerApprovalStatus |
| PATCH /admin/technicians/:id/access | SUPERADMIN | pin: chuỗi 6 chữ số; đặt lại PIN và thu hồi phiên cũ |
| POST /technician/auth/login | Công khai, giới hạn 5 lần/phút | phone, pin; data gồm token và technician |
| POST /technician/auth/logout | Token thợ | Thu hồi phiên hiện tại |
| GET /technician/me | Token thợ | Thông tin thợ, không có PIN/hash |
| GET /technician/jobs | Token thợ | Mảng công việc được phân công |
| GET /technician/jobs/:id | Token thợ sở hữu việc | Chi tiết công việc; việc của người khác 404 |
| PATCH /technician/jobs/:id/decision | Token thợ sở hữu việc | decision accepted/rejected, reason khi từ chối |
| PATCH /technician/jobs/:id/progress | Token thợ sở hữu việc | status in_progress, đã nhận việc |
| PATCH /technician/jobs/:id/inspection | Token thợ sở hữu việc | diagnosis, estimatedPrice, customerApprovalStatus pending/approved/rejected |
| PATCH /technician/jobs/:id/complete | Token thợ sở hữu việc | finalPrice, completionNote, paymentStatus paid/unpaid, photos? |
| GET /technician/earnings | Token thợ | total, thisMonth, jobs[{id,completedAt,revenue,earning}] |
| GET /admin/finance/report?month=YYYY-MM | ADMIN/SUPERADMIN | totals, byDay, byTechnician, byService, requests, recognitionPolicy |
| GET /admin/finance/audit-logs?month=YYYY-MM | ADMIN/SUPERADMIN | Tối đa 200 nhật ký mới nhất, có before/after |
| GET /admin/finance/export?month=YYYY-MM | ADMIN/SUPERADMIN | Tệp SpreadsheetML XML .xls, cùng số liệu report |
| PATCH /admin/finance/requests/:id | ADMIN/SUPERADMIN | partsCost, amountCollected, paymentStatus paid/unpaid/partial, note? |
| PATCH /admin/finance/requests/:id/settlement | ADMIN/SUPERADMIN | status pending/settled, note? |

Lỗi: 400 dữ liệu không hợp lệ; 401 thiếu/hết hạn phiên; 403 sai quyền; 404 không thấy/không sở hữu; 409 trạng thái xung đột, đã hoàn thành hoặc đã đối soát; 429 giới hạn truy cập; 503 cấu hình vận hành chưa hợp lệ. Token thợ không dùng để gọi API admin. PIN lưu bcrypt; token ngẫu nhiên chỉ lưu SHA-256 trong DB, hết hạn sau 12 giờ. Thợ mới không có PIN mặc định.

## 3. Quy trình bắt buộc

pending → confirmed → assigned → in_progress → completed; có thể hủy việc đang mở. Phân công dùng endpoint riêng. Thợ từ chối trả việc về confirmed; phân công lại xóa quyết định/báo giá cũ. Thợ phải nhận việc trước khi bắt đầu. Hoàn thành cần khách đã đồng ý và finalPrice khớp estimatedPrice. Việc completed/cancelled không được mở lại qua endpoint trạng thái.

Ghi nhận khách đồng ý hiện là xác nhận do nhân viên/thợ nhập, chưa phải chữ ký điện tử hoặc OTP khách. Hoàn thành từ admin ghi chưa thu tiền; chỉ chức năng thu tiền ghi số đã thu. Giao dịch DB và khóa hàng ngăn hai lần hoàn thành tăng completedCount/tiền công hai lần.

## 4. Một công thức tiền công

Nguồn duy nhất: `backend/src/domain/finance.js`, dùng bởi NestJS và cả hai route Mock API.

- Cơ sở tính = doanh thu nếu tính cả linh kiện; ngược lại max(0, doanh thu − linh kiện).
- Theo phần trăm: làm tròn VND(cơ sở × tỷ lệ / 100). Theo mức cố định: đúng mức đã cấu hình. Tỷ lệ 0 được giữ nguyên.
- Khi hoàn thành lưu financeSnapshot version, recordedAt, source, policy, revenue, partsCost, commissionBase, technicianPay.
- Đổi cấu hình không thay tiền công đã chốt. Sửa chi phí hợp lệ tính lại bằng chính sách của snapshot cũ, lưu nhật ký before/after. Việc đã đối soát phải mở đối soát trước khi chỉnh.

| Ca thử | Kết quả |
|---|---:|
| 1.000.000 doanh thu, 400.000 linh kiện, 40%, không tính linh kiện | 240.000 |
| Như trên, tính cả linh kiện | 400.000 |
| Tỷ lệ 0% | 0 |
| Công cố định 123.000 | 123.000 |
| Linh kiện lớn hơn doanh thu, không tính linh kiện | 0 |
| Đổi cấu hình từ 40% lên 80% sau hoàn thành | Vẫn 240.000 |
| Sửa linh kiện thành 500.000 trên việc đã chốt 40% | 200.000, có nhật ký |

Không có tài liệu “mục 10” trong yêu cầu hiện tại; các ca tiền trên là ví dụ kiểm thử minh bạch, không tự xác nhận tỷ lệ áp dụng cho cửa hàng.

Báo cáo dùng ngày Việt Nam (Asia/Ho_Chi_Minh). Chính sách completed chọn tháng hoàn thành; paid chọn tháng paidAt và chỉ việc đã thu đủ. Tổng đã thu/công nợ thuộc nhóm việc được chọn, **chưa phải sổ dòng tiền theo từng lần thu**. Thu nhiều đợt và sổ cái tài chính đầy đủ thuộc giai đoạn 5.

## 5. Migration và đưa vào vận hành

1. Sao lưu DB đang dùng; kiểm tra migration history. Với DB đã có bảng nhưng chưa được Prisma quản lý, thực hiện quy trình baseline của dự án trước, không chạy lại migration khởi tạo lên bảng đã tồn tại.
2. Cài backend dependencies; `npm --prefix backend run prisma:generate`; `npm --prefix backend run prisma:migrate:deploy`; build và khởi động backend mới. Migration P0 thêm cột/bảng, không xóa dữ liệu.
3. SUPERADMIN khai báo thiết bị/lỗi/khu vực/giờ/phí và chính sách tài chính thật qua admin/settings. Sau đó đặt PIN riêng cho từng thợ qua endpoint access. Giao diện quản lý PIN chưa được bổ sung trong P0.
4. Deploy frontend trỏ tới NestJS `/api/v1`, kiểm tra yêu cầu thử và tra cứu trên môi trường vận hành.

Dữ liệu cũ: completedAt thiếu lấy updatedAt tại thời điểm migration làm mốc ổn định (có thể không phải thời điểm hoàn thành thực). Không suy đoán paidAt cho khoản thu cũ. Việc cũ chưa có financeSnapshot được đóng băng với source legacy-baseline: dùng cấu hình hiện có; nếu trước đây chưa có cấu hình, dùng cấu hình đầu tiên SUPERADMIN lưu. Đây là mốc chuyển đổi cần chủ cửa hàng đối soát, **không khôi phục được chính sách lịch sử đã mất**. Khi chưa có cấu hình mà tồn tại việc hoàn thành, báo cáo trả 503 thay vì tự chọn tỷ lệ mẫu.

## 6. Nghiệm thu có thể chạy lại

```sh
npm run check:all
npm --prefix backend run build
npm --prefix frontend-user run build
npm --prefix frontend-admin run build
node tests/test_p0_domain.cjs
node tests/test_p0_mock.cjs
# Chỉ trên MySQL trống dùng riêng cho test, tên DB kết thúc _p0_test:
npm --prefix backend run prisma:migrate:deploy
node tests/test_p0_nest.cjs
```

Mock test dùng DB tạm, không sửa mock-db đang phát triển. Nest test chạy AppModule thật, Prisma/MySQL thật, kiểm tra phân quyền, PIN/phiên, cấu hình lỗi, đặt lịch/tra cứu/phân công/nhận việc/báo giá/hoàn thành, hai request hoàn thành đồng thời, tiền công, thay chính sách, chỉnh tài chính, đối soát và export. CI chạy các bước trên cho commit main. Build/typecheck không thay thế kiểm tra giao diện mobile; đánh giá UI chạy thực là bước tiếp theo sau P0.
