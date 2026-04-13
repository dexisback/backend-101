import { Router } from "express";
import { paymentLinkCreator } from "./split.controller.js";

const router = Router();

router.post("/:splitId/pay", paymentLinkCreator)


export default router;





