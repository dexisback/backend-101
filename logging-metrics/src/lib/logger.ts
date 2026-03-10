//creates a single logger instance
//configure log level
//export it/broadcast it for the whole app


import pino from "pino";
export const logger = pino({
    level: process.env.LOG_LEVEL || "info",

    base: {
        service: "api-stress-lab"
    },
    
    timestamp: pino.stdTimeFunctions.isoTime
})


//example log produced fromt his: 
// {
//     "level" :30,
//     "time": "some time",
//     "service": "api name",
//     "event": "event name"

// }