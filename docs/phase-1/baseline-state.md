# Git và environment-template baseline

Ghi nhận trước khi sửa tài liệu Giai đoạn 1:

| Trường | Giá trị |
|---|---|
| Repository | `thodz06012005-blip/dien-lanh-247-ecommerce` |
| Remote | `https://github.com/thodz06012005-blip/dien-lanh-247-ecommerce.git` |
| Nhánh ban đầu | `main` |
| Working tree ban đầu | Sạch (`git status --short` không có output) |
| Commit | `bfe7d092b080388b6e151db729fa6ec28d43fb48` |
| Commit subject | `chore: remove temporary phase 2 placeholder` |
| Tag rollback | `legacy-ecommerce-final` (annotated, local) |
| Nhánh refactor | `refactor/service-only-production` (local) |

Tag và nhánh cùng bắt đầu tại commit `bfe7d09`. Trạng thái `local` có nghĩa là chưa được push; tài liệu không giả định mốc đã tồn tại trên remote.

## Checksum file môi trường mẫu

Chỉ checksum file `.env.example`/`.env.staging.example`; không đọc hoặc lưu `.env` thật.

| File | SHA-256 |
|---|---|
| `backend/.env.example` | `c6a2dfdbe58bc745271f8a2bae67090717a18cd4bd5b3a0330901c29d509aafc` |
| `backend/.env.staging.example` | `1bfd4ba99abe29765313140c0c20a3350d04a62ff9829ef93966eb0b54cf0396` |
| `frontend-user/.env.example` | `bd8237cd28f8970546fbb60934e082d189ee10cc72c0e9aa7efdb2cafd255aaa` |
| `frontend-user/.env.staging.example` | `3def50ab41eaa9bb14e89c77db81b8c3621a0e50c779983dcfb1267233838d50` |
| `frontend-admin/.env.example` | `e3fe0ecc5cd3882e2f7802db7802673fc6c01b0ea5b4c312694442f50b095b00` |
| `frontend-admin/.env.staging.example` | `4fcafd9490b3f5e817eb2e147257acbe28f7f4ae9fb88bb2697e72a7f33dbb96` |
| `mock-api/.env.example` | `259b326b3f0c35aaa146894ab0c8db43c4713ffe39552ee5bcd45abe0a8371a9` |

Lệnh xác minh:

```bash
sha256sum backend/.env.example backend/.env.staging.example \
  frontend-user/.env.example frontend-user/.env.staging.example \
  frontend-admin/.env.example frontend-admin/.env.staging.example \
  mock-api/.env.example
```
