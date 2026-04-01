import crypto from "crypto";

export function generateHmac(secret: string, payload: any){
    const body = JSON.stringify(payload)
    return crypto.createHmac("sha256", secret).update(body).digest("hex")
}

