# Auth Service (JWT + Refresh Token Practice Project)

A focused backend service implementing stateful JWT-based authentication with refresh token rotation. Built to understand the full auth lifecycle — credential hashing, access token issuance, refresh token persistence, and protected route enforcement — without the noise of application-level business logic getting in the way.

## Why This Project Exists

This repo was built to practice:

- designing a clean auth flow with short-lived access tokens and long-lived refresh tokens
- persisting refresh tokens in a relational database for stateful session control
- enforcing auth boundaries with JWT-verifying middleware across protected routes
- validating all incoming payloads at the boundary using Zod schemas before they touch the service layer
- structuring backend code into a clear controller → service → repository separation

Intentionally keeps the domain simple (users and tokens only) so the auth internals are easier to reason about.

## Architecture Flow

```text
HTTP Request
   -> Zod schema validation (boundary guard)
      -> AuthController (route handler)
         -> AuthService (business logic: bcrypt, jwt signing, token management)
            -> AuthRepository (Prisma queries)
               -> Neon PostgreSQL (via @prisma/adapter-neon)
```

Auth middleware sits orthogonally to this flow and short-circuits protected routes before the controller is ever reached.

## Tech Stack

- Runtime: Node.js, Express 5, TypeScript
- ORM: Prisma v7 with Neon serverless adapter
- Database: PostgreSQL (Neon)
- Auth: JSON Web Tokens (`jsonwebtoken`), password hashing (`bcrypt`)
- Validation: Zod v4
- Dev: `tsx` for zero-config TypeScript execution

## Data Model

Two models, one relation:

```
User
  id          String   (cuid)
  email       String   (unique)
  password    String   (bcrypt hash, never returned in responses)
  name        String
  createdAt   DateTime
  refreshTokens RefreshToken[]

RefreshToken
  id          String   (cuid)
  token       String   (unique)
  userId      String   (FK -> User, cascade delete)
  expiresAt   DateTime
  createdAt   DateTime
```

A single user can hold multiple active refresh tokens (e.g. logged in across phone + laptop simultaneously). Deleting a user cascades to all their tokens.

## Quick Start

### 1) Configure environment

```bash
cp .env.example .env
```

Fill in your values:

```
DATABASE_URL=
ACCESS_TOKEN_SECRET=
REFRESH_TOKEN_SECRET=
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
PORT=3000
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

### 4) Seed the database (optional)

```bash
npm run seed
```

### 5) Run the dev server

```bash
npm run dev
```

API base URL: `http://localhost:3000`

## API Surface

| Method | Path | Auth Required | Purpose |
|---|---|---|---|
| `POST` | `/auth/register` | No | Create a new user account |
| `POST` | `/auth/login` | No | Authenticate and receive token pair |
| `POST` | `/auth/logout` | Yes (Bearer) | Invalidate a refresh token |
| `POST` | `/auth/refresh` | No | Exchange refresh token for a new access token |
| `GET` | `/me` | Yes (Bearer) | Fetch authenticated user's profile |

Protected routes expect `Authorization: Bearer <accessToken>` in the request header.

## Request / Response Shapes

### `POST /auth/register`

```json
// Request body
{
  "email": "amaan@example.com",
  "password": "securepass",
  "name": "Amaan"
}

// 201 Response
{
  "success": true,
  "message": "user registered successfully",
  "data": {
    "id": "clxxx...",
    "email": "amaan@example.com",
    "name": "Amaan",
    "createdAt": "2026-03-11T..."
  }
}
```

`password` is never returned. Stripped at the service layer via destructuring, not `delete`.

### `POST /auth/login`

```json
// Request body
{
  "email": "amaan@example.com",
  "password": "securepass"
}

// 200 Response
{
  "success": true,
  "data": {
    "accessToken": "<jwt>",
    "refreshToken": "<jwt>",
    "user": { "id": "...", "email": "...", "name": "..." }
  }
}
```

### `POST /auth/logout`

Requires `Authorization: Bearer <accessToken>`. Body:

```json
{
  "refreshToken": "<jwt>"
}
```

Deletes the specific refresh token from the database. Other sessions are unaffected.

### `POST /auth/refresh`

```json
// Request body
{
  "refreshToken": "<jwt>"
}

// 200 Response
{
  "success": true,
  "data": {
    "accessToken": "<new_jwt>"
  }
}
```

Validates the token signature, checks it exists in the database, verifies `expiresAt` hasn't passed, then issues a fresh access token.

## Token Strategy

| Token | Expiry | Storage recommendation | Purpose |
|---|---|---|---|
| Access Token | Short (`15m`) | Memory / request scope | Authenticate individual API calls |
| Refresh Token | Long (`7d`) | HttpOnly cookie or secure client store | Obtain new access tokens without re-login |

Refresh tokens are persisted in the database, making logout meaningful — deleting the row from `RefreshToken` immediately invalidates that session, even if the token hasn't cryptographically expired yet.

## Middleware

### `authMiddleWare`

Runs before any protected route handler. Extracts the Bearer token from `Authorization` header, verifies it against `ACCESS_TOKEN_SECRET`, and attaches `userId` to the request object for downstream use. Rejects with `401` on any failure path.

### `errorMiddleware`

Global Express error handler. Catches anything propagated via `next(err)` or thrown inside `asyncHandler`-wrapped controllers and returns a consistent error shape.

## Validation Layer

All route payloads are parsed by Zod schemas at the controller boundary before the service layer is ever invoked:

| Schema | Fields |
|---|---|
| `registerSchema` | `email` (valid email), `password` (min 6), `name` (min 2) |
| `loginSchema` | `email` (valid email), `password` (min 1) |
| `logoutSchema` | `refreshToken` (min 1) |

Invalid payloads return `400` immediately. The service layer can assume data is already clean and typed.

## Project Structure

```text
.
├── src/
│   ├── app.ts
│   ├── server.ts
│   ├── config/
│   │   ├── db.ts
│   │   └── env.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   └── error.middleware.ts
│   ├── modules/
│   │   └── auth/
│   │       ├── auth.controller.ts
│   │       ├── auth.repository.ts
│   │       ├── auth.routes.ts
│   │       └── auth.schema.ts
│   └── utils/
│       ├── asyncHandler.ts   (also houses authService)
│       └── apiResponse.ts
├── prisma/
│   └── schema.prisma
├── prisma.config.ts
├── seed.ts
├── package.json
└── tsconfig.json
```

## Known Limitations (Learning Scope)

- `authService` is co-located in `asyncHandler.ts` rather than its own `auth.service.ts` file — a structural debt to clean up
- no token rotation on refresh (old refresh token is not deleted on use; a production system should rotate and detect reuse)
- no rate limiting on `/auth/login` — brute force is possible
- no email verification or password-reset flow
- `req.userId` is set via `@ts-ignore` rather than proper Express request augmentation via `declare global`
- refresh endpoint in the controller currently calls `authService.logout` instead of `authService.refresh` — a bug to fix
---

NOTE: There are intentional gaps for a practice implementation focused on understanding the auth lifecycle primitives.

## License

ISC
