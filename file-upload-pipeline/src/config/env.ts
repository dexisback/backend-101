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

// Validate once at startup and fail fast if invalid.
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
    console.error("Invalid environment variables", parsedEnv.error.flatten());
    throw new Error("Invalid environment variables");
}

export const env = parsedEnv.data;

