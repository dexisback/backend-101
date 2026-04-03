import z from "zod";
import dotenv from "dotenv"

dotenv.config();


const envSchema = z.object({
    PORT: z.string().default("3000"),
    DATABASE_URL: z.string().url(),
    CLOUDINARY_CLOUD_NAME : z.string(),
    CLOUDINARY_API_KEY: z.string(),
    CLOUDINARY_API_SECRET: z.string()
})

//safeparse right here in itself:
const enveed = envSchema.safeParse(process.env);

if(!enveed.success){
    console.error(`invalid environment variables`, enveed.error.flatten())
}

export const env = enveed.data;

