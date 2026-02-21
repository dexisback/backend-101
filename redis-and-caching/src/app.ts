import {errorMiddleware} from "./middleware/error.middleware.js";
import leaderboderboardRoutes from "./modules/leaderboard/leaderboard.routes.js" //you could import w any name you want
import  express  from "express"

const app = express();


app.use(express.json())
app.use("/leaderboard", leaderboderboardRoutes)
app.use(errorMiddleware)

export default app