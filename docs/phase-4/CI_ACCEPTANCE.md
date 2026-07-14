# Ma trận nghiệm thu CI Giai đoạn 4

| Quality gate | Phạm vi | Yêu cầu |
|---|---|---|
| Clean install | Root và bốn ứng dụng | `npm ci` pass |
| Prisma | Backend | Validate và generate pass |
| Repository validation | Toàn repo | Không secret, đủ file kiến trúc |
| Lint | Mock API, customer, admin, backend | Pass |
| Type-check | Customer, admin, backend | Pass |
| Architecture tests | Root và ba ứng dụng | Pass, gồm contract Giai đoạn 4 |
| Build | Customer, admin, backend | Pass |
| Mock API business tests | Order, service, technician, enum | Pass |

Giai đoạn 4 chỉ được bàn giao khi workflow cuối cùng đạt toàn bộ quality gate trên và Pull Request được trả về base `agent/phase-3-design-system` để diff chỉ còn thay đổi website khách hàng tĩnh.
