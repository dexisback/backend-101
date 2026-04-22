import app from "./app.js";
import {prisma} from "./config/prisma.js"
import { env } from "./config/env.js";
import { startCron } from "./utils/cron.js";
import { logError, logInfo } from "./utils/logger.js";
import { ensureRedisConnection } from "./config/redis.js";

async function main(){
    try {
        await prisma.$connect();
        logInfo("Connected to database")
        await ensureRedisConnection();
        logInfo("Connected to redis");

        const { emailWorker } = await import("./queues/worker.js");

        app.listen(env.PORT, ()=>{
            logInfo("Server started", { port: env.PORT, nodeEnv: env.NODE_ENV })
        })


        startCron();
        logInfo("Worker initialized", { queueName: "email-notifications", workerRunning: Boolean(emailWorker) });

    } catch (err) {
        logError("Server startup failed", { error: String(err) });
        logError("Startup hint", {
            message: "Ensure Redis is running and REDIS_URL is correct before starting the service."
        });
        process.exit(1);
    }
}





main()
