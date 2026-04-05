### what is this about?
centralized, asynchronous notification API that accepts email requests, queues them, handles temporary and permanent failures, manages templates, and guarantees delivery even if a third-party email provider goes down.

### stack:
yk it 


### design diagram:
to be added here 


### file and folder architecture:
```text 
src/
├── config/             # Environment variables, Redis, and Prisma clients
├── middlewares/        # Idempotency, rate-limiting, error handling
├── modules/            # Feature-based domains
│   ├── notification/   # POST /notify routes, controllers, and validation
│   └── webhook/        # Provider webhooks (bounces, deliveries)
├── queue/              # BullMQ configuration, producers, and workers
├── templates/          # Handlebars (.hbs) or HTML email templates
├── utils/              # Helper functions (logger, template compiler)
├── app.ts              # Express application setup
└── server.ts           # Server entry point
prisma/
└── schema.prisma       # Database schema


```


### some decisions, notes:
- indexing createdAt, TODO: (DELETE WHERE createdAt<yesterday) easily
