import {app} from "./app.js"
import { env } from "./config/env.js"


async function start(){
    try {
     
    await app.listen({ port: Number(env.PORT) })
    console.log(`up and runnin on ${env.PORT}`)   
    } catch (err) {
        app.log.error(err);
        process.exit(1)
    }
}


start()