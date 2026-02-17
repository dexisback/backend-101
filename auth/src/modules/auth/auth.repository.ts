//all db queries for auth live here. nothing else
//basically prisma logic , crud prisma
//every auth related feature (hence feature based) lives here
import prisma from "../../config/db.js";
import type { registerSchema } from "./auth.schema.js";

export const authRepository = {
    //creating a new user:
    async createUser(data: registerSchema & { password: string }){
        return await prisma.user.create({
            data: {
                email: data.email,
                password: data.password,
                name: data.name
            }
        })
    },
    //find user by their email
    async findUserByEmail(email: string){
        return await prisma.user.findUnique({
            where: {email}
        })
    },

    //find user by id:
    async findUserById(id: string){
        return await prisma.user.findUnique({
            where: {id}
        })
    }
,
    //create refresh token
    async createRefreshToken(userId: string, token:string, expiresAt: Date){
        return await prisma.refreshToken.create({
            data: {
                token, 
                userId,
                expiresAt
            }
        })
    },

    //find refresh token existing
    async findRefreshToken(token: string){
        return await prisma.refreshToken.findUnique({
            where: {token},
            include: {user: true} //fetches the related user too
            //include user because to generate an access token, you usually do jwt.sign(id: user.id, email: user.email, role: user.role). So you NEED the user
        })
    },

    //delete refresh token (when user clicks logout)
    async deleteRefreshToken(token: string){
        return await prisma.refreshToken.delete({
            where:  {token}
            //cascading is done in schema.prisma itself
        })
    }

}