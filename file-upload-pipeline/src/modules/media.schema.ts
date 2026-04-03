import z from "zod";

export const profilePictureUploadSchema = z.object({
    body: z.object({
        imageType: z.enum(["profile", "cover"]).default("profile")
        //NOTE: if we werent using auth middleware, we would need to pass a userId over here
    })
})


