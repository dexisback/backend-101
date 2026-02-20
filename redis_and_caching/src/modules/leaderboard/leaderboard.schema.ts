import z from "zod";
export const LeaderboardSchema = z.object({
    //leaderboard contains id, username, score, createdAt
    id: z.coerce.string(),
    username: z.string().min(2,"min length 2"),
    score: z.number().min(1, "min score in 1 digit should be").gt(0) //positive scores only allowed 
})



export type leaderboardSchema = z.infer<typeof LeaderboardSchema>

