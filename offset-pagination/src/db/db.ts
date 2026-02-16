import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config"

const connectionString = process.env.DATABASE_URL!
const adapter = new PrismaPg({ connectionString })

const prisma = new PrismaClient({ adapter })


export default prisma