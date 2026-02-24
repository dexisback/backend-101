# Rate Limiter Playground (TypeScript + Express + Redis)

implementation of rate limiting -- 3 endpoints with 3 different algorithms 

- `/api/login-test` -> Sliding Window
- `/api/search-test` -> Token Bucket
- `/api/overall-test` -> Fixed Window


## Modular Architecture:

feature-based  rate limiter module under `src/module/rate-limit/`  wired w an Express app.


The module has 4 main parts:
- `rateLimit.types.ts` -> TypeScript contracts for configs/results
- `rateLimit.algorithm.ts` -> algorithm implementations (fixed/sliding/token bucket)
- `rateLimit.middleware.ts` -> common middleware that chooses algorithm and sets headers
- `rateLimit.routes.ts` -> test endpoints and config per endpoint

---

- `src/app.ts` -> Express app + route mount
- `src/server.ts` -> server startup
- `src/config/env.ts` + `src/db/redis.ts` -> env validation and Redis connection

## Endpoints:

### 1) `/api/login-test` (Sliding Window)

This is the stricter option for login-like endpoints.

- login is security-sensitive.
- makes sense to avoid window boundary bursts (fixed window) for login.
- sliding window checks true recent history (last N seconds), not calendar buckets.

Config:
- `algorithm: "sliding"`
- `limit: 10`
- `window: 30` seconds
- keyed by IP (`req.ip`)

### 2) `/api/search-test` (Token Bucket)



Why I used it:

- sarch traffic is often bursty (user typing / UI interactions).
- token bucket allows controlled bursts while enforcing average rate.


Config:

- `algorithm: "tokenBucket"`
- `limit: 20` (bucket capacity)
- `refill: 5` tokens/sec
- keyed by IP

### 3) `/api/overall-test` (Fixed Window)

- global guardrail/protection.
- good baseline protection for overall traffic.

Config idea in this project:

- `algorithm: "fixed"`
- `limit: 5`
- `window: 10` seconds
- keyed by IP

## How each algorithm is implemented:

## Fixed Window (Redis counter + expiry)

1. Increment Redis counter for key.
2. If first hit, set key expiry to window size.
3. Allow if `current <= limit`.
4. Use TTL to compute reset time.

## Sliding Window (Redis sorted set)

1. Remove old timestamps outside the window.
2. Add current request timestamp to sorted set.
3. Count active entries in the window.
4. Allow if count is within limit.
5. Compute reset time using oldest active timestamp.

## Token Bucket (Redis hash state)

1. Read previous state.
2. Refill tokens based on elapsed time.
3. Cap at capacity (`limit`).
4. Consume 1 token if available.
5. Allow if token existed; else block.
6. Persist updated state and set expiry.

---

## Middleware behavior (common across all endpoints)

`createRateLimiter(...)` in `rateLimit.middleware.ts` does this:

1. Build identity key (`prefix + identity`).
2. Route to selected algorithm.
3. Set standard rate limit headers:
   - `X-RateLimit-Limit`
   - `X-RateLimit-Remaining`
   - `X-RateLimit-Reset`
4. If blocked, return `429` + `Retry-After`.
5. Otherwise call `next()`.



### Folder structure:

```txt
src/
  app.ts
  server.ts
  config/
    env.ts
  db/
    redis.ts
  module/
    rate-limit/
      rateLimit.types.ts
      rateLimit.algorithm.ts
      rateLimit.middleware.ts
      rateLimit.routes.ts
```

## run:

1. Ensure Redis is running. 
2. Add `.env` with:

```env
REDIS_URL=redis://localhost:6379
```

3. Start server:

```bash
npm run dev
```

Server starts on `http://localhost:3000` by default.

## Quick test with curl

```bash
curl -i http://localhost:3000/api/login-test
curl -i http://localhost:3000/api/search-test
curl -i http://localhost:3000/api/overall-test
```

To trigger rate limits quickly:

```bash
for i in {1..15}; do curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/login-test; done
```

