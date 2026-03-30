import z from "zod";

export const githubPushEventSchema = z.object({
    type: z.literal("github.push"),
    payload: z.object({
        repo: z.string().min(1),
        commitId: z.string().min(1),
        branch: z.string().min(1),
        author: z.string().min(1)
    })
})


export const eventSchema = z.discriminatedUnion("type", [githubPushEventSchema])

export type Event = z.infer<typeof eventSchema>
