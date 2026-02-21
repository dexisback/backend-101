import { Router } from "express";
import { leaderboardController } from "./leaderboard.controller.js";
import asyncHandler from "../../utils/asyncHandler.js";

import errorMiddleware from "../../middleware/error.middleware.js";

export const leaderRouter= Router();


leaderRouter.get("/leader/me", asyncHandler(leaderboardController.register));



