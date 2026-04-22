import { Redis } from 'ioredis';

// Use the environment variable if provided (e.g., from Upstash, Render, or Railway), 
// otherwise default to a local Redis instance on the standard port.
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

const redisClient = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null, // BullMQ requires this to be null
  lazyConnect: true,
  connectTimeout: 5000,
  enableReadyCheck: false,
  retryStrategy: () => null, // fail fast; do not keep reconnecting on startup
});

redisClient.on('connect', () => {
  hasLoggedRedisConnectionError = false;
  console.log(' Connected to Redis');
});

let hasLoggedRedisConnectionError = false;
redisClient.on('error', (err:any) => {
  if (hasLoggedRedisConnectionError) return;
  hasLoggedRedisConnectionError = true;
  const summary = err?.message || String(err);
  console.error(`Redis connection error: ${summary}`);
});

export const ensureRedisConnection = async () => {
  await redisClient.ping();
};

export default redisClient;
