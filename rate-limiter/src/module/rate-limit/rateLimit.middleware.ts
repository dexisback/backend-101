import type { Request, Response, NextFunction } from "express"
import { runFixedWindow, runSlidingWindow, runtokenBucket } from "./rateLimit.algorithm.js"
import type {
  RateLimitMiddlewareConfig,
  RateLimitResult,
} from "./rateLimit.types.js"

export function createRateLimiter(config: RateLimitMiddlewareConfig) {
  return async function rateLimiter(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const identity = config.keyGenerator(req)
      const prefix = config.prefix ?? "global"
      const key = `rate_limit:${prefix}:${identity}`

      let result: RateLimitResult

      if (config.algorithm === "fixed") {
        result = await runFixedWindow(key, config)
      } else if (config.algorithm === "sliding") {
        result = await runSlidingWindow(key, config)
      } 
      else if(config.algorithm === "tokenBucket"){
        result = await runtokenBucket(key, config)
      }
      
      else {
        throw new Error("Unsupported rate-limit algorithm")
      }

      res.setHeader("X-RateLimit-Limit", config.limit)
      res.setHeader("X-RateLimit-Remaining", result.remaining)
      res.setHeader("X-RateLimit-Reset", Math.floor(result.resetAt / 1000))

      if (!result.allowed) {
        const retryAfterSeconds = Math.max(
          Math.ceil((result.resetAt - Date.now()) / 1000),
          1
        )

        res.setHeader("Retry-After", retryAfterSeconds)
        return res.status(429).json({
          success: false,
          message: "Too many requests",
        })
      }

      next()
    } catch (err) {
      next(err)
    }
  }
}
