import express from "express"
import rateLimitRoutes from "./module/rate-limit/rateLimit.routes.js"

const app = express()

app.use(express.json())
app.use("/api", rateLimitRoutes)

export default app
