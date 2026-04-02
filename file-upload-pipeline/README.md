├── prisma/
│   └── schema.prisma        # Prisma models mapping to your Neon Postgres DB
├── src/
│   ├── config/              # Third-party initializations
│   │   ├── env.ts           # Zod validation for your process.env
│   │   ├── db.ts            # Prisma client singleton export
│   │   ├── cloudinary.ts    # Cloudinary SDK setup
│   │   └── redis.ts         # Redis client connection
│   │
│   ├── modules/             # Your feature domains
│   │   └── media/
│   │       ├── media.controller.ts  # HTTP req/res handling
│   │       ├── media.service.ts     # Core logic (Prisma DB calls + Cloudinary uploads)
│   │       ├── media.routes.ts      # Express router for /api/media
│   │       └── media.schema.ts      # Zod schemas for request validation
│   │
│   ├── middlewares/
│   │   ├── upload.ts        # Multer memory storage config
│   │   ├── error.ts         # Global error catcher (Multer limits, Prisma errors)
│   │   └── rateLimit.ts     # Redis sliding window limiter
│   │
│   ├── utils/
│   │   ├── image.ts         # Sharp operations & BlurHash generation
│   │   ├── file.ts          # Magic number binary checks
│   │   └── logger.ts        # Pino structured logging
│   │
│   ├── jobs/
│   │   └── cron.ts          # Node-cron orphan cleanup logic
│   │
│   ├── app.ts               # Express app setup, middleware binding
│   └── server.ts            # Entry point (app.listen)
│
├── .env
├── package.json
└── tsconfig.json





