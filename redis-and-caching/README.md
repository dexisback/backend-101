# Redis-Caching 

A backend that demonstrates the cache-aside pattern on top of a PostgreSQL-backed developer leaderboard. Built to understand how Redis sits in front of a relational database as a read-through cache — reducing query load on hot data while handling cache invalidation explicitly on every write.

## Why This Project Exists

built to practice:

- implementing the cache-aside pattern: check Redis first, fall through to Postgres on a miss, populate cache on the way back
- understanding TTL-based expiry vs explicit cache invalidation and when each is appropriate
- structuring a `cache.ts` utility with generic `getCache<T>`, `setCache`, and `deleteCache` helpers
- designing a leaderboard where stale reads are acceptable (60s TTL) but writes always invalidate

The domain is a scored developer leaderboard. CRUD is simple so the caching layer stays center-stage.

## How the Cache-Aside Pattern Works Here:

```text
GET /leaderboard?limit=10
  -> QuerySchema validates and narrows limit to {10, 50, 100}
     -> cacheKey = "leaderboard:top:10"
        -> redis.get(cacheKey)
           -> HIT:  return cached JSON  (no DB query)
           -> MISS: prisma.developer.findMany(...)
                    -> redis.set(cacheKey, data, { EX: 60 })
                    -> return data

POST / PATCH / DELETE /leaderboard
  -> write to Postgres
     -> invalidate all three cache keys (top:10, top:50, top:100)
```

Reads are eventually consistent (up to 60s stale). Writes are immediately consistent — the cache is invalidated synchronously before returning the response.

## Architecture Flow

```text
HTTP Request
   -> Zod schema validation
      -> Controller
         -> Service (cache-aside logic)
            -> cache.ts (getCache / setCache / deleteCache)
            -> Repository (Prisma queries, only on cache miss or write)
               -> PostgreSQL (Neon, via @prisma/adapter-neon)
               -> Redis (via node redis v5)
```

## Tech Stack

- Runtime: Node.js, Express 5, TypeScript
- Cache: Redis (node `redis` v5)
- ORM: Prisma v7 with Neon serverless adapter
- Database: PostgreSQL (Neon)
- Validation: Zod v4
- Dev: `tsx`

## Data Model

```
Developer
  id          String    (cuid)
  username    String    (unique)
  score       Int
  createdAt   DateTime

@@index([score(sort: Desc)])
```

`score` has a descending index so the `ORDER BY score DESC` on leaderboard queries uses an index scan rather than a full sort.

## Cache Key Design

| Key | Cached Data | TTL |
|---|---|---|
| `leaderboard:top:10` | Top 10 developers by score | 60s |
| `leaderboard:top:50` | Top 50 developers by score | 60s |
| `leaderboard:top:100` | Top 100 developers by score | 60s |

Limit is constrained to the set `{10, 50, 100}` via Zod `refine` — this makes the cache key space finite and predictable, preventing cache pollution from arbitrary `limit` values.

## Quick Start

### 1) Configure environment

```
DATABASE_URL=your_postgres_connection_string
REDIS_URL=redis://localhost:6379
```

### 2) Install and run

```bash
npm install
npx prisma generate
npx prisma db push
npm run dev
```

API base URL: `http://localhost:3000`

## API Surface

| Method | Path | Cache Behavior | Purpose |
|---|---|---|---|
| `GET` | `/leaderboard` | Read-through (60s TTL) | Fetch top N developers by score |
| `POST` | `/leaderboard` | Write + invalidate | Create a new leaderboard entry |
| `PATCH` | `/leaderboard/:id` | Write + invalidate | Update a developer's score |
| `DELETE` | `/leaderboard/:id` | Write + invalidate | Remove a developer from the leaderboard |

## Request / Response Shapes

### `GET /leaderboard?limit=10`

`limit` must be exactly `10`, `50`, or `100`. Defaults to `10`.

```json
{
  "success": true,
  "data": [
    { "id": "...", "username": "amaan", "score": 9500, "createdAt": "..." },
    ...
  ]
}
```

### `POST /leaderboard`

```json
// Request body
{ "username": "amaan", "score": 9500 }

// 201 Response
{ "success": true, "data": { "id": "...", "username": "amaan", "score": 9500, "createdAt": "..." } }
```

### `PATCH /leaderboard/:id`

```json
// Request body
{ "score": 10200 }

// 200 Response
{ "success": true, "data": { ... } }
```

On every write, `invalidateLeaderboardCache()` deletes all three cache keys (`top:10`, `top:50`, `top:100`) so the next read re-fetches from Postgres.

## Validation Layer

| Schema | Fields |
|---|---|
| `QuerySchema` | `limit` (coerced number, must be in {10, 50, 100}, default 10) |
| `CreateSchema` | `username` (min 1), `score` (positive integer) |
| `UpdateSchema` | `score` (positive integer) |
| `IdParamSchema` | `id` (string) |

## Cache Utility

`src/utils/cache.ts` exposes three generic helpers used directly by the service layer:

```typescript
getCache<T>(key: string): Promise<T | null>
setCache(key: string, value: unknown, TTL: number): Promise<void>
deleteCache(key: string): Promise<void>
```

JSON serialization/deserialization is encapsulated in the utility — callers deal with typed objects only.

## Project Structure

```text
.
├── src/
│   ├── app.ts
│   ├── server.ts
│   ├── config/
│   │   ├── db.ts
│   │   ├── env.ts
│   │   └── redis.ts
│   ├── middleware/
│   ├── modules/
│   │   └── leaderboard/
│   │       ├── leaderboard.controller.ts
│   │       ├── leaderboard.repository.ts
│   │       ├── leaderboard.routes.ts
│   │       ├── leaderboard.schema.ts
│   │       └── leaderboard.service.ts
│   └── utils/
│       ├── cache.ts
│       ├── apiResponse.ts
│       └── asyncHandler.ts
├── prisma/
│   └── schema.prisma
├── prisma.config.ts
├── package.json
└── tsconfig.json
```

---

NOTE: Intentional gaps; the focus here is understanding the cache-aside pattern and cache invalidation mechanics, NOT a production-grade caching system.

## License

ISC
