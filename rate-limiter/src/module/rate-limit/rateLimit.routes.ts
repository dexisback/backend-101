import { Router } from "express"
import { createRateLimiter } from "./rateLimit.middleware.js"

const router = Router()

router.get(
  "/login-test",
  createRateLimiter({
    algorithm: "fixed",
    limit: 5,
    window: 10,
    prefix: "login",
    keyGenerator: (req) => req.ip ?? "unknown",
  }),
  (_req, res) => {
    res.json({ success: true, message: "Login test request allowed" })
  }
)

export default router
