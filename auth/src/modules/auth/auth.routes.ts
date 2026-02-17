import { Router } from "express";
import { AuthController } from "./auth.controller.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { authMiddleWare } from "../../middleware/auth.middleware.js";
export const authRouter = Router();
//will add more w more features, right now only module is auth


authRouter.post("/auth/register", asyncHandler(AuthController.register))
authRouter.post("/auth/login", asyncHandler(AuthController.login))
authRouter.post("/auth/refresh", asyncHandler(AuthController.refresh))
authRouter.post("/auth/logout", authMiddleWare, asyncHandler(AuthController.logout))