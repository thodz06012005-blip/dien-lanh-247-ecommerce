# Quality gates Giai đoạn 6

Giai đoạn 6 chỉ được nghiệm thu khi các nhóm kiểm tra sau cùng PASS trên cùng commit.

## Continuous Integration toàn repository

```bash
npm ci
npm run bootstrap
npm run validate:repo
npm run lint
npm run typecheck
npm run test:architecture
npm run build:all
npm run test:mock
```

Mục tiêu: bảo đảm Giai đoạn 6 không phá customer, admin, backend, mock API hoặc contract các giai đoạn trước.

## MySQL và API integration

Workflow: `.github/workflows/phase6-service-request-integration.yml`.

Các bước bắt buộc:

1. Khởi tạo MySQL 8 sạch.
2. Prisma validate và generate.
3. Áp dụng toàn bộ migration Giai đoạn 1–6.
4. Chạy toàn bộ seed hai lần.
5. Build và khởi động NestJS.
6. Tạo yêu cầu bằng public API.
7. Kiểm tra mã đúng format và trạng thái `NEW`.
8. Tra cứu bằng mã + điện thoại đúng.
9. Xác nhận response đã che PII và không có địa chỉ.
10. Tra cứu sai điện thoại trả 404 chung.
11. Đăng nhập admin bằng HttpOnly cookie.
12. Chặn `NEW → COMPLETED`.
13. Cho phép `NEW → CONFIRMED → ASSIGNED → IN_PROGRESS`.
14. Chặn `ASSIGNED → COMPLETED`.
15. Kiểm tra nhánh `WAITING_PARTS`.
16. Hoàn thành, bảo hành và đóng hồ sơ.
17. Kiểm tra trạng thái đóng không thể mở lại.
18. Kiểm tra timeline và audit database.
19. Kiểm tra admin list thấy yêu cầu vừa tạo.

## Lighthouse

Customer Lighthouse của Giai đoạn 4–5 tiếp tục phải PASS để bảo đảm form và lookup mới không làm suy giảm trang customer nền.

## Nghiệm thu thủ công

- Form hiển thị tốt ở desktop và mobile.
- Keyboard focus rõ ràng.
- Có loading/error/empty/success state.
- Ảnh preview không méo và có thể xóa trước khi gửi.
- Quick filters admin cập nhật đúng số lượng.
- Chỉ các bước chuyển được backend cho phép xuất hiện.
- Timeline, audit và album ảnh khớp thứ tự thời gian.

## Diff isolation

PR Giai đoạn 6 phải có:

- base: `agent/phase-5-managed-content`;
- head: `agent/phase-6-service-request-lifecycle`;
- merge base đúng commit nghiệm thu Giai đoạn 5;
- `behind_by = 0`;
- không lặp file chỉ thuộc Giai đoạn 1–5 trừ file được mở rộng có chủ đích.
