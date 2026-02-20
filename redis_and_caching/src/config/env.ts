import "dotenv/config";
import z from "zod";



const envSchema= z.object({
    DATABASE_URL: z.string().url(),
    REDIS_URL : z.string().url(),
    PORT: z.coerce.number().default(3000)
})


const result = envSchema.safeParse(process.env);


if(!result.success){
    console.error("invalid env variables, didnt pass zod");
    console.error(result.error.format())
    process.exit(1)
}

//else:
export const env = result.data

