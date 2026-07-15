# Phase 12 — Communications and Integrations

## Stacked dependency

- Technical base used for this branch: `agent/phase-10-operations-dispatch` at `5ad409822d83e659d19bec8ed406846422fe0120`.
- Phase 11 does not yet exist on GitHub. This PR must remain Draft.
- When Phase 11 is created, Phase 12 must be rebased or retargeted onto the accepted Phase 11 head, conflicts resolved additively, and every Phase 1–12 regression rerun.

## Implemented foundation

- Durable `NotificationOutbox` with unique idempotency keys.
- `AdminNotification` feed with database-level deduplication.
- `IntegrationDeliveryLog` for every delivery attempt.
- Worker with claim, exponential retry, terminal dead state and provider timeout.
- HTML/text email templates with escaped dynamic values.
- Email, admin, optional SMS and optional Zalo OA channels.
- Protected admin notification APIs.
- Modern responsive notification center at `/#/notifications`.
- Provider failures are processed outside the primary transaction.

## Environment configuration

```env
# Notification worker
NOTIFICATION_WORKER_ENABLED=true
NOTIFICATION_POLL_INTERVAL_MS=15000
INTEGRATION_TIMEOUT_MS=8000

# SMTP / email
MAIL_HOST=
MAIL_PORT=587
MAIL_USER=
MAIL_PASSWORD=
MAIL_FROM="Điện Lạnh 247 <no-reply@example.com>"

# SMS — optional
SMS_PROVIDER_URL=
SMS_PROVIDER_TOKEN=

# Zalo OA — optional
ZALO_OA_PROVIDER_URL=
ZALO_OA_ACCESS_TOKEN=

# Google Maps — public frontend key must be domain-restricted
VITE_GOOGLE_MAPS_API_KEY=
GOOGLE_MAPS_SERVER_API_KEY=

# reCAPTCHA
VITE_RECAPTCHA_SITE_KEY=
RECAPTCHA_SECRET_KEY=
RECAPTCHA_MIN_SCORE=0.5

# Analytics — optional, consent-controlled
VITE_GA_MEASUREMENT_ID=
VITE_FACEBOOK_PIXEL_ID=
VITE_SEARCH_CONSOLE_VERIFICATION=
```

No real secret is committed. Production keys must be stored in the deployment secret manager. Google Maps browser keys must be restricted by HTTP referrer and API. Server keys must be restricted by server IP and API.

## Event/idempotency convention

Use a deterministic key for each business event and channel:

```text
service-request:{requestId}:created:email
service-request:{requestId}:status:{statusVersion}:email
service-request:{requestId}:appointment:{appointmentVersion}:sms
service-request:{requestId}:sla:{slaDeadline}:admin
```

Calling `enqueue` repeatedly with the same key is safe; the unique index prevents duplicate delivery records.

## Failure isolation

The business transaction commits the request/order/status first and enqueues an outbox record. Delivery occurs asynchronously. SMTP, Zalo, SMS or analytics outages therefore do not roll back the business operation. Retry intervals use exponential backoff and end in `DEAD` after `maxAttempts`.

## Required completion before acceptance

- Wire service-request create/status/appointment/completion events to `NotificationsService.enqueue` after transaction commit.
- Add SLA scanner producing deduplicated admin notifications.
- Add Google Maps address autocomplete/geocoding and service-area validation.
- Add server-side reCAPTCHA verification to public forms with local/test bypass only outside production.
- Add consent-aware Google Analytics and Facebook Pixel loaders.
- Add Search Console verification metadata.
- Add SMS/Zalo provider-specific request/response adapters and sandbox integration tests.
- Add sidebar/header unread badge.
- Add MySQL integration tests for duplicate keys, retry, dead-letter and transaction isolation.
- Run all Phase 1–12 quality, integration and Lighthouse gates on the final Phase 11 base.

## Acceptance status

The current branch is an implementation foundation and is intentionally kept Draft. It must not be presented as accepted or merged until the required completion list and CI gates are fully satisfied.
