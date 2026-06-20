import { z } from 'zod'

export const createChapterSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .min(2, 'Title must be at least 2 characters')
    .max(150, 'Title must be less than 150 characters'),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .nullable(),
})

export type CreateChapterFormValues = z.infer<typeof createChapterSchema>

export const createSubSubjectSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .min(2, 'Title must be at least 2 characters')
    .max(150, 'Title must be less than 150 characters'),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .nullable(),
})

export type CreateSubSubjectFormValues = z.infer<typeof createSubSubjectSchema>

export const createLectureSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .min(2, 'Title must be at least 2 characters')
    .max(200, 'Title must be less than 200 characters'),
  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional()
    .nullable(),
  is_preview: z.boolean().default(false),
})

export type CreateLectureFormValues = z.infer<typeof createLectureSchema>