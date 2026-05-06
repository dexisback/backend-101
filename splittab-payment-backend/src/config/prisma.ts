import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client.js";
import { env } from "./env.js";

const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });

export const prisma = new PrismaClient({
	adapter,
	// Helps when multiple startup tasks (cron/worker) contend for connections.
	// Prisma defaults can be too aggressive for serverless/pooled Postgres.
	transactionOptions: {
		maxWait: 15_000,
		timeout: 30_000,
	},
});




//global prisma instance
