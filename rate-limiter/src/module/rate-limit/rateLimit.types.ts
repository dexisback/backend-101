//fixed window config and ratelimitresult 
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


