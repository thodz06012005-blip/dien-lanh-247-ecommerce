# Quy ước trách nhiệm thư mục

## Root

| Đường dẫn | Trách nhiệm |
| --- | --- |
| `.github/` | CI và template cộng tác |
| `docs/` | Tài liệu yêu cầu, kiến trúc và bàn giao |
| `scripts/` | Tooling chạy ở cấp repository |
| `tests/` | Test tích hợp hoặc contract cấp repository |
| `frontend-user/` | Website khách hàng |
| `frontend-admin/` | Website quản trị |
| `backend/` | NestJS REST API |
| `mock-api/` | API mô phỏng và dữ liệu development |

## Frontend

```text
src/
├── app/          # composition root và providers
├── components/   # component tái sử dụng
├── config/       # validated public configuration
├── constants/    # hằng số UI/domain phía client
├── hooks/        # React hooks
├── layouts/      # route layouts
├── pages/        # route-level screens
├── router/       # route definitions và guards
├── services/     # HTTP client/browser integrations
├── store/        # Zustand state
├── types/        # TypeScript contracts
└── utils/        # pure helper functions
```

Quy tắc:

- `pages` được dùng component/service/store, không ngược lại.
- `config` và `types` không import UI.
- Component dùng chung không phụ thuộc trực tiếp một page.
- API call tập trung trong service hoặc query hook, không tạo Axios instance trong page.
- Side effect cấp ứng dụng đặt trong provider/router, không đặt ở module import toàn cục nếu tránh được.

## Backend

```text
src/
├── common/       # decorator, guard, filter, middleware, interceptor, contract chung
├── config/       # environment/config factories
├── core/         # database và hạ tầng lõi
├── integrations/ # dịch vụ ngoài hệ thống
└── modules/      # module nghiệp vụ
```

Một module nghiệp vụ nên có:

```text
modules/example/
├── dto/
├── example.controller.ts
├── example.service.ts
├── example.module.ts
└── example.service.spec.ts
```

Khi module phức tạp có thể thêm:

```text
├── domain/
├── repositories/
├── mappers/
├── policies/
└── types/
```

Quy tắc phụ thuộc:

```text
controller → service → Prisma/integration
module → common/core
common -X-> module
core -X-> module
integration -X-> controller
```

## Prisma

```text
prisma/
├── schema.prisma
├── seed.ts
├── README.md
└── migrations/
```

- Schema là nguồn sự thật.
- Migration chỉ do Prisma tạo và được review.
- Seed không chứa dữ liệu production.
- Không đặt query nghiệp vụ phức tạp trong seed.

## Test placement

| Test | Vị trí |
| --- | --- |
| Component/unit frontend | Gần source hoặc `tests/` của app |
| Frontend architecture | `<frontend>/tests/` |
| Backend unit | Gần service/controller hoặc `src/**/*.spec.ts` |
| Backend E2E | `backend/test/` |
| Repository contract | `tests/architecture/` |
| Mock business integration | `tests/test_*.js` hiện hữu |

## Naming

- React component: `PascalCase.tsx`.
- Hook: `useSomething.ts`.
- Utility/service: `camelCase.ts` hoặc convention hiện hữu.
- Nest file: `kebab-case.controller.ts`, `.service.ts`, `.module.ts`.
- DTO: `create-entity.dto.ts`.
- Document: `NN_UPPER_SNAKE_CASE.md` trong phase folder.

## Import

- Code mới ở frontend ưu tiên `@/` khi import chéo thư mục.
- Import cùng thư mục có thể dùng relative path ngắn.
- Backend chuyển alias dần, không refactor hàng loạt chỉ để đổi đường dẫn.
- Không import file qua đường dẫn nội bộ của package dependency.

## File không được commit

- `.env` thật;
- `node_modules`;
- `dist`, `build`, coverage;
- local DB/dump/backup;
- log;
- scratch/archive;
- generated secret/certificate.
