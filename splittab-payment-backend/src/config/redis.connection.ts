import { env } from "./env.js";

export const redisUrl = env.REDIS_URL || "redis://localhost:6379";

let host = env.REDIS_HOST || "localhost";
let port = env.REDIS_PORT || 6379;
let password: string | undefined;

if (env.REDIS_URL) {
  const url = new URL(env.REDIS_URL);
  host = url.hostname;
  if (url.port) port = Number(url.port);
  if (url.password) password = url.password;
}

export const bullConnection = password ? { host, port, password } : { host, port };
