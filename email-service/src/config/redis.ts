import { Redis } from 'ioredis';

// Use the environment variable if provided (e.g., from Upstash, Render, or Railway), 
// otherwise default to a local Redis instance on the standard port.
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

const redisClient = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null, // BullMQ requires this to be null
  enableReadyCheck: false,
});

redisClient.on('connect', () => {
  console.log(' Connected to Redis');
});

redisClient.on('error', (err:any) => {
  console.error('Redis connection error:', err);
});

export default redisClient;