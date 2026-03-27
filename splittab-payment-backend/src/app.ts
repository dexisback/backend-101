import { Router } from "express";
import tabsRoutes from "./modules/tabs/tabs.routes.js"

const router = Router();

//----


router.use("/tabs", tabsRoutes);
export default router;
