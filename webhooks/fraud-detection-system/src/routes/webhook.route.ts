// this will expose /webhook/:provider
// forwards request to controller files
import express from "express"
import {webhookHandler} from "../controllers/webhook.controller.js"

const router = express.Router();

//raw body parser:

router.post("/:provider", express.raw({type: "/*"}), webhookHandler)

export default router;
