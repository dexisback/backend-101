//fetches the template (from redis or disk) > compiles it > and injects the variables in it

import fs from "fs/promises"
import path from "path"
import Handlebars from "handlebars"
import redisClient from "../config/redis.js"
import { fileURLToPath } from "url"

export const templateRenderer = async(eventType: string, payload: any) : Promise<string>=>{
    const redisKey = `template${eventType}`;
    let rawTemplateFromRedis :(string | null) = null;
    let rawTemplateFromDisk :(string | null) = null;

    try {
        rawTemplateFromRedis = await redisClient.get(redisKey); //first priority : we get raw template from redis
        let finalTemplate = rawTemplateFromRedis

        if(!rawTemplateFromRedis) {
            const __filename = fileURLToPath(import.meta.url);
            const __dirname = path.dirname(__filename);
            const eventTemplatePath = path.join(__dirname, `../templates/${eventType}.hbs`);
            const fallbackTemplatePath = path.join(__dirname, "../templates/template.html");

            try {
                rawTemplateFromDisk = await fs.readFile(eventTemplatePath, "utf-8");
            } catch {
                rawTemplateFromDisk = await fs.readFile(fallbackTemplatePath, "utf-8");
            }

            await redisClient.setex(redisKey, 86400, rawTemplateFromDisk) //also set it in redis for the next 24 hours
            finalTemplate = rawTemplateFromDisk
        }

        const compiledTemplate = Handlebars.compile(finalTemplate)
        const finalHTML = compiledTemplate(payload);
        if(typeof finalHTML === "undefined"){throw new Error("undefined html template in template engine ")}
        return finalHTML;
    
    } catch (err) {
        console.error(err, "template engine error")
        throw err; // re-throw to satisfy return type
    }
}


