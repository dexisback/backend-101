import "dotenv/config";
import z from "zod";


const EnvSchema = z.object({
    DATABASE_URL: z.string(),
    ACCESS_TOKEN_SECRET: z.string(),
    ACCESS_TOKEN_EXPIRY: z.string().default("15m"),
    REFRESH_TOKEN_SECRET: z.string(),
    REFRESH_TOKEN_EXPIRY: z.string().default("7d"),
    PORT: z.coerce.number().default(3000)
})


const result = EnvSchema.safeParse(process.env)

if (!result.success) {
    console.error("invalid env variables, didnt pass zod")
    console.error(result.error.format())
    process.exit(1)
}


export const env = result.data