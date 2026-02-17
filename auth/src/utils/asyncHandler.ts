
//re
import type { Request, Response, NextFunction } from "express";
import type { loginSchema, registerSchema } from "../modules/auth/auth.schema.js";
import { authRepository } from "../modules/auth/auth.repository.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { env } from "../config/env.js";
type AsyncFunction = (
    req: Request,
    res: Response,
    next: NextFunction
) => Promise<any>


export const asyncHandler = (fn: AsyncFunction) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next).catch(next))
    }
}

export const authService = {
    //register a new user:
    //register schema: email, password, mail
    async register(data: registerSchema) {
        const existingUserCheck = await authRepository.findUserByEmail(data.email);
        if (existingUserCheck) {
            throw new Error("user with email already exist")   //⚠️but shouldnt the code throw this to utils, or middleware for error handling?
        }
        //else, hash the password:
        const hashedPassword = await bcrypt.hash(data.password, 10)
        //create a user in db:
        const user = await authRepository.createUser({
            ...data,
            password: hashedPassword
            //include everything in data, but replace pass in it w our hashed password
        })

        //dont return the password, remove it from the user object:
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword
    },

    //login a user:
    async login(data: loginSchema) {
        //fond user by email
        const user = await authRepository.findUserByEmail(data.email)
        if (!user) {
            throw new Error("invalid email or password");
        }
        //compare passwords:
        const passwordComparingVar = await bcrypt.compare(data.password, user.password)  //since we removed the password from the userWithoutPassword, gotta use OG user, and thats why you use destructuring rest, and NOT delete
        if (!passwordComparingVar) {
            throw new Error("creds dont match , try again")
        }


        //generate tokens:
        const accessToken = jwt.sign(
            { userId: user.id },
            env.ACCESS_TOKEN_SECRET,
            { expiresIn: env.ACCESS_TOKEN_EXPIRY as any }
        )

        const refreshToken = jwt.sign(
            { userId: user.id },
            env.REFRESH_TOKEN_SECRET,
            { expiresIn: env.REFRESH_TOKEN_EXPIRY as any }
        )

        //store refresh token in db:
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) //expires in 7 days:
        await authRepository.createRefreshToken(user.id, refreshToken, expiresAt)

        //return tokens and user:
        const { password, ...userWithoutPassword } = user
        return {
            accessToken,
            refreshToken,
            user: userWithoutPassword
        }
    },


    //refresh access token: 
    async refresh(token: string) {
        let payload: any
        try {
            payload = jwt.verify(token, env.REFRESH_TOKEN_SECRET)
        } catch (err) {
            throw new Error("invalid or expired refresh token")
        }

        //check if the tokens exist in db:
        const storedToken = await authRepository.findRefreshToken(token);
        if (!storedToken) {
            throw new Error("refresh token not found")
        }

        //check if token is expired:
        if (new Date() > storedToken.expiresAt) {
            await authRepository.deleteRefreshToken(token);
            throw new Error("token expired, its been too long")
        }

        //and then generate new access token:
        const newAccessToken = jwt.sign({ userId: payload.userId }, env.ACCESS_TOKEN_SECRET, { expiresIn: env.ACCESS_TOKEN_EXPIRY as any })
        return { accessToken: newAccessToken }
    },

    //logout a user:
    async logout(token: string) {
        await authRepository.deleteRefreshToken(token);
        return { message: "logged out succesfully" }
    },


    //get user by id:
    async getUserById(userId: string) {
        const user = await authRepository.findUserById(userId)
        if (!user) {
            throw new Error("user not found")
        }
        const { password, ...userWithoutPassword } = user
        return userWithoutPassword
    }
}