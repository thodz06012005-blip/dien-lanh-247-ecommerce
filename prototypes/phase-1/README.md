# Phase 1 Interactive Prototypes

## Chạy prototype

```bash
python -m http.server 8080 -d prototypes/phase-1
```

- Customer: `http://localhost:8080/customer/`
- Admin: `http://localhost:8080/admin/`

Mỗi prototype là một file HTML tự chứa CSS và JavaScript, không cần cài package hoặc build.

## Customer prototype

Có:

- Landing page responsive.
- Header sticky, mobile menu.
- Service cards, stats, process, projects, reviews và CTA.
- Multi-step booking form.
- Validation, focus management, keyboard Escape và success state.
- IntersectionObserver reveal.
- Counter animation.
- `prefers-reduced-motion`.

## Admin prototype

Có:

- Responsive sidebar.
- Metric cards, chart minh họa, status donut.
- Search và quick filter.
- Request table.
- Request detail drawer.
- Technician assignment.
- Status update, activity log và toast.
- Advanced filter drawer.

## Lưu ý

Đây là prototype Giai đoạn 1, không phải production app. Dữ liệu là mẫu và không được lưu sau khi reload.
