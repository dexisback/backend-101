import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

//create a prisma object
import {prisma} from "./src/config/db.js"

async function main(){
    console.log("seeding database..");

    //delete the exsiting codes:
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();

    const hashedPassword = await bcrypt.hash("password86239", 10);
    for(let i=0; i<=20; i++){
        await prisma.user.create({
            data:{
                email: `user${i}@seed.com`,
                password: hashedPassword,
                name: `User${i}`

            }
        })
        console.log("seeded 20 users with hashed password: password86239")
    }
}


main()
    .catch((e:any) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })