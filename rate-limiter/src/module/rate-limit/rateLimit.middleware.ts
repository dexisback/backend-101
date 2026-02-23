import type { Request, Response, NextFunction } from "express"
import { runFixedWindow } from "./rateLimit.algorithm.js"
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
    //for now, only fixed window algorithm
      if (config.algorithm === "fixed") {
        result = await runFixedWindow(key, config)
      } else {
        throw new Error("unsupported ratelimit algorithm")
      }

      res.setHeader("X-RateLimit-Limit", config.limit)
      res.setHeader("X-RateLimit-Remaining", result.remaining)
      res.setHeader("X-RateLimit-Reset", Math.floor(result.resetAt / 1000))

      if (!result.allowed) {
        res.setHeader("Retry-After", Math.ceil((result.resetAt - Date.now()) / 1000))
        return res.status(429).json({
          success: false,
          message: "Too many requests",
        })
      }

      //else go next(), so basically res.json(Login test request allowed) :
      next()
    } catch (err) {
      next(err)
    }
  }
}



//okay so rateLimit.middleware.ts i am having difficulty learning
// 