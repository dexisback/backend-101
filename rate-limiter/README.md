# Rate Limiter:

A backend that implements three distinct rate-limiting algorithms from scratch on top of Redis


## Why This Project Exists

built to practice:

- implementing rate-limiting algorithms directly using Redis primitives (`INCR`, `EXPIRE`, `ZADD`, `ZCARD`, `HSET`, `HGETALL`)
- understanding the failure modes and burst-handling characteristics of each algorithm
- designing a generic, composable middleware factory (`createRateLimiter`) that accepts any algorithm config
- setting standard rate-limit response headers (`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `Retry-After`)

Each algorithm is demonstrated against a different endpoint pattern to highlight where each one fits.


## Algorithms explained:

### Fixed Window

```
INCR rate_limit:prefix:identity
if count == 1: EXPIRE key window
if count > limit: 429
```

A counter increments per request within a fixed time window. Simple and cheap. Weakness: burst traffic at window boundaries (e.g. 100 requests at the end of one window + 100 at the start of the next — effectively 200 in a short span).

### Sliding Window

```
ZREMRANGEBYSCORE key 0 (now - windowMs)
ZADD key now <unique_member>
ZCARD key  ->  count
if count > limit: 429
```

Each request is stored as a scored set member (score = timestamp). Stale entries outside the window are pruned on every request. The result is a true rolling window with no boundary burst problem. Uses more memory than fixed window — each request is a set entry.

### Token Bucket

```
state = HGETALL key (tokens, lastRefill)
elapsed = (now - lastRefill) / 1000
newTokens = min(capacity, prevTokens + elapsed * refillRate)
if newTokens >= 1: allow, consume 1 token
HSET key { tokens: updated, lastRefill: now }
EXPIRE key (capacity / refill) * 2
```

Models tokens refilling at a constant rate up to a capacity ceiling. Allows bursts (up to capacity) while smoothing sustained traffic to the refill rate. State is stored in a Redis hash; no expiry management needed beyond the cleanup TTL.

## Architecture Flow

```text
HTTP Request
   -> createRateLimiter(config) middleware
      -> keyGenerator(req)  ->  identity (e.g. req.ip)
         -> Redis algorithm execution
            -> RateLimitResult { allowed, remaining, resetAt }
               -> Set response headers
                  -> 429 or next()
```

## Tech Stack

- Runtime: Node.js, Express 5, TypeScript
- Store: Redis (node `redis` v5)
- ORM: Prisma v7 (with Neon adapter — present for future persistence needs)
- Validation: Zod v4
- Dev: `tsx`

## Quick Start

### 1) Configure environment

```
DATABASE_URL=your_postgres_connection_string
REDIS_URL=redis://localhost:6379
```

### 2) Install and run

```bash
npm install
npm run dev
```

API base URL: `http://localhost:3000`

## API Surface

| Method | Path | Algorithm | Config |
|---|---|---|---|
| `GET` | `/overall-test` | Fixed Window | 5 req / 10s per IP |
| `GET` | `/login-test` | Sliding Window | 10 req / 30s per IP |
| `GET` | `/search-test` | Token Bucket | capacity 20, refill 5 tokens/s per IP |

Each route uses a different algorithm to reflect realistic use-case intent: a global fixed cap, a strict credential-endpoint rolling guard, and a burst-tolerant search throttle.

## Response Headers

Every response (allowed or rejected) includes:

| Header | Meaning |
|---|---|
| `X-RateLimit-Limit` | Max requests allowed in the window |
| `X-RateLimit-Remaining` | Requests left before hitting the limit |
| `X-RateLimit-Reset` | Unix timestamp (seconds) when the limit resets |
| `Retry-After` | Seconds until the client may retry (429 responses only) |

### 429 Response Body

```json
{
  "success": false,
  "message": "Too many requests"
}
```

## Middleware Factory

`createRateLimiter(config)` returns a standard Express middleware. Config shape by algorithm:

```typescript
// Fixed Window
{ algorithm: "fixed", limit: number, window: number, prefix?: string, keyGenerator: (req) => string }

// Sliding Window
{ algorithm: "sliding", limit: number, window: number, prefix?: string, keyGenerator: (req) => string }

// Token Bucket
{ algorithm: "tokenBucket", limit: number, refill: number, prefix?: string, keyGenerator: (req) => string }
```

`keyGenerator` controls what constitutes an "identity" — `req.ip` for IP-based limiting, `req.headers['x-user-id']` for user-based, etc. `prefix` namespaces the Redis key so multiple limiters don't interfere.

Redis key format: `rate_limit:<prefix>:<identity>`

## Algorithm Tradeoff Summary

| | Fixed Window | Sliding Window | Token Bucket |
|---|---|---|---|
| Redis structure | String (counter) | Sorted Set | Hash |
| Memory per user | O(1) | O(requests in window) | O(1) |
| Burst handling | Boundary burst possible | Smooth, no boundary burst | Burst up to capacity |
| Precision | Low (window-aligned) | High (true rolling) | High (time-proportional) |
| Best for | Broad global caps | Login / sensitive endpoints | Search, API tier limits |

## Project Structure

```text
.
├── src/
│   ├── app.ts
│   ├── server.ts
│   ├── config/
│   ├── db/
│   └── module/
│       └── rate-limit/
│           ├── rateLimit.algorithm.ts
│           ├── rateLimit.middleware.ts
│           ├── rateLimit.routes.ts
│           ├── rateLimit.types.ts
│           └── rateLimit.constants.ts
├── prisma/
│   └── schema.prisma
├── prisma.config.ts
├── package.json
└── tsconfig.json
```

---

NOTE: Intentional gaps; the focus here was understanding the mechanics of each rate-limiting algorithm, NOT a production-grade throttling system.

## License

ISC