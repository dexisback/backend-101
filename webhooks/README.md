# Webhooks Platform: Reliable Event Ingestion + Async CI Orchestration

## Problem Statement

Modern backend systems receive high-volume, bursty webhooks from external providers.  
If webhook processing is done synchronously, systems become brittle: duplicate deliveries, retry storms, and downstream failures can cause dropped events or inconsistent state.

This project demonstrates a production-style webhook architecture:

- durable ingestion API
- idempotent event persistence
- asynchronous queue-based processing
- isolated worker execution
- explicit state transitions in the database

It is intentionally split into two services to model real distributed backend design.

## Repository Structure

This repo contains two backend services:

- `event-ingestion-service`
- `ci-worker-service`

### `event-ingestion-service`

Responsibilities:

- accepts incoming webhook requests
- validates payload structure
- persists event records
- enforces DB-level idempotency (`eventId` unique)
- publishes normalized jobs to Redis/BullMQ

### `ci-worker-service`

Responsibilities:

- consumes queue jobs from Redis/BullMQ
- validates event contract before execution
- creates build records and updates lifecycle status
- runs CI pipeline simulation
- writes incremental logs and terminal status

## Architecture

1. Provider sends webhook to ingestion API.
2. Ingestion service parses and validates payload.
3. Event is persisted to Postgres (`Event` table).
4. Duplicate event IDs are ignored safely (idempotency).
5. Event is pushed to BullMQ queue.
6. CI worker consumes event asynchronously.
7. Worker creates/updates `Build` state (`PENDING/RUNNING/SUCCESS/FAILED`).
8. Pipeline logs are persisted as structured JSON.

This keeps the HTTP path fast and failure-isolated from long-running work.

## Core Backend Concepts Implemented

- **Idempotency by database constraint**: duplicate webhook deliveries are harmless.
- **Queue decoupling**: request handling and heavy processing are separated.
- **Retry with exponential backoff**: transient worker failures are retried.
- **Durable state machine**: event/build statuses are persisted, not inferred from logs.
- **Schema-driven contract validation**: both producer and consumer validate payload shape.
- **Provider-agnostic ingress**: dynamic provider path with normalized internal event format.
- **Fail-fast startup checks**: services verify DB/Redis connectivity before running.
- **Service boundary clarity**: one producer service, one queue consumer service.

## Data Model

### Ingestion DB (`event-ingestion-service`)

- `Event`
  - `eventId` (unique)
  - `provider`
  - `type`
  - `payload` (JSON)
  - `status` (`PENDING | PROCESSED | FAILED`)
- `Alert`
  - linked to `Event.eventId`
  - stores fraud/risk reasons

### Worker DB (`ci-worker-service`)

- `Build`
  - `commitId` (unique)
  - `repoName`, `branch`, `author`
  - `status` (`PENDING | RUNNING | SUCCESS | FAILED`)
  - `logs` (JSON)

## API Endpoints

### `GET /`

Health-style check for ingestion service.

- Response: `200 OK`
- Body: `"ok running "`

### `POST /webhook/:provider`

Receives raw webhook payload (`Content-Type: application/json`) for any provider namespace.

Request behavior:

- body is accepted as raw bytes (required for signature-based workflows)
- payload is parsed and validated
- event is normalized into internal contract
- event persisted and enqueued

Supported internal event contract (current worker path):

```json
{
  "type": "github.push",
  "eventId": "string",
  "payload": {
    "repo": "string",
    "commitId": "string",
    "branch": "string",
    "author": "string"
  }
}
```

Response codes:

- `200` webhook accepted and queued
- `200` duplicate event ignored (idempotent path)
- `400` missing provider / invalid payload / missing event type or event ID
- `500` unexpected server error

Notes:

- header `x-razorpay-signature` and `WEBHOOK_SECRET` are wired in controller for signature flow.
- strict signature rejection is easy to enable in the same path when needed.

## Local Setup

## 1) Environment

Create `.env` from `.env.example` in both services:

- `event-ingestion-service/.env`
- `ci-worker-service/.env`

Required keys:

- `DATABASE_URL`
- `WEBHOOK_SECRET` (ingestion)
- `REDIS_HOST`
- `REDIS_PORT`
- `QUEUE_NAME`

## 2) Install

```bash
cd event-ingestion-service && npm install
cd ../ci-worker-service && npm install
```

## 3) Prisma

```bash
cd event-ingestion-service
npx prisma migrate dev
npx prisma generate

cd ../ci-worker-service
npx prisma migrate dev
npx prisma generate
```

## 4) Start Redis

Redis must be reachable at `REDIS_HOST:REDIS_PORT`.

## 5) Run Services

Terminal 1:

```bash
cd event-ingestion-service
npm run dev
```

Terminal 2:

```bash
cd ci-worker-service
npm run dev
```

## Test Request

```bash
curl -X POST "http://localhost:3000/webhook/github" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "github.push",
    "eventId": "commit-123",
    "payload": {
      "repo": "webhooks-platform",
      "commitId": "commit-123",
      "branch": "main",
      "author": "amaan"
    }
  }'
```

## Why This Project Matters (Portfolio Signal)

This is not a single-process demo API. It demonstrates real backend engineering concerns:

- designing for retries and duplicates from day one
- choosing durability boundaries (DB + queue) over in-memory assumptions
- modeling explicit process state transitions
- separating ingress reliability from execution latency
- building services that are observable and operationally predictable
