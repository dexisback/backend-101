# Email Notification Service

A production-style learning project for asynchronous email delivery.

This service accepts notification requests, queues them, sends via external providers, and ingests provider webhooks for delivery feedback and suppression handling.

## What It Does

- Exposes an API to enqueue email notifications
- Processes emails asynchronously with BullMQ workers
- Supports provider fallback (Resend primary, SMTP/Nodemailer fallback)
- Handles provider webhooks (delivered, bounced, complained)
- Stores delivery state and suppression decisions in Postgres (Prisma)

##  Highlights:

This project intentionally includes reliability patterns beyond a basic CRUD app:

- `Priority Queueing`: high/normal/low priorities mapped to BullMQ job priorities
- `Idempotency`: client-supplied `idempotency-key` prevents duplicate sends on retries(exp)
- `Provider Fallback`: automatic failover from Resend to SMTP transport using Nodemailer
- `Webhook Ingestion + Reconciliation`: bounce/complaint events update suppression and log status
- `Template Caching`: Redis-backed template cache to reduce disk I/O and compile overhead
- `Per-Tenant Rate Limiting`: Redis counter by `x-tenant-id` to protect service fairness
- `Scheduled Cleanup`: cron-based idempotency-key cleanup

## Tech Stack

- Node.js + TypeScript + Express
- PostgreSQL + Prisma
- Redis + BullMQ
- Resend + Nodemailer
- Zod (validation), Svix (webhook verification), Handlebars (templating)

## High-Level Flow

1. Client calls `POST /api/v1/notifications/notify` with payload, tenant header, optional idempotency key.
2. Request passes through:
   - per-tenant rate limiter
   - idempotency middleware
   - payload validation
3. Service creates `EmailLog` with `QUEUED` status and enqueues BullMQ job with priority.
4. Worker picks job:
   - marks `PROCESSING`
   - renders template (Redis cache -> disk fallback)
   - sends via Resend, then SMTP fallback if needed
   - marks `DELIVERED` on success or `FAILED` on terminal error
5. Webhook endpoint ingests provider events:
   - `email.delivered`: logs delivery event
   - `email.bounced` / `email.complained`: upserts suppression list and marks logs as `BOUNCED`

## API Endpoints

### Health

- `GET /health`
- Returns service heartbeat timestamp.

### Notifications

- `POST /api/v1/notifications/notify`
- Middleware chain: rate limit -> idempotency -> controller

Required headers:
- `x-tenant-id`: tenant identifier for rate limiting

Optional headers:
- `idempotency-key`: replay-safe request key

Example body:

```json
{
  "to": "user@example.com",
  "eventType": "USER_REGISTERED",
  "payload": {
    "name": "Amaan",
    "loginUrl": "https://app.example.com/login"
  },
  "priority": "high"
}
```

Response:
- `202 Accepted` with `logId` when queued
- `400` invalid schema
- `403` suppressed recipient
- `429` tenant rate limit exceeded

### Webhooks

- `POST /api/v1/webhooks/resend`
- Verifies Svix signature headers:
  - `svix-id`
  - `svix-signature`
  - `svix-timestamp`

## Project Structure

```text
src/
├── app.ts
├── server.ts
├── config/
│   ├── env.ts
│   ├── prisma.ts
│   └── redis.ts
├── middlewares/
│   ├── idempotency.ts
│   └── rateLimiter.ts
├── modules/
│   ├── notifications/
│   │   ├── notification.routes.ts
│   │   ├── notification.controller.ts
│   │   └── notification.schema.ts
│   └── webhooks/
│       ├── webhook.routes.ts
│       └── webhook.controller.ts
├── queues/
│   ├── producer.ts
│   └── worker.ts
├── templates/
│   └── template.html
└── utils/
    ├── cron.ts
    ├── emailProvider.ts
    ├── logger.ts
    └── templateEngine.ts

prisma/
└── schema.prisma
```

## Data Model Snapshot

- `EmailLog`: recipient, event type, provider, status lifecycle, error reason, timestamps
- `IdempotencyKey`: key + stored response body/status for replay safety
- `SupressionList`: blocked recipients with reason (`BOUNCE`/`COMPLAINT`)

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure env:

Use `.env.example` as reference and create/update `.env` with:
- `DATABASE_URL`
- `REDIS_URL`
- `RESEND_API_KEY`
- `RESEND_WEBHOOK_SECRET`
- SMTP settings (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`)

3. Run Prisma migration/generation:

```bash
npx prisma migrate dev
npx prisma generate
```

4. Start service:

```bash
npm run dev
```

## Notes

- Webhook verification expects raw request body for signature validation.
- Event-specific templates can be added as `src/templates/<EVENT_TYPE>.hbs`; engine falls back to `template.html` if missing.
- This is a learning project built with real-world reliability patterns and can be extended into a production-grade service.
