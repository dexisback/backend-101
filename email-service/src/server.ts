import app from "./app.js";
import {prisma} from "./config/prisma.js"
import { env } from "./config/env.js";
import { startCron } from "./utils/cron.js";
import { emailWorker } from "./queues/worker.js";
import { logError, logInfo } from "./utils/logger.js";

async function main(){
    try {
        await prisma.$connect();
        logInfo("Connected to database")
        app.listen(env.PORT, ()=>{
            logInfo("Server started", { port: env.PORT, nodeEnv: env.NODE_ENV })
        })


        startCron();
        logInfo("Worker initialized", { queueName: "email-notifications", workerRunning: Boolean(emailWorker) });

    } catch (err) {
        logError("Server startup failed", { error: String(err) });
        process.exit(1);
    }
}





main()
