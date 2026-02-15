//schema me zod validation hota hai:

import z from "zod";

export const CreatePostSchema = z.object({
    title: z.string().min(1, "Title cannot be empty"),
    author: z.string().min(1, "author cannot be empty"),
    content: z.string().min(1, "content cannot be empty")
})


export const paginationQuerySchema = z.object({
    page: z.coerce.number().min(1, "min page is 1 ofcourse").default(1),
    limit: z.coerce.number().min(1, "limmit cannot preceed 1").default(5)
})


//create types here only asw: 
export type CreatePostSchema=z.infer<typeof CreatePostSchema>
export type paginationQuerySchema=z.infer<typeof paginationQuerySchema>



