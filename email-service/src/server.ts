import app from "./app.js";
import {prisma} from "./config/prisma.js"


async function main(){
    try {
        await prisma.$connect();
        console.log("connected to neondb")
        app.listen(3000, ()=>{console.log("up and runnin")})


    } catch (err) {
        console.error(`error starting up the server ${err}`)
    }
}




