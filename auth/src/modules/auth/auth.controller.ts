//this is where HTTP request meet your auth logic. each function handles one route:



import type { Request, Response } from "express";
import { authService } from "../../utils/asyncHandler.js";
import { registerSchema, loginSchema, logoutSchema } from "./auth.schema.js";
import { ApiResponse } from "../../utils/apiResponse.js";

export const AuthController = {
    //POST: /auth/register:
    async register(req: Request, res: Response) {
        const result = registerSchema.safeParse(req.body);
        if (!result.success) {
            //this is where the utils will come in focking handy:
            res.status(400).json(ApiResponse.error("invalid input", 400))
            return
        }

        const user = await authService.register(result.data)
        res.status(201).json(ApiResponse.success(user, "user registered succesfully"));


        //POST: /auth/login:
    },
    async login(req: Request, res: Response) {
        const result = loginSchema.safeParse(req.body);
        if (!result.success) {
            res.status(400).json(ApiResponse.error("invalid input", 400))
            return
        }

        const data = await authService.login(result.data);
        res.json(ApiResponse.success(data, "logged in succesfully :)"))
    },

    //POST : /auth/logout:
    async logout(req: Request, res: Response) {
        // const { refreshToken } = req.body; //wrong approach, not used zod validation earlier
        const data = logoutSchema.safeParse(req.body);

        if (!data.success) {
            res.status(400).json(ApiResponse.error("Refresh Token required", 400));
            return
        }

        const result = await authService.logout(data.data.refreshToken);
        res.json(ApiResponse.success(result, "logged out succesfully"));

    },

    //POST /auth/refresh:
    async refresh(req: Request, res: Response) {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            res.status(400).json(ApiResponse.error("Reffresh token required", 400))
            return
        }

        const result = await authService.logout(refreshToken);
        res.json(ApiResponse.success(result));






    },
    //GET: /me (protected route):
    async me(req: Request, res: Response) {
        // @ts-ignore                  (will add userId to req in auth middleware)
        const userId = req.userId;
        const user = await authService.getUserById(userId)
        res.json(ApiResponse.success(user));
    }


}