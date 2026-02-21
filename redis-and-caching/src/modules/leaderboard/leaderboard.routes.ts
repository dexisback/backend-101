import { Router } from "express";
import { leaderboardController } from "./leaderboard.controller.js";
import {asyncHandler} from "../../utils/asyncHandler.js";


export const leaderRouter= Router();


leaderRouter.get("/", asyncHandler(leaderboardController.top));
export default leaderRouter





