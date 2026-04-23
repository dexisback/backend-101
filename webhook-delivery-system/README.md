# Webhook Delivery System (learning-focused)

A small but real webhook delivery pipeline built with:
- Fastify (HTTP API)
- Prisma + Postgres (Neon)
- BullMQ + Redis (queues + workers)

This repo is intentionally scoped as a **sender-side webhook delivery system**:
- We accept events via an internal learning endpoint (`POST /emit`)
- We deliver those events to subscriber URLs via HTTP POST
- We log delivery attempts (`Deliverylog`) for observability
- We do **not** build a subscriber/receiver server here


## Learning from this build:

This project was built to practice production-ish async systems concepts:
- **Producer/consumer pipeline** using BullMQ
- **Vertical scaling** via worker concurrency
- **Horizontal scaling** via multiple worker processes
- **Queue lanes** (default vs critical)
- **Backpressure** (ingress backlog guard + worker rate limiting)
- **DLQ** (dead-letter queue for exhausted retries)


## High-level architecture

Text diagram:

```
Client
  |
  |  POST /subscriptions (register interest)
  v
Fastify API  ---> Postgres (Prisma)
  |
  |  POST /emit (learning-only event ingress)
  v
Event producer (match subscriptions + enqueue jobs)
  |
  +--> webhook-default-queue   ---> default workers (rate-limited + concurrent)
  |
  +--> webhook-critical-queue  ---> critical workers (rate-limited + concurrent)
  |
  +--> webhook-dlq-queue       ---> (no worker required) store dead letters
  |
  v
Delivery service (HTTP POST + HMAC)
  |
  v
Deliverylog table (SUCCESS / FAILED)
```


## Data model (Prisma)

Core models (see `prisma/schema.prisma`):
- `Subscription`: `{ id, url, event, secret, createdAt }`
- `Event`: `{ id, type, payload, createdAt }`
- `Deliverylog`: `{ id, eventId, subscriptionId, attempt, status, responseStatus, createdAt }`

NOTE: we store delivery history (audit trail). This is the “source of truth” for what was attempted.


## Project flow (end-to-end)

### 1) Create subscription

`POST /subscriptions` registers a subscriber URL for a specific event name.

Request (Zod validated):
```json
{
  "url": "https://example.com/webhook",
  "event": "order.created",
  "secret": "atleast-10-chars"
}
```

Response:
```json
{ "id": "...", "event": "order.created" }
```

### 2) Emit event (learning-only ingress)

`POST /emit` is intentionally present for learning/testing. In a real product, events would come from your own internal domain events.

Request:
```json
{
  "type": "order.created",
  "payload": { "orderId": "o_123" }
}
```

Response (202 Accepted):
```json
{
  "event": { "id": "...", "type": "order.created", "payload": {"orderId":"o_123"}, "createdAt": "..." },
  "replayedTo": 5
}
```

### 3) Producer matches subscriptions and enqueues jobs

In `src/modules/event/event.service.ts`, the producer:
1) stores the event
2) finds matching subscriptions (`Subscription.event === Event.type`)
3) routes to a lane queue (default vs critical)
4) enqueues one job per subscription with retry/backoff options


## Queue lanes (default vs critical)

We run two separate queues:
- `webhook-default-queue`
- `webhook-critical-queue`

Lane selection is **server-side policy**, based on the event type:
- `payment.*` => critical
- everything else => default

This prevents default traffic spikes from starving critical deliveries.


## Backpressure (two layers)

### 1) Ingress backlog guard (producer-side)

Before enqueuing, we check queue depth using `getJobCounts(waiting, active, delayed)` and compute a “backlog”.

If backlog exceeds lane thresholds, we reject the request by throwing. Thresholds are configured via:
- `DEFAULT_MAX_BACKLOG`
- `CRITICAL_MAX_BACKLOG`

This prevents infinite queue growth when workers can’t keep up.

### 2) Worker-side rate limiting

Each worker is rate limited using BullMQ `Worker` option `limiter`:
- default lane uses `DEFAULT_LANE_RPS`
- critical lane uses `CRITICAL_LANE_RPS`

This caps delivery throughput per lane and protects downstream subscriber endpoints.


## DLQ (Dead Letter Queue)

When a job fails and has exhausted its attempts (`attempts: 3`), the worker pushes a summary of the failure into a DLQ queue:
- `webhook-dlq-queue`

DLQ job data includes:
- original lane (default/critical)
- job id, attempts made, max attempts
- eventId, subscriptionId, payload
- timestamp + error message

NOTE: We do not run a consumer for the DLQ by default. The DLQ is just a storage for manual inspection/replay/dashboards.


## Delivery: what the worker actually does

The delivery logic (`src/modules/delivery/webhookDelivery.service.ts`):
- Fetches `Event` and `Subscription` from DB using IDs
- Computes HMAC signature using the stored subscription secret
- Sends HTTP POST to the subscriber URL
- Writes a `Deliverylog` row with status and response code

Headers sent:
- `Content-Type: application/json`
- `X-Event-Id: <event id>`
- `X-Signature: <hmac>`


## Environment variables

Required:
- `DATABASE_URL` (Neon/Postgres connection string)
- `REDIS_URL` (BullMQ Redis)

Optional tuning knobs:
- `WORKER_NAME` (for logs)
- `WORKER_CONCURRENCY` (vertical scaling)
- `DEFAULT_LANE_RPS`, `CRITICAL_LANE_RPS` (worker limiter)
- `DEFAULT_MAX_BACKLOG`, `CRITICAL_MAX_BACKLOG` (ingress backpressure)
- `DLQ_REMOVE_ON_COMPLETE_COUNT` (DLQ retention)


## Running locally

### 1) Start Redis

If you have Docker:
```bash
docker run -p 6379:6379 redis:7
```

### 2) Start API
```bash
npm run dev
```

### 3) Start workers (separate terminals)

Default lane:
```bash
WORKER_NAME=default-1 WORKER_CONCURRENCY=5 npx tsx src/workers/webhookDefault.worker.ts
```

Critical lane:
```bash
WORKER_NAME=critical-1 WORKER_CONCURRENCY=5 npx tsx src/workers/webhookCritical.worker.ts
```

Horizontal scaling example (run more processes):
```bash
WORKER_NAME=critical-2 WORKER_CONCURRENCY=5 npx tsx src/workers/webhookCritical.worker.ts
WORKER_NAME=critical-3 WORKER_CONCURRENCY=5 npx tsx src/workers/webhookCritical.worker.ts
```


## Intentional limitations / non-goals

These are purposely not implemented (yet):
- No auth on `/emit` or `/subscriptions`
- No subscriber management (pause/disable, per-subscriber rate limiting)
- No idempotency/dedup guarantees (possible duplicates under retries)
- No ordering guarantees per subscription/customer
- No DLQ replay endpoint/UI
- No receiver side / signature verification demo server

This repo is about **delivery mechanics + scaling concepts**, not a full webhook "product".


## Folder structure

```
src/
  app.ts                     # Fastify app + route registration
  server.ts                  # app.listen()
  config/env.ts              # env parsing + tuning knobs
  db/prisma.ts               # Prisma client
  modules/
    subscription/            # subscription API + DB logic
    event/                   # /emit + producer (match + enqueue)
    delivery/                # delivery logic (HMAC + HTTP + deliverylog)
  queues/webhook.queue.ts    # queue definitions (default/critical/DLQ)
  workers/                   # BullMQ worker entrypoints
  utlis/                     # helper utilities (HMAC)
prisma/                      # schema + migrations
```


---

## OG Notes 

> flow: 
	- a company/app's backend gives our system a url/an event type
	- the company/app's backend is basically now a subscriber 
	- something happens in our webhook delivery system backend (event)
	- we check : which subscriber wanted this event
	- if matches, then send them the data


> real world example/analogy:
	- youtube notifications:
		- you subscribe to a channel, you choose all videos/specific notifications
		- now when a youtube video is uploaded (event), youtube (our backend) checks which users (subscribers) needed the notification of this video(event-subscriber match), and send to only them



> who is a subscriber?
	- someone who wants to be notified when something happens, via webhooks 



> each folder/file function, explained:
1. modules/subscription/
	- create + store subscription
	- db related only

2. modules/event/
	- receive events
	- stores events
	- find matching subscriptions
	- (and then) enqueue jobs

3. modules/delivery/
	- takes event and subscription
	- generates HMAC > sends HTTP request > return result

4. queues/
	- defines BULLMQ queue
	- used by event.service(producer)

5. workers/
	- pulls jobs from queue
	- calls delivery.service
	- handlers retry automatically 

6. utils/
	- helpers



---
> Flow mapped from files:
POST /subscriptions
-> subscription.routes
-> subscription.service
-> DB

POST /emit
-> event.routes
-> event.service (stores event, finds matching subscriptions, enqueue)
	
QUEUE:
->delivery.worker
	->delivery.service
		->sends webhook (HTTP)
		->generate HMAC
		->log results

---
Two external requests exposed
1. Subscriptions: posts -> notify me when xyz event happens
2. Events: posts -> xyz just happened
Then we:
	Match > create a webhook > send back the notification to subscriber


> NOTE: replay functionality:
	- if eventId given, it fetches the event > find subscriptions for that event.type> enqueue jobs again for it , basically re-run the pipeline again
	


> phase 1: vertical scaling in worker files (concurrency =5 set)
> phase 2: horizontal scaling (batch (webhook-critical-worker and critical-queue) and webhook-default-worker  for default-queue). critical events alag se type given rahenge 

NOTE: we define type selection of queues(default vs prioriry ) based on the CONTENT of our requests NOT that the request has the type in itself. not a good practice to allow requests to decide the type rather have it server side