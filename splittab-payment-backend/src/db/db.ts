//single instance of prisma for the entire app
import { PrismaClient } from "@prisma/client/extension";

const globalForPrisma = global as unknown as {
    prisma: PrismaClient;
}



export const prisma = globalForPrisma.prisma



