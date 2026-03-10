
//this is base logger, we will use pino-pretty

import pino from "pino";


export const logger = pino({
    level: "info",
    transport: {
        target: "pino-pretty",
        options: {
            colorize: true,
            translateTime: "SYS:standard"
        }
    }
})

//so something like export const prisma 