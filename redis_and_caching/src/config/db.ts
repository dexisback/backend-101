
import'dotenv/config'
import {PrismaClient }from'../../generated/prisma/client.js'
import {PrismaNeon }from'@prisma/adapter-neon'

// Initialize the adapter
const adapter=new PrismaNeon({
connectionString:process.env.DATABASE_URL!,
})

console.log("DATABASE_URL =",process.env.DATABASE_URL)

// Pass the adapter to the Prisma Client
export const prisma=new PrismaClient({adapter })
