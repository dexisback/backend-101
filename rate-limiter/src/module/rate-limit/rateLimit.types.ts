import type { Request } from "express"

export type FixedWindowConfig = {
  algorithm: "fixed"
  limit: number
  window: number
}

export type RateLimitResult = {
  allowed: boolean
  remaining: number
  resetAt: number
}

export type TokenBucketConfig = {
  algorithm: "tokenBucket"
  limit: number
  refill: number
}

export type RateLimitAlgorithmConfig = FixedWindowConfig | TokenBucketConfig

export type RateLimitMiddlewareConfig = RateLimitAlgorithmConfig & {
  keyGenerator: (req: Request) => string
  prefix?: string
}
