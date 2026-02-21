import { Router } from "express";
import { leaderboardController } from "./leaderboard.controller.js";
import {asyncHandler} from "../../utils/asyncHandler.js";


export const leaderRouter= Router();


leaderRouter.get("/", asyncHandler(leaderboardController.top));

//new: 
leaderRouter.post("/", asyncHandler(leaderboardController.create))
leaderRouter.patch("/:id", asyncHandler(leaderboardController.update))
leaderRouter.delete("/:id", asyncHandler(leaderboardController.delete))


export default leaderRouter


