import dotenv from "dotenv"

dotenv.config();


function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`${name} is not set`);
    }
    return value;
}

function optionalInt(name: string, fallback: number): number{
    const raw = process.env[name];
    if(!raw || raw.trim() === "") return fallback
    const parsed = Number(raw);
    if(!Number.isFinite(parsed)|| !Number.isInteger(parsed) || parsed < 0){
        throw new Error(`${name} must be a non negative integer`)
    }    
    return parsed
}


export const env= {
    PORT: process.env.PORT || 3000,
    DATABASE_URL: requireEnv("DATABASE_URL"),
    REDIS_URL: requireEnv("REDIS_URL"),

    //backpressure: rate limit
    DEFAULT_LANE_RPS: optionalInt("DEFAULT_LANE_RPS", 20),
    CRITICAL_LANE_RPS: optionalInt("CRITICAL_LANE_RPS", 50),

    //backpressure: ingress backlog guard (rejects /emit endpoint when queue length is too deep)
    DEFAULT_MAX_BACKLOG: optionalInt("DEFAULT_MAX_BACKLOG", 2000),
    CRITICAL_MAX_BACKLOG: optionalInt("CRITICAL_MAX_BACKLOG", 5000),

    //DLQ retention
    DLQ_REMOVE_ON_COMPLETE_COUNT: optionalInt("DLQ_REMOVE_ON_COMPLETE_COUNT", 1000),
}


//env config
