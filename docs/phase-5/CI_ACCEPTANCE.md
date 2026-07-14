# Ma trận nghiệm thu Giai đoạn 5

| Quality gate | Phạm vi | Yêu cầu |
|---|---|---|
| Clean install | Root và bốn ứng dụng | `npm ci` pass |
| Prisma | Backend | Validate và generate pass |
| Migration | MySQL sạch | `prisma migrate deploy` pass |
| Content seed | MySQL sau core seed | Seed chạy lặp lại không lỗi |
| Slug | Service, Project, Post, Tag | UNIQUE và API chặn trùng |
| Visibility | Public API | Chỉ trả PUBLISHED đã đến lịch |
| Admin CRUD | 7 nhóm nội dung | Create, update, preview, archive |
| Customer | Service, Project, Post | List/detail dùng backend |
| Lint và TypeScript | Toàn repository | Pass |
| Architecture tests | Root và ba ứng dụng | Pass |
| Build | Customer, admin, backend | Pass |
| Business regression | Mock API | Pass |

PR chỉ được bàn giao khi pipeline cuối cùng đạt toàn bộ quality gate tự động và được trả về base `agent/phase-4-customer-static-pages` để diff chỉ còn Giai đoạn 5.
