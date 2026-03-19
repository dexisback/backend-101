
//this is base logger, we will use pino-pretty
import pino from "pino";
export const logger = pino({
  level: "info",
  base: {
    service: "flash-sale-api",
    env: process.env.NODE_ENV ?? "development",
  },
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:standard",
    },
  },
});
