# Redis and Caching: Leaderboard API

This project is a local  build+ implementation of a leaderboard system with Redis caching.

The flow:
- store leaderboard data in Postgres (via Prisma)
- cache top leaderboard results in Redis
- expose CRUD endpoints through an Express API



## What this project does

- `GET /leaderboard?limit=10|50|100`
  - Returns top developers by score.
  - Uses a cache-first strategy:
    - check Redis first
    - if cache miss, query database
    - store result in Redis with TTL

- `POST /leaderboard`
  - Creates a new leaderboard entry.
  - Invalidates cached top lists.

- `PATCH /leaderboard/:id`
  - Updates a developer score.
  - Invalidates cached top lists.

- `DELETE /leaderboard/:id`
  - Deletes a leaderboard entry.
  - Invalidates cached top lists.

## Tech stack

- Node.js + TypeScript
- Express
- Prisma + PostgreSQL
- Redis
- Zod for request and env validation

## Project structure

- `src/modules/leaderboard`:
  - routes, controller, schema, service, repository
- `src/config`:
  - env config, Redis client, Prisma client
- `src/utils`:
  - cache helpers, async handler, API response format
- `src/middleware`:
  - centralized error handling

## Local setup

1. Install dependencies:
```bash
npm install
```

2. Configure `.env` with valid values:
- `DATABASE_URL`
- `REDIS_URL` (for local Redis: `redis://localhost:6379`), upstash doesnt work w Jio btw
- `PORT` (optional, defaults to `3000`)

3. Make sure Redis is running locally.

4. Run database migrations / generate Prisma client (if needed).

5. Start the server:
```bash
npm run dev
```

---

