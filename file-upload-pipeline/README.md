## Project Structure

```text
.
├── prisma/
│   └── schema.prisma                # Prisma models mapping to your Neon Postgres DB
├── src/
│   ├── config/                      # Third-party initializations
│   │   ├── env.ts                   # Zod validation for process.env
│   │   ├── db.ts                    # Prisma client singleton export
│   │   ├── cloudinary.ts            # Cloudinary SDK setup
│   │   └── redis.ts                 # Redis client connection
│   ├── modules/                     # Feature domains
│   │   └── media/
│   │       ├── media.controller.ts  # HTTP req/res handling
│   │       ├── media.service.ts     # Core logic (Prisma + Cloudinary)
│   │       ├── media.routes.ts      # Express router for /api/media
│   │       └── media.schema.ts      # Zod request schemas
│   ├── middlewares/
│   │   ├── upload.ts                # Multer memory storage config
│   │   ├── error.ts                 # Global error handler
│   │   └── rateLimit.ts             # Redis sliding window limiter
│   ├── utils/
│   │   ├── image.ts                 # Sharp ops & BlurHash generation
│   │   ├── file.ts                  # Magic number binary checks
│   │   └── logger.ts                # Pino structured logger
│   ├── jobs/
│   │   └── cron.ts                  # Orphan cleanup cron job
│   ├── app.ts                       # Express app setup
│   └── server.ts                    # Entry point (app.listen)
├── prisma.config.ts
├── .env
├── package.json
└── tsconfig.json
```





