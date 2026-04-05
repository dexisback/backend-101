import app from "./app.js";
import {prisma} from "./config/prisma.js"
import { startCron } from "./utils/cron.js";


async function main(){
    try {
        await prisma.$connect();
        console.log("connected to neondb")
        app.listen(3000, ()=>{console.log("up and runnin")})


        startCron();

    } catch (err) {
        console.error(`error starting up the server ${err}`)
    }
}




