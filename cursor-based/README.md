# Cursor-Based Pagination (Practice Project)

A minimal backend that implements cursor-based (keyset) pagination over a PostgreSQL-backed activity feed. Built to understand the mechanics of stable, performant pagination without the `OFFSET` degradation problem 


## Why This Project Exists

built to practice:

- implementing forward-only cursor pagination using Prisma's `cursor` + `skip: 1` pattern
- understanding why `OFFSET` breaks down at scale and how keyset pagination avoids full table scans
- using `take: limit + 1` as the canonical "has next page" signal without a separate `COUNT(*)` query
- validating all query parameters at the boundary layer before they hit the database

The domain (a developer activity log) is intentionally trivial so the pagination mechanics stay center-stage.

## How Cursor Pagination Works:

```text
GET /activities?limit=5
  -> fetch limit+1 rows (6), ordered by createdAt DESC
  -> if 6 rows returned: hasNextPage=true, cursor = last_visible_row.id
  -> return first 5 rows to client

GET /activities?limit=5&cursor=<last_id>
  -> Prisma: cursor: { id: cursor }, skip: 1
  -> fetch next window anchored after the cursor row
  -> same hasNextPage logic applies
```

The `skip: 1` is critical -- it tells Prisma to exclude the cursor row itself from results, effectively starting the next page immediately after it.

## Architecture Flow

```text
HTTP Request
   -> Zod schema validation (query params + body)
      -> Route handler
         -> Prisma query (cursor + take + skip + orderBy)
            -> PostgreSQL (via @prisma/adapter-pg)
```

## Tech Stack

- Runtime: Node.js, Express 5, TypeScript
- ORM: Prisma v7 with `@prisma/adapter-pg`
- Database: PostgreSQL
- Validation: Zod v4
- Dev: `tsx` for zero-config TypeScript execution

## Data Model

```
Activity
  id          String    (cuid, used as the cursor)
  developer   String
  action      String
  project     String
  createdAt   DateTime  (indexed — anchor for ordering)

@@index([createdAt])
```

`createdAt` is explicitly indexed because cursor pagination relies on ordered traversal. Without an index here, every paginated query becomes a full sequential scan.

## Quick Start

### 1) Configure environment

Create a `.env` file:

```
DATABASE_URL=your_postgres_connection_string
```

### 2) Install dependencies

```bash
npm install
```

### 3) Generate Prisma Client + push schema

```bash
npx prisma generate
npx prisma db push
```

### 4) Run the dev server

```bash
npm run dev
```

API base URL: `http://localhost:3000`

## API Surface

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/activities` | Create a new activity record |
| `GET` | `/activities` | Fetch a paginated window of activities |
| `GET` | `/activities/:id` | Fetch a single activity by ID |

## Request / Response Shapes

### `POST /activities`

```json
// Request body
{
  "developer": "amaan",
  "action": "merged PR #42",
  "project": "backend-101"
}

// 201 Response
{
  "id": "clxxx...",
  "developer": "amaan",
  "action": "merged PR #42",
  "project": "backend-101",
  "createdAt": "2026-03-11T..."
}
```

### `GET /activities?limit=5&cursor=<id>`

Query parameters:

| Param | Type | Default | Constraints |
|---|---|---|---|
| `limit` | number | `5` | min: 1, max: 50 |
| `cursor` | string | — | optional; cuid of the last seen row |

```json
// 200 Response (array of activity objects)
[
  { "id": "clxxx...", "developer": "amaan", "action": "...", "project": "...", "createdAt": "..." },
  ...
]
```

The response is a raw array. Detecting `hasNextPage` is left to the consumer: if the returned array length equals `limit + 1`, more pages exist. Strip the last element before rendering.

### `GET /activities/:id`

ID must be a valid UUID format. Returns `400` on malformed ID, `404` if the record doesn't exist.

## Validation Layer

| Schema | Fields |
|---|---|
| `createActivitySchema` | `developer` (min 1), `action` (min 1), `project` (min 1) |
| `cursorQuerySchema` | `limit` (coerced number, 1–50, default 5), `cursor` (optional string) |
| `idSchema` | `id` (UUID format) |

Query params are always strings coming off the wire — `z.coerce.number()` handles the string-to-number coercion so the route handler never has to.

## Project Structure

```text
.
├── src/
│   ├── index.ts
│   ├── db/
│   │   └── prisma.ts
│   ├── routes/
│   │   └── activity.routes.ts
│   └── schemas/
│       └── activity.schema.ts
├── prisma/
│   └── schema.prisma
├── prisma.config.ts
├── package.json
└── tsconfig.json
```

## Cursor vs Offset — Key Tradeoffs

| | Offset Pagination | Cursor Pagination |
|---|---|---|
| Implementation | Simple (`skip`, `take`) | Slightly more involved (cursor anchor) |
| Consistency | Row shifts break pages | Stable — inserts/deletes don't affect in-flight cursors |
| Performance at scale | Degrades (`OFFSET N` scans N rows) | Constant — anchors directly to the row |
| Random access | `?page=42` works | No — strictly forward-only |
| Total page count | Easy (`COUNT / limit`) | Requires separate query or estimate |

Cursor pagination is the right call for feeds, logs, and any dataset that's large or frequently mutated.



NOTE: Intentional gaps; the focus here is the cursor pagination and  NOT a backend system

## License

ISC
