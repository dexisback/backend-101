//this file defines and registers all metrics your app produces

//your app just exposes numbers, and prometheus scrapes them over HTTP

//flow:
//create registry ( promtheus metrics must live inside a registry ). registry = container holding all metrics



//example:
// Registry
//  ├─ buy_requests_total
//  ├─ purchase_failures_total
//  ├─ tickets_remaining
//  └─ buy_request_duration_ms


//prometheus has 4 main metric types:
//counter (totalbuyrequests, totalfailurecontroller, )
// gauge => value that goes up or down (ticketRemainingGauge, )
//histogram => self explanatory. usually , records how long requests take
//prometheus can compute p50,, p95, p99 ( which grafana shows )
// registerMetric . adds metrics into registry



// by doing export { register } your export registry 




import client from "prom-client";
import { buyTicket } from "../app.js";
const register = new client.Registry()   //create registry
client.collectDefaultMetrics({ register })

export const totalBuyRequests = new client.Counter({
    name: "buy_requests_total",
    help: "Total number of buy requests"
})


export const totalPurchaseFailures =  new client.Counter({
    name : "purchase_requests_total",
    help: "Total purchases made"
})




export const ticketsRemainingGauge = new client.Gauge({
    name: "tickets_remaining",
    help : "tickets remaining currently"
})



export const buyRequestDuration = new client.Histogram({
    name : "buy_request_duration_ms",
    help : "duration of buy requests",
    buckets: [5,10,25,59,100,200,500]
})


// -----



register.registerMetric(totalBuyRequests)
register.registerMetric(totalPurchaseFailures)
register.registerMetric(buyRequestDuration)
register.registerMetric(ticketsRemainingGauge)



export { register }



