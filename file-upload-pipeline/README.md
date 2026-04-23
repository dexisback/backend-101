# File Upload Pipeline

A production-oriented media ingestion backend built with **Node.js + Express + Prisma + Cloudinary**. The system is designed around a dual-path upload strategy:

- **Small files**: validated and transformed in-memory for low-latency profile media updates.
- **Large files**: uploaded directly to Cloudinary using signed parameters; backend finalizes state only after trusted webhook confirmation.

---

## Problem Statement

Modern upload systems must balance security, performance, and cost:

- Reject spoofed files and malformed payloads early.
- Avoid server memory pressure for large media.
- Keep database state consistent with object storage state.
- Support deterministic asset replacement and cleanup.

This project implements that architecture with explicit separation between **synchronous image processing** and **asynchronous large-media finalization**.

---

## Core Architecture

### Small File Path (Synchronous, RAM Pipeline)

`multipart/form-data` -> Multer memory buffer -> magic-number integrity check -> Sharp optimization -> BlurHash generation -> Cloudinary upload stream -> DB update -> previous Cloudinary asset cleanup

**Use case**: Profile pictures and other small image uploads where immediate response is required.

### Large File Path (Asynchronous, Signed Upload Pipeline)

Client requests signed upload params -> backend creates `PENDING` media row -> client uploads directly to Cloudinary -> Cloudinary sends webhook -> backend verifies webhook signature -> DB transitions to `VERIFIED` or `FAILED`

**Use case**: Video/high-volume payloads where direct-to-cloud upload avoids API server bottlenecks.

---

## Tech Stack

- **Runtime**: Node.js, TypeScript, Express
- **Database**: PostgreSQL via Prisma ORM
- **Media Platform**: Cloudinary (upload, transformation, delivery)
- **Image Processing**: Sharp
- **Perceptual Placeholder**: BlurHash
- **Validation**: Zod

---

## API Surface

### Health

- `GET /health`
- Returns service liveness payload.

### Media (Small File Pipeline)

- `POST /api/media/profile-picture`
- Content type: `multipart/form-data`
- Expected file field: `profile-picture`
- Flow:
  - MIME pre-check in Multer
  - Binary signature validation via magic numbers
  - In-memory optimization to WebP
  - BlurHash generation
  - Cloudinary upload
  - User media metadata update
  - Old Cloudinary asset deletion if present

### Large Media (Direct Upload Pipeline)

- `GET /api/media/signature`
- Creates a `PENDING` DB row and returns signed Cloudinary upload payload:
  - `uploadUrl`
  - `apiKey`
  - `signature`
  - `timestamp`
  - `folder`
  - `context`
  - `mediaId`

- `GET /api/media/status/:mediaId`
- Returns current large-upload state (`PENDING`, `VERIFIED`, `FAILED`) and persisted metadata.

### Webhooks

- `POST /api/webhooks/cloudinary`
- Verifies Cloudinary webhook signature using raw request body + Cloudinary signature headers.
- On trusted event:
  - resolves `mediaId` from context
  - writes `VERIFIED` + asset metadata when upload is successful
  - writes `FAILED` on negative outcome

---

## Folder Structure

```text
.
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── app.ts
│   ├── server.ts
│   ├── config/
│   │   ├── env.ts
│   │   ├── prisma.ts
│   │   ├── cloudinary.ts
│   │   └── redis.ts
│   ├── middleware/
│   │   ├── upload.ts
│   │   ├── validate.ts
│   │   ├── error.ts
│   │   └── rateLimit.ts
│   ├── modules/
│   │   ├── media.controller.ts
│   │   ├── media.routes.ts
│   │   ├── media.schema.ts
│   │   ├── largeFile.controller.ts
│   │   ├── largeFile.rotues.ts
│   │   └── webhooks/
│   │       ├── webhook.controller.ts
│   │       └── webhook.routes.ts
│   ├── services/
│   │   ├── media.service.ts
│   │   └── signature.service.ts
│   ├── utils/
│   │   ├── file.ts
│   │   ├── image.ts
│   │   └── logger.ts
│   └── jobs/
│       └── cron.ts
├── public/
├── package.json
└── tsconfig.json
```

---

## Data Model

### `User`

- Primary profile-media owner
- Stores canonical small-file media metadata:
  - `fileUrl`
  - `publicId`
  - `blurHashString`

### `LargeMedia`

- Tracks async large-upload lifecycle
- Core fields:
  - `status`: `PENDING | VERIFIED | FAILED`
  - `fileUrl`
  - `publicId`
  - `userId`

This separates real-time profile asset updates from asynchronous large-media orchestration.

---

## Production Systems & Advanced Backend Concepts implemented:

### 1) Bifurcated Upload Strategy

A single backend usually fails at scale when all uploads are treated uniformly. This system splits the workload:

- **Small files** -> CPU-bound image pipeline in RAM (fast, deterministic response).
- **Large files** -> network-heavy direct-to-cloud pipeline (no large binary hop through API server).

This pattern reduces ingress pressure, improves tail latency, and keeps app servers stateless under high throughput.

### 2) Trust Boundary Enforcement

- Signed upload parameters prevent unauthorized direct uploads.
- Webhook signature verification ensures only Cloudinary-originated callbacks can mutate DB state.
- Binary magic-number checks defend against extension/MIME spoofing.

### 3) Asset Consistency and Duplicate Control

When replacing small profile media, the previous Cloudinary `public_id` is deleted immediately after successful new upload persistence. This prevents storage drift and stale asset accumulation.

### 4) State Machine Driven Large Uploads

`PENDING -> VERIFIED | FAILED` makes async ingestion explicit, queryable, and observable at the API layer. The frontend can poll by `mediaId` and render upload state deterministically.

### 5) Fallback Behaviour and Failure Handling

Current behavior includes:

- hard rejects on unsupported content or invalid file signatures
- bounded payload limits for request safety
- webhook trust validation before DB mutation
- explicit `FAILED` state for non-success large upload outcomes

Recommended production extensions (drop-in evolution):

- retry policy with exponential backoff for transient Cloudinary/API failures
- idempotency keys on signature issuance and webhook processing
- circuit breaker around third-party media API calls
- dead-letter queue for repeated webhook update failures

### 6) Scalability Hooks

The codebase already keeps extension points for:

- Redis-backed rate limiting middleware
- Scheduled orphan cleanup worker (cron)

These are natural next controls for abuse mitigation and storage hygiene at scale.

---

## Local Setup

### Prerequisites

- Node.js 20+
- PostgreSQL  (Neon)
- Cloudinary account

### Environment

Create `.env`:

```env
DATABASE_URL="postgresql://..."
PORT=3000
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
```

Notes for Neon:

- Ensure `DATABASE_URL` includes `sslmode=require`.
- Remove `channel_binding=require` if your Neon console adds it (Prisma currently cannot connect when it’s present).

### Install & Run

```bash
npm install
npx prisma migrate dev
npx prisma generate
npm run dev
```

---

## Request Flow Snapshot

### Profile Upload

1. `POST /api/media/profile-picture`
2. Multer parses into memory buffer
3. Magic-number validation
4. Sharp optimization + BlurHash generation
5. Cloudinary upload stream
6. DB update + prior asset cleanup
7. Response with latest media metadata

### Large Upload

1. `GET /api/media/signature`
2. DB row created as `PENDING`
3. Client uploads directly to Cloudinary
4. Cloudinary webhook sent to backend
5. Signature verified
6. DB transition to `VERIFIED` or `FAILED`
7. `GET /api/media/status/:mediaId` for client state retrieval

---

## Notes

- The project is intentionally structured for migration from placeholder identity handling to auth middleware (JWT/session) without redesigning media flow contracts.
- The ingestion model prioritizes correctness under asynchronous third-party callbacks while preserving low-latency UX for small-file operations.
