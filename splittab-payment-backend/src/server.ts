import app from "./app.js";
import {prisma} from "./config/prisma.js"
import { startReconciliationCron } from "./modules/workers/reconciliation.cron.js";

const PORT = process.env.PORT || 3000;
async function main(){
    try {
      await prisma.$connect();
      console.log("db up and runnin...")
      startReconciliationCron();
      console.log("reconcilliation cron up and runnin...")
      const server = app.listen(PORT, ()=>{
        console.log("server up and runnin")
      })

    } catch (err) {
        console.error(`Error starting up ${err}`)
        process.exit(1)
    }
    

}



main()