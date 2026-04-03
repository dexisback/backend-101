import express from "express";
import type { Request, Response, Application } from "express";

const app: Application = express();


app.use(express.json({limit: "10kb"}));

app.use(express.urlencoded({ extended: true, limit: "10kb"}))  //idk man, funnily enough i learnt this loc in my web dev class in college(they teach ajax and jquery)



app.get("/health", (req: Request, res: Response)=>{
    res.status(200).json({
        status: "OK",
        message: "alive"
    })
})

//TODO: routes
//global error handler


export default app;
