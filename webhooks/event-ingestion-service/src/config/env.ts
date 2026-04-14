import dotenv from "dotenv";

dotenv.config();

export const env = {
    DATABASE_URL: process.env.DATABASE_URL,
    WEBHOOK_SECRET: process.env.WEBHOOK_SECRET || "",
    REDIS_HOST: process.env.REDIS_HOST || "127.0.0.1",
    REDIS_PORT: Number(process.env.REDIS_PORT || 6379),
    QUEUE_NAME: process.env.QUEUE_NAME || "events"
};
