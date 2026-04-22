import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
import { env } from "./env.js";

const toNeonPoolerUrl = (rawUrl: string) => {
	try {
		const parsedUrl = new URL(rawUrl);
		const isNeonHost = parsedUrl.hostname.endsWith(".neon.tech");
		const isAlreadyPooler = parsedUrl.hostname.includes("-pooler.");
		if (!isNeonHost || isAlreadyPooler) return rawUrl;

		const [firstLabel, ...rest] = parsedUrl.hostname.split(".");
		if (!firstLabel || !firstLabel.startsWith("ep-")) return rawUrl;
		parsedUrl.hostname = [`${firstLabel}-pooler`, ...rest].join(".");
		return parsedUrl.toString();
	} catch {
		return rawUrl;
	}
};

const rawDatabaseUrl = env.DATABASE_URL_POOLED || env.DATABASE_URL;
if (!rawDatabaseUrl) {
	throw new Error("DATABASE_URL or DATABASE_URL_POOLED must be set");
}
const connectionString = env.DATABASE_URL_POOLED ? rawDatabaseUrl : toNeonPoolerUrl(rawDatabaseUrl);

const adapter = new PrismaPg({ connectionString });

export const prisma = new PrismaClient({ adapter });

