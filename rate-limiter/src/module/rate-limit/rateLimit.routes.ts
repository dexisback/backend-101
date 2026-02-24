import { Router } from "express"
import { createRateLimiter } from "./rateLimit.middleware.js"
import { create } from "node:domain"
import { success } from "zod"

const router = Router()
//sliding window for login endpoint, fixed window as an overall protector
router.get(
  "/overall-test",
  createRateLimiter({
    algorithm: "fixed",
    limit: 5,
    window: 10,
    prefix: "overall",
    keyGenerator: (req) => req.ip ?? "unknown",
  }),
  (_req, res) => {
    res.json({ success: true, message: "overall test route allowed" })
  }
)
router.get("/login-test", createRateLimiter({algorithm : "sliding", limit: 10, window: 30, prefix: "login", keyGenerator: (req)=>req.ip ?? "unknown"}), (_req, res)=>{res.json({success: true, message: "login test allowed "})})


router.get("/search-test", createRateLimiter({algorithm: "tokenBucket", limit: 20, refill: 5, prefix: "search", keyGenerator: (req)=> req.ip ?? "unknown"}), (_req, res)=>{res.json({success: true, message: "search test allowed"})})
export default router
