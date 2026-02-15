import express from "express";
import { postRouter } from "./routes/post.routes.js";

const app = express();
app.use(express.json());
app.use(postRouter);


app.listen(3000, ()=>{
         console.log(`up and running`);
})