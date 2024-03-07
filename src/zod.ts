import z from 'zod';

export const signupSchema = z.object({
    username: z.string(),
    name: z.string().optional(),
    email: z.string(),
    password: z.string().min(8),
})
// type export from zod for frontend use 
export type Signup = z.infer<typeof signupSchema>;
