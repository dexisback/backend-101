import redis from "../../db/redis.js"
import type {
  FixedWindowConfig,
  RateLimitResult,
  SlidingWindowConfig,
} from "./rateLimit.types.js"

export async function runFixedWindow(
  key: string,
  config: FixedWindowConfig
): Promise<RateLimitResult> {
  const { limit, window } = config
  const current = await redis.incr(key)

  if (current === 1) {
    await redis.expire(key, window)
  }

  const ttl = await redis.ttl(key)
  const safeTtl = ttl > 0 ? ttl : window

  const remaining = Math.max(limit - current, 0)

  return {
    allowed: current <= limit,
    remaining,
    resetAt: Date.now() + safeTtl * 1000,
  }
}

export async function runSlidingWindow(
  key: string,
  config: SlidingWindowConfig
): Promise<RateLimitResult> {
  const { limit, window } = config
  const now = Date.now()
  const windowMs = window * 1000
  const windowStart = now - windowMs

  await redis.zRemRangeByScore(key, 0, windowStart)

  const member = `${now}-${Math.random().toString(36).slice(2)}`
  await redis.zAdd(key, { score: now, value: member })

  const current = await redis.zCard(key)
  await redis.pExpire(key, windowMs)

  const oldest = await redis.zRangeWithScores(key, 0, 0)
  const oldestScore = oldest.at(0)?.score ?? now
  const resetAt = oldestScore + windowMs
  const remaining = Math.max(limit - current, 0)

  return {
    allowed: current <= limit,
    remaining,
    resetAt,
  }
}
