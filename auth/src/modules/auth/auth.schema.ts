//modules is our boundary of backend, so har jagah zod ka kaam hoga and shi:

import z from "zod";

export const registerSchema = z.object({
    email: z.string().email("invalid email format"),
    password: z.string().min(6, "password must be atleast 6 characters"),
    name: z.string().min(2, "name cannot be empty")
})

export const loginSchema = z.object({
    email: z.string().email("invalid email format"),
    password: z.string().min(1, "must enter password")
})

//logging out would only need a refreshtoken from the user's side:
export const logoutSchema=z.object({
    refreshToken: z.string().min(1, "refresh token is required")
})


//refresh type validation:
//make types out of this:
export type registerSchema = z.infer<typeof registerSchema>
export type loginSchema = z.infer<typeof loginSchema>
export type logoutSchema = z.infer<typeof logoutSchema>