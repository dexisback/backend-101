import { env } from "./env";
export const redisConnection = {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT
}

