import { Router } from "express";
import { createTab, quoteTabSplits } from "./tab.controller.js";

const router = Router();

router.post("/quote", quoteTabSplits);
router.post("/", createTab);


export default router;


