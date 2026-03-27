import { Router } from "express";

import * as tabsController from "./tabs.controller.js"
const router= Router();


//POST /tabs:
router.post("/", tabsController.createTab);  //so /tabs/  will now create a tab 
export default router 