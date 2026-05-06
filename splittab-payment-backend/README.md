# SplitTab Payment Backend

Backend system for group-bill splitting with Razorpay order creation, webhook-driven settlement, and real-time status sync.

This project is designed around payment correctness first:
- create a tab with multiple splits
- generate a payment order per split
- confirm payment through secure webhooks
- settle split and tab state in the database
- broadcast live updates to connected clients

## What This Service Does

- Manages group tabs (`Tab`) and participant splits (`Split`)
- Creates Razorpay orders for split payments
- Processes webhook events asynchronously via BullMQ workers
- Persists immutable payment transition history in `AuditLog`
- Runs reconciliation to recover missed webhook events
- Pushes real-time split updates over Socket.IO using Redis Pub/Sub

## System Design Snapshot

- API Layer: `Express + TypeScript`
- Database: `PostgreSQL + Prisma`
- Queue: `BullMQ`
- Cache/Broker: `Redis` (Pub/Sub + queue backend)
- Payments: `Razorpay`
- Realtime: `Socket.IO`

## Project Structure

```text
.
├── prisma/
│   └── schema.prisma
├── public/
│   └── index.html
├── src/
│   ├── app.ts
│   ├── server.ts
│   ├── config/
│   │   ├── env.ts
│   │   ├── prisma.ts
│   │   ├── razorpay.ts
│   │   ├── redis.ts
│   │   └── redis.connection.ts
│   ├── modules/
│   │   ├── tabs/
│   │   │   ├── tab.routes.ts
│   │   │   ├── tab.controller.ts
│   │   │   └── tab.service.ts
│   │   ├── splits/
│   │   │   ├── split.routes.ts
│   │   │   ├── split.controller.ts
│   │   │   └── split.service.ts
│   │   ├── webhooks/
│   │   │   ├── webhook.routes.ts
│   │   │   ├── webhook.controller.ts
│   │   │   └── webhook.service.ts
│   │   └── workers/
│   │       ├── webhook.queue.ts
│   │       ├── webhook.worker.ts
│   │       └── reconciliation.cron.ts
│   └── shared/
│       ├── middlewares/
│       │   ├── ipWhitelist.middleware.ts
│       │   ├── hmacVerify.middleware.ts
│       │   └── errorHandler.middleware.ts
│       ├── utils/
│       │   └── signature.ts
│       └── websockets/
│           └── socket.manager.ts
└── .env.example
```

## Data Model

- `Tab`
  - overall group payment container
  - status transitions from `PENDING` to `SETTLED` when all child splits are paid

- `Split`
  - individual payable item within a tab
  - tracks `razorpayOrderId`, `status`, and `version` (for OCC)

- `AuditLog`
  - append-only ledger of critical state transitions
  - records payment updates and settlement events

## High-Level Flow

1. Client creates a tab with N splits.
2. Client triggers payment for one split.
3. Backend creates/reuses Razorpay order and stores `razorpayOrderId`.
4. Razorpay sends webhook to `/api/webhooks/razorpay`.
5. Webhook request is raw-validated, filtered, and queued.
6. Worker consumes queue job and executes payment state transition transaction.
7. Split is marked `PAID`; audit entry is inserted.
8. If all splits in tab are paid, tab is marked `SETTLED`.
9. Worker publishes Redis event; Socket.IO emits `splitUpdated` to tab room.
10. Reconciliation cron periodically checks stale pending orders and repairs missed webhook cases.

## API Endpoints

### Health & Config

- `GET /health`
  - basic service health

- `GET /api/config/public`
  - returns publishable Razorpay Key ID for frontend Checkout
  - safe to expose; never returns secrets

### Tabs

- `POST /api/tabs/quote`
  - compute equal split amounts server-side (Splitwise-style)
  - returns `splits[]` with deterministic rounding (paise-based)
  - can be fed directly into `POST /api/tabs`
  - **Strategy**: EQUAL (divides evenly, remainder distributed to first N participants)

Sample request:

```json
{
  "totalAmount": 240000,
  "participants": ["Alice", "Bob", "Charlie"]
}
```

Sample response:

```json
{
  "message": "split quote computed",
  "data": {
    "totalAmount": 240000,
    "participantCount": 3,
    "strategy": "EQUAL",
    "splits": [
      { "payeeName": "Alice", "amount": 80000 },
      { "payeeName": "Bob", "amount": 80000 },
      { "payeeName": "Charlie", "amount": 80000 }
    ]
  }
}
```

- `POST /api/tabs`
  - create a tab with splits (typically using splits from `/api/tabs/quote`)
  - validates positive integer amounts and split/total consistency
  - atomically creates tab and linked splits in single transaction

Sample request (using quote response):

```json
{
  "leaderId": "leader-123",
  "totalAmount": 240000,
  "splits": [
    { "payeeName": "Alice", "amount": 120000 },
    { "payeeName": "Bob", "amount": 120000 }
  ]
}
```

### Splits

- `POST /api/splits/:splitId/pay`
  - creates order for a pending split
  - idempotent behavior: returns existing order if already created
  - rejects payment attempt if split is already `PAID`

### Webhooks

- `POST /api/webhooks/razorpay`
  - accepts Razorpay events (`order.paid`, `payment.captured`)
  - protected by:
    - IP whitelist middleware
    - HMAC signature verification middleware
  - enqueues processing job and returns fast ACK

## Real-Time Contract

- Socket.IO event to join room:
  - `joinTab` with `tabId`

- Server event pushed to room:
  - `splitUpdated` payload
    - `tabId`
    - `splitId`
    - `status`
    - `payeeName`

## Reliability & State Integrity Patterns

- Optimistic Concurrency Control (OCC)
  - `Split.version` is checked during update to prevent lost updates in concurrent processing.

- Transaction Timeout Tuning
  - Prisma `transactionOptions` configured with `maxWait: 15_000` and `timeout: 30_000` to handle contention from concurrent cron/worker tasks (especially on serverless Postgres pools).

- Append-Only Audit Trail
  - all critical status transitions are written to `AuditLog`.

- Asynchronous Webhook Processing
  - webhooks are queued and processed by workers, reducing request path latency and failure amplification.

- Retry + Failure Retention
  - queue jobs retry with exponential backoff; failed jobs are retained for inspection/recovery.

- Reconciliation Sweep
  - scheduled cron checks stale pending splits against Razorpay to fix missed webhook cases.

- Idempotent Order Creation
  - split payment endpoint reuses existing `razorpayOrderId` when already present.

- Realtime Event Fanout
  - Redis Pub/Sub decouples payment processing from socket delivery, enabling multi-instance friendly event propagation.

## Security Controls

- Raw request body webhook handling (required for signature verification)
- HMAC SHA-256 signature verification for Razorpay webhook authenticity
- Source IP whitelist middleware for webhook ingress hardening
- Strict env validation for startup fail-fast

## Environment Variables

Use `.env.example` as template.

- `DATABASE_URL`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`
- `RAZORPAY_WEBHOOK_IPS` (comma-separated)
- `REDIS_URL` or `REDIS_HOST` + `REDIS_PORT`
- `PORT`

## Local Run

```bash
npm install
npx prisma generate
npm run dev
```

## Frontend Client

A Splitwise-style demo client is available at `public/index.html`:
- Enter leader, total amount (₹), and participant names
- Click **Quote Equal Split** to compute split amounts server-side
- Click **Create Tab** to create the tab and show splits
- Click **Pay** to initiate Razorpay Checkout
- Live WebSocket logs show split updates as webhooks arrive
- Razorpay Key ID is fetched from `/api/config/public` at runtime (never hard-coded)

## Notes

- Amounts are handled in minor currency units (paise).
- Razorpay receipt IDs are deterministically hashed from split IDs to stay ≤ 40 characters.
