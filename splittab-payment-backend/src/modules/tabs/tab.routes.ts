import { Router } from "express";
import { createTab } from "./tab.controller.js";
import { createWriteStream } from "node:fs";

const router = Router();


router.post("/", createTab);


export default router;


