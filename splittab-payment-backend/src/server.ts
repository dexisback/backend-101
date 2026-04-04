import app from "./app.js";
import {prisma} from "./config/prisma.js"
import { startReconciliationCron } from "./modules/workers/reconciliation.cron.js";
import { initWebSocketServer } from "./shared/websockets/socket.manager.js";
import "./config/redis.js"
import http from "http"
import { startWebhookWorker } from "./modules/workers/webhook.worker.js";


const PORT = process.env.PORT || 3000;
async function main(){
    try {
      
        await prisma.$connect();
      console.log("db up and runnin...")
      
      startReconciliationCron();
      console.log("reconcilliation cron up and runnin...")

      startWebhookWorker();
      console.log("bullmq worker up and runnin...")

    //   const server = app.listen(PORT, ()=>{
    //     console.log("server up and runnin")
    //   })

    //new: create raw http aserver> initialise ws on that server> listen on the raw server (not the express app)
    const server = http.createServer(app);
        initWebSocketServer(server)
        console.log(`ws server initalised...`)
        server.listen(PORT, ()=>{ console.log(`server up and runnin on port ${PORT}`) })
        
        const shutdown = async ()=>{
            server.close();
            await prisma.$disconnect()
            process.exit(0)
        }


        process.on("SIGINT", shutdown)
        process.on("SIGTERM", shutdown)

    } catch (err) {
        console.error(`Error starting up ${err}`)
        process.exit(1)
    }


}



main()