import { worker } from "./workers/worker";
import { log } from "./utils/logger";
import { prisma } from "./db/prisma";
import { redisConnection } from "./config/redis";
import Redis from "ioredis";

const start = async () => {
  await prisma.$connect();
  const redis = new Redis(redisConnection);
  await redis.ping();
  await redis.quit();
  log("CI Worker started...");
};

start().catch((err) => {
  log("failed to start CI worker", err);
  process.exit(1);
});

