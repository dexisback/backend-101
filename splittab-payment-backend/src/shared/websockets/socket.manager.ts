import { Server as HttpServer } from "node:http";
import { Server, Socket } from "socket.io";
import { redisSubscriber } from "../../config/redis.js";

let io: Server;

export const initWebSocketServer = (server: HttpServer) => {
    io= new Server(server, {
        cors: { origin: "*" } //TODO: update this to my frontend url in production ⚠️⚠️⚠️  
    })
    io.on("connection", (socket: Socket)=>{
        console.log(`client connected with socket id -> ${socket.id}`)
        
        socket.on("joinTab", (tabId: string)=> {  
            socket.join(tabId)
            console.log(`Client with socketId -> ${socket.id} joined tab with tabId -> ${tabId}`)

        })
        socket.on("disconnect", ()=>{
            console.log(`client disconnected with socketId -> ${socket.id} disconnected`)
        })
    })
    //listen for internal redis events from the webhook worker:
    redisSubscriber.subscribe("payment_updates")
    redisSubscriber.on("message", (channel, message)=>{
        const data = JSON.parse(message);
        io.to(data.tabId).emit("splitUpdated", data)
    })
}