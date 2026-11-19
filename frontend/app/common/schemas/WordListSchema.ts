import { z } from 'zod'

const MAX_WORDS = 30

const wordRow = z.object({
  id: z.string(),
  locked: z.boolean().optional(),
  word: z.string().trim().min(1, 'Type the word').max(100, 'At most 100 characters'),
  definition: z.string().trim().min(1, 'Write what it means, or use Fill meanings with AI').max(500, 'At most 500 characters'),
  example: z.string().max(500, 'At most 500 characters'),
  partOfSpeech: z.string(),
})

const words = z
  .array(wordRow)
  .min(1, 'Add at least one word')
  .max(MAX_WORDS, `Up to ${MAX_WORDS} words per list`)
  .superRefine((rows, ctx) => {
    const seen = new Set<string>()
    rows.forEach((r, i) => {
      const key = r.word.trim().toLowerCase()
      if (key && seen.has(key)) ctx.addIssue({ code: 'custom', path: [i, 'word'], message: 'This word is already in the list' })
      seen.add(key)
    })
  })

/**
 * Assign or edit a class word list. `studentCount` is the class's students when assigning;
 * null when editing (the list already has its students).
 */
export function wordListSchema(studentCount: number | null) {
  const base = z.object({
    // Optional: without a name the words are given on their own.
    title: z.string().trim().max(80, 'At most 80 characters'),
    words,
    mode: z.enum(['ALL', 'ONLY', 'EXCEPT']),
    picked: z.array(z.string()),
  })
  if (studentCount === null) return base
  return base.superRefine((v, ctx) => {
    if (v.mode === 'ONLY' && !v.picked.length) ctx.addIssue({ code: 'custom', path: ['picked'], message: 'Tick at least one student' })
    if (v.mode === 'EXCEPT' && v.picked.length >= studentCount) ctx.addIssue({ code: 'custom', path: ['picked'], message: 'Leave at least one student in' })
    if (studentCount === 0) ctx.addIssue({ code: 'custom', path: ['picked'], message: 'This class has no students yet' })
  })
}

export type WordListFormValues = z.infer<ReturnType<typeof wordListSchema>>
export const WORD_LIST_MAX = MAX_WORDS
