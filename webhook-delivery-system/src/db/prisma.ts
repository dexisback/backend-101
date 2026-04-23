// gonna be the global prisma instance 
import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../generated/prisma/client.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
	throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaNeon({
	connectionString,
	// Neon serverless config
	max: 10,
	min: 1,
});

export const prisma = new PrismaClient({ adapter });



