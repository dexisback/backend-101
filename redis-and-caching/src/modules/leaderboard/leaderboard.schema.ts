import z from "zod";

//dont need no leaderboardshcmea 
export const QuerySchema = z.object({
    limit: z.coerce.number().max(100, "cannot exceed 100 limit").gt(0).default(10)
})

export type querySchema = z.infer<typeof QuerySchema>
