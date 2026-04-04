import app from "./app.js";
import {prisma} from "./config/prisma.js"

const PORT = process.env.PORT || 3000;
async function main(){
    try {
      await prisma.$connect();
      console.log("up and runnin")
      
    } catch (err) {
        console.error(`Error starting up ${err}`)
    }

}



main()