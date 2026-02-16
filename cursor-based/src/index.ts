import express from "express";
import { activityRouter } from "./routes/activity.routes.js";



const app=express();
app.use(express.json())

app.get("/test", (req, res) => {
    res.json({ message: "test route works" });
});

app.use("/", activityRouter)

app.listen(3000, ()=>{
    console.log(`up and runnning`)
})

