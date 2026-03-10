# Flash Sale Backend (Observability Practice Project)

A practice backend that simulates flash-sale traffic and focuses on **observability under load** rather than complex business logic. The core learning goal is to instrument a Node.js API with structured logs and Prometheus metrics, then analyze system behavior in Grafana while driving traffic with k6.

## Why This Project Exists

This repo was built to practice:

- generating realistic load spikes with k6
- instrumenting application metrics with Prometheus (`prom-client`)
- reading latency and failure signals in Grafana
- combining request logs + domain logs for debugging under stress

It intentionally keeps ticket allocation simple (in-memory counter) so observability signals are easier to study.

## Architecture Flow

```text
k6 load script
   -> Express API (/buy, /ticket, /health)
      -> Structured logs (Pino + pino-http)
      -> Prometheus metrics (/metrics)
         -> Prometheus scrape
            -> Grafana dashboards
```

## Tech Stack

- Runtime: Node.js, Express 5, TypeScript
- Logging: Pino, pino-http, pino-pretty
- Metrics: Prometheus, prom-client
- Load testing: k6
- Monitoring: Prometheus + Grafana

## Quick Start

### 1) Install dependencies

```bash
npm install
```

### 2) Run the API

```bash
npm run dev
```

API base URL: `http://localhost:3000`

### 3) Verify service quickly

```bash
curl http://localhost:3000/health
curl http://localhost:3000/ticket
curl http://localhost:3000/metrics
```

### 4) Run Prometheus

This repo includes [`prometheus.yml`](/home/amaan/my_stuff/backend-101/logging-metrics/prometheus.yml).

Important:

- current target is `172.17.0.1:3000` (useful when Prometheus runs in Docker and API runs on host)
- if Prometheus runs directly on your machine, switch target to `localhost:3000`

Start Prometheus (example):

```bash
prometheus --config.file=prometheus.yml
```

Prometheus UI: `http://localhost:9090`

### 5) Connect Grafana

- start Grafana
- add Prometheus datasource: `http://localhost:9090`
- build panels using queries listed below

### 6) Run load test

Default staged scenario:

```bash
k6 run flash-sale.js
```

Short reproducible benchmark run:

```bash
k6 run --vus 100 --duration 15s flash-sale.js
```

## API Surface (Current)

| Method | Path | Purpose | Typical Responses |
|---|---|---|---|
| `GET` | `/health` | Liveness check | `200 {"status":"ok"}` |
| `GET` | `/ticket` | Remaining inventory | `200 {"remaining": <number>}` |
| `POST` | `/buy` | Attempt purchase | `200 {"status":"success","ticketId":"ticket_x"}` or `400` on sold out / missing user |
| `GET` | `/metrics` | Prometheus exposition | `200` text metrics |

`POST /buy` expects header `x-user-id`.

## Metrics Catalog (Exact Names)

| Metric | Type | Labels | Meaning |
|---|---|---|---|
| `buy_requests_total` | Counter | `status` | Total buy attempts by outcome (`success` / `failed`) |
| `purchase_requests_total` | Counter | `reason` | Failure reasons (currently used for failures such as `sold_out`, `missing_user`) |
| `tickets_remaining` | Gauge | none | Current in-memory ticket count |
| `buy_request_duration_ms` | Histogram | `status` | Buy request latency distribution |

## Prometheus + Grafana Usage

Use these PromQL queries as starter panels:

```promql
# Buy request rate by status
sum by (status) (rate(buy_requests_total[1m]))

# Failure reason rate
sum by (reason) (rate(purchase_requests_total[1m]))

# Remaining inventory
tickets_remaining

# p95 latency for /buy (milliseconds)
histogram_quantile(0.95, sum(rate(buy_request_duration_ms_bucket[1m])) by (le))
```

Recommended dashboard panels:

- inventory depletion (`tickets_remaining`)
- buy throughput by status
- failure reasons over time
- latency trend (p50/p95/p99)

## Load Testing Workflow + Sample Benchmark

### Scenario file

[`flash-sale.js`](/home/amaan/my_stuff/backend-101/logging-metrics/flash-sale.js) simulates a flash-sale profile with staged traffic and random `x-user-id` values.

### Sample run (reproducible command)

Command used:

```bash
k6 run --vus 100 --duration 15s flash-sale.js
```

Sample result snapshot from this repo run:

```text
checks_total:      14562
checks_succeeded:  100.00%
http_reqs:         14562 (~964 req/s)
http_req_duration: avg=2.88ms, p95=11.35ms
```

## Benchmark Interpretation Notes

- `http_req_failed` can show very high values in this scenario because k6 treats HTTP `4xx/5xx` as failed by default.
- In this project, many `400` responses are expected after sell-out; that is business behavior, not necessarily system breakage.
- The check in `flash-sale.js` explicitly accepts both `200` and `400`, so `checks_succeeded` is the more relevant correctness signal for this simulation.

## Project Structure

```text
.
├── src/
│   ├── app.ts
│   ├── lib/
│   │   └── logger.ts
│   ├── metrics/
│   │   └── metrics.ts
│   └── middleware/
│       ├── requestLogger.middleware.ts
│       └── globalErrorHandler.middleware.ts
├── flash-sale.js
├── prometheus.yml
├── package.json
└── tsconfig.json
```

## Known Limitations (Learning Scope)

- inventory is in-memory (`remainingTickets`), so data resets on restart
- no database transactions or distributed locking
- no queueing/rate-limiting/waiting-room control plane
- no auth beyond presence of `x-user-id`
- no committed Grafana dashboard JSON in the repo
- metric name `purchase_requests_total` is semantically broad but currently used for failure reasons

This is intentional: the repo is a **practice implementation** to learn load + observability workflows quickly.

## Next Improvements

- move inventory to persistent storage with atomic updates
- add Redis or DB-backed concurrency controls
- add dashboard JSON provisioning for reproducible Grafana setup
- track endpoint-specific latency and saturation metrics
- add automated tests and CI checks for load/metrics behavior

## License

ISC
