import express from "express";
import { authRouter } from "./modules/auth/auth.routes.js";
import { errorMiddleware } from "./middleware/error.middleware.js";


const app = express();
app.use(express.json());

app.use("api", authRouter); //right now, only auth exists 


app.use(errorMiddleware)

export default app ;