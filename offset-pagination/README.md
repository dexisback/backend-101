# Offset Pagination (Practice Project)

A minimal backend that implements classic offset-based (page/limit) pagination over a PostgreSQL-backed posts table. Built to understand the foundational mechanics of paginated APIs — calculating skip offsets, fetching pages in parallel with total counts, and returning structured pagination metadata alongside the data payload.

## Why This Project:

This repo was built to practice:

- implementing `skip` / `take` pagination with Prisma
- running `findMany` and `count` as a single `Promise.all` to avoid sequential round-trips
- constructing a full pagination metadata envelope (`total`, `totalPages`, `hasNext`, `hasPrev`)
- validating and coercing query string parameters with Zod before they reach the database layer

The domain (a simple posts feed) is intentionally trivial so the pagination pattern stays the focus.


## How Offset Pagination Works Here

```text
GET /posts?page=2&limit=10
  -> skip = (page - 1) * limit  =>  skip = 10
  -> Promise.all([
       prisma.post.findMany({ skip: 10, take: 10, orderBy: createdAt DESC }),
       prisma.post.count()
     ])
  -> totalPages = Math.ceil(total / limit)
  -> hasNext = page < totalPages
  -> hasPrev  = page > 1
```

The `findMany` and `count` queries fire in parallel — no waterfall. Total rows is needed to compute `totalPages` and the `hasNext`/`hasPrev` flags for the client.

## Architecture:

```text
HTTP Request
   -> Zod schema validation (query params + body)
      -> Route handler
         -> Promise.all(findMany + count)
            -> PostgreSQL (via @prisma/adapter-neon / pg)
               -> Paginated response with metadata envelope
```

## Tech Stack

- Runtime: Node.js, Express 5, TypeScript
- ORM: Prisma v7 with Neon serverless adapter + `@prisma/adapter-pg`
- Database: PostgreSQL (Neon)
- Validation: Zod v4
- Dev: `tsx` for zero-config TypeScript execution

## Data Model

```
Post
  id          String    (cuid)
  title       String
  content     String
  author      String
  createdAt   DateTime
```

Ordered by `createdAt DESC` on every paginated fetch — newest first.

## Quick Start

### 1) Configure environment

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
| `POST` | `/posts` | Create a new post |
| `GET` | `/posts` | Fetch a paginated page of posts |
| `GET` | `/posts/:id` | Fetch a single post by ID |

## Request / Response Shapes

### `POST /posts`

```json
// Request body
{
  "title": "Understanding Prisma Adapters",
  "content": "A deep dive into the adapter pattern...",
  "author": "amaan"
}

// 200 Response
{
  "id": "clxxx...",
  "title": "Understanding Prisma Adapters",
  "content": "...",
  "author": "amaan",
  "createdAt": "2026-03-11T..."
}
```

### `GET /posts?page=1&limit=5`

Query parameters:

| Param | Type | Default | Constraints |
|---|---|---|---|
| `page` | number | `1` | min: 1 |
| `limit` | number | `5` | min: 1 |

```json
// 200 Response
{
  "data": [
    { "id": "...", "title": "...", "content": "...", "author": "...", "createdAt": "..." }
  ],
  "pagination": {
    "total": 42,
    "page": 1,
    "limit": 5,
    "totalPages": 9,
    "hasNext": true,
    "hasPrev": false
  }
}
```

The `pagination` envelope is always present, giving the client everything it needs to render page controls without issuing additional requests.

### `GET /posts/:id`

Returns `404` if the post doesn't exist, `400` if the ID param is missing.

## Validation Layer

| Schema | Fields |
|---|---|
| `CreatePostSchema` | `title` (min 1), `author` (min 1), `content` (min 1) |
| `paginationQuerySchema` | `page` (coerced number, min 1, default 1), `limit` (coerced number, min 1, default 5) |

`z.coerce.number()` handles the string-to-number conversion that's mandatory for query params — HTTP query strings are always strings off the wire.

## Project Structure

```text
.
├── src/
│   ├── index.ts
│   ├── db/
│   │   └── db.ts
│   ├── routes/
│   │   └── post.routes.ts
│   └── schemas/
│       └── post.schema.ts
├── prisma/
│   └── schema.prisma
├── prisma.config.ts
├── seed.ts
├── package.json
└── tsconfig.json
```

## Offset vs Cursor — Key Tradeoffs

| | Offset Pagination | Cursor Pagination |
|---|---|---|
| Implementation | Simple (`skip`, `take`) | Slightly more involved (cursor anchor) |
| Random access | `?page=42` works | No — strictly forward-only |
| Total page count | Trivially available | Requires separate query or estimate |
| Performance at scale | Degrades (`OFFSET N` scans N rows) | Constant — anchors directly to the row |
| Consistency | Row shifts can duplicate/skip items | Stable across inserts/deletes |

Offset pagination is the right call when the dataset is small-to-medium, random page access matters, or you need to display a total page count. It degrades at large scale — use cursor pagination for unbounded feeds.

---

NOTE: Intentional gaps; the focus here was understanding the offset pagination 

## License

ISC
