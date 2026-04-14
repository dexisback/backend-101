import app from "./app.js"
import { prisma } from "./lib/prisma.js";
import { redis } from "./lib/redis.js";

const start = async () => {
    await prisma.$connect();
    await redis.ping();
    app.listen(3000, ()=>{console.log("up and runnin")});
};

start().catch((err) => {
    console.error("failed to start ingestion service", err);
    process.exit(1);
});
