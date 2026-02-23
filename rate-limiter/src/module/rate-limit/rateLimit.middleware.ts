import type { Request, Response, NextFunction } from "express"
import { runFixedWindow } from "./rateLimit.algorithm.js"


import type {
  RateLimitMiddlewareConfig,
  RateLimitResult,
} from "./rateLimit.types.js"

//two functions: the createRateLimiter boots up when expresss loads, the rateLimiter would only work when we call a request on /login or /search
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

      let result: RateLimitResult //allowed, remaining, resetAt
    //for now, only fixed window algorithm
      if (config.algorithm === "fixed") {
        result = await runFixedWindow(key, config)
      } else {
        throw new Error("unsupported ratelimit algorithm")
      }

      res.setHeader("X-RateLimit-Limit", config.limit) //max allowed in window (config.limit)
      res.setHeader("X-RateLimit-Remaining", result.remaining) //request left right now 
      res.setHeader("X-RateLimit-Reset", Math.floor(result.resetAt / 1000)) //counter reset when it does 

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



