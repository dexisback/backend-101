import dotenv from "dotenv"
dotenv.config();


export const env = {
    DATABASE_URL: process.env.DATABASE_URL,
    REDIS_HOST: process.env.REDIS_HOST || "localhost",
    REDIS_PORT: Number(process.env.REDIS_PORT || 6379),
    QUEUE_NAME: process.env.QUEUE_NAME || "events"
}




