## Mục tiêu

<!-- Mô tả ngắn vấn đề cần giải quyết và kết quả mong muốn. -->

## Phạm vi thay đổi

- [ ] `frontend-user`
- [ ] `frontend-admin`
- [ ] `backend`
- [ ] `prisma/database`
- [ ] `mock-api`
- [ ] `CI/tooling`
- [ ] `documentation`

### File hoặc module chính

<!-- Liệt kê các file/module quan trọng. -->

## Loại thay đổi

- [ ] Tính năng mới
- [ ] Sửa lỗi
- [ ] Refactor
- [ ] Bảo mật
- [ ] Thay đổi database/migration
- [ ] Tài liệu
- [ ] Build/CI/tooling

## Thay đổi hành vi

### Trước thay đổi

<!-- Mô tả hành vi cũ. -->

### Sau thay đổi

<!-- Mô tả hành vi mới. -->

## API và dữ liệu

- [ ] Không thay đổi API contract.
- [ ] Có thay đổi API contract và đã cập nhật tài liệu/client liên quan.
- [ ] Không thay đổi Prisma schema.
- [ ] Có migration mới và đã mô tả rollback.
- [ ] Seed đã được cập nhật nếu cần.

### Migration / rollback

<!-- Điền `Không áp dụng` nếu không có thay đổi database. -->

## Cách kiểm thử

<!-- Ghi các bước cụ thể để reviewer tái hiện. -->

```bash
npm run validate:repo
npm run lint
npm run typecheck
npm run test
npm run build
```

## Kết quả kiểm tra

- [ ] `npm ci` và `npm run bootstrap` chạy sạch.
- [ ] Repository validation pass.
- [ ] Lint pass.
- [ ] Type-check pass.
- [ ] Test liên quan pass.
- [ ] Build các ứng dụng liên quan pass.
- [ ] Kiểm tra responsive nếu thay đổi UI.
- [ ] Kiểm tra phân quyền nếu thay đổi admin/backend.

## Hình ảnh / video

<!-- Đính kèm trước/sau nếu thay đổi giao diện. -->

## Bảo mật

- [ ] Không commit `.env` thật.
- [ ] Không commit token, password, private key hoặc database dump.
- [ ] Không ghi dữ liệu nhạy cảm vào log.
- [ ] Endpoint mới có validation và phân quyền phù hợp.
- [ ] Thao tác nguy hiểm có confirmation/audit khi cần.

## Rủi ro và ảnh hưởng

<!-- Nêu rủi ro, phạm vi người dùng bị ảnh hưởng và phương án giảm thiểu. -->

## Checklist hoàn tất

- [ ] Phạm vi PR chỉ chứa thay đổi liên quan.
- [ ] Tên branch và commit tuân thủ quy ước.
- [ ] README / `.env.example` / tài liệu đã cập nhật.
- [ ] Không còn TODO bắt buộc trước khi merge.
- [ ] CI pass hoặc đã giải thích rõ blocker.
