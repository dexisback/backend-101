import type { Request } from "express"

export type FixedWindowConfig = {
  algorithm: "fixed"
  limit: number
  window: number 
}
export type SlidingWindowConfig = {
  algorithm : "sliding",
  limit: number,
  window: number
}
export type TokenBucketConfig = {
  algorithm: "tokenBucket"
  limit: number
  refill: number
}

export type RateLimitResult = {
  allowed: boolean
  remaining: number
  resetAt: number
}


export type RateLimitAlgorithmConfig = FixedWindowConfig | TokenBucketConfig | SlidingWindowConfig

export type RateLimitMiddlewareConfig = RateLimitAlgorithmConfig & {
  keyGenerator: (req: Request) => string
  prefix?: string
}
