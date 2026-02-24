import redis from "../../db/redis.js"
import type {
  FixedWindowConfig,
  RateLimitResult,
  SlidingWindowConfig,
  TokenBucketConfig,
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


export async function runtokenBucket(key: string, config: TokenBucketConfig):Promise<RateLimitResult> {
    const { limit: capacity, refill } = config
    const now = Date.now();


    if(refill<=0){
        throw new Error("Token bucket is now empty :/") //self explanatory
    }

    const state = await redis.hGetAll(key)

    const prevTokens=state.tokens ? Number(state.tokens) : capacity
    const prevRefillAt = state.lastRefill ? Number(state.lastRefill) : now
    const timeDone = Math.max((now-prevRefillAt)/1000,0)
    const newTokens = Math.min(capacity, prevTokens+timeDone * refill)

    const allowed = newTokens >=1
    const tokensAfterReq = allowed ? newTokens -1 : newTokens
    const remaining = Math.max(Math.floor(tokensAfterReq),0)

    //when can client expect at least 1 token:
    const timeUntilNextToken = tokensAfterReq >=1 ? 0 : Math.ceil(((1-tokensAfterReq)/refill)*1000)


    const resetAt = now+ timeUntilNextToken //this is the time until 1 token exists again

    await redis.hSet(key, {tokens: tokensAfterReq.toString(), lastRefill: now.toString()})


    //cleanup the bucket:
    const ttlSeconds = Math.max(Math.ceil((capacity/refill)*2),1)
    await redis.expire(key, ttlSeconds)

    //note: tokens can be fractional asw, remaining time converted to integer for headers
    
    return {
        allowed,
        remaining,
        resetAt
    }
}