import { z } from 'zod'

export const taskFormSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200, 'Title must be at most 200 characters'),
  description: z.string().trim().min(1, 'Instructions are required').max(5000, 'Instructions must be at most 5000 characters'),
  deadline: z.string().nullish(),
})
export type TaskFormValues = z.infer<typeof taskFormSchema>

export const feedbackSchema = z.object({
  feedback: z.string().trim().min(1, 'Feedback is required').max(5000, 'Feedback must be at most 5000 characters'),
})
export type FeedbackValues = z.infer<typeof feedbackSchema>
