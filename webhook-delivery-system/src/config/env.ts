import dotenv from "dotenv"

dotenv.config();


function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`${name} is not set`);
    }
    return value;
}


export const env= {
    PORT: process.env.PORT || 3000,
    DATABASE_URL: requireEnv("DATABASE_URL"),
    REDIS_URL: requireEnv("REDIS_URL"),
}



//env config
