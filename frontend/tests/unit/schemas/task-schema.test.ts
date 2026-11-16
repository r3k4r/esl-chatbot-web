import { describe, it, expect } from 'vitest'
import { taskFormSchema, taskSubmissionSchema, feedbackSchema } from '~/common/schemas/TaskSchema'

describe('taskFormSchema', () => {
  it('accepts a title and description with an optional deadline', () => {
    expect(taskFormSchema.safeParse({ title: 'Essay', description: 'Write 200 words' }).success).toBe(true)
    expect(taskFormSchema.safeParse({ title: 'Essay', description: 'x', deadline: '2026-12-01' }).success).toBe(true)
  })

  it('trims before checking required fields', () => {
    const r = taskFormSchema.safeParse({ title: '   ', description: '   ' })
    expect(r.success).toBe(false)
    expect(r.error?.issues.map((i) => i.message)).toEqual(['Title is required', 'Description is required'])
  })

  it('caps title at 200 and description at 5000 characters', () => {
    expect(taskFormSchema.safeParse({ title: 'x'.repeat(200), description: 'x'.repeat(5000) }).success).toBe(true)
    expect(taskFormSchema.safeParse({ title: 'x'.repeat(201), description: 'ok' }).success).toBe(false)
    expect(taskFormSchema.safeParse({ title: 'ok', description: 'x'.repeat(5001) }).success).toBe(false)
  })
})

describe('taskSubmissionSchema', () => {
  it('accepts written work alone', () => {
    expect(taskSubmissionSchema.safeParse({ content: 'My answer' }).success).toBe(true)
  })

  it('accepts a file link alone', () => {
    expect(taskSubmissionSchema.safeParse({ fileUrl: 'https://drive.example.com/doc' }).success).toBe(true)
  })

  it('requires one of content or fileUrl', () => {
    const r = taskSubmissionSchema.safeParse({ content: '  ', fileUrl: '' })
    expect(r.success).toBe(false)
    expect(r.error?.issues[0]?.message).toBe('Provide written work or a file link')
    expect(r.error?.issues[0]?.path).toEqual(['content'])
  })

  it.each(['ftp://files.example.com/a', 'javascript:alert(1)', 'drive.example.com'])('rejects non-http link %j', (fileUrl) => {
    expect(taskSubmissionSchema.safeParse({ content: 'x', fileUrl }).success).toBe(false)
  })
})

describe('feedbackSchema', () => {
  it('requires non-blank feedback up to 5000 characters', () => {
    expect(feedbackSchema.safeParse({ feedback: 'Great work' }).success).toBe(true)
    expect(feedbackSchema.safeParse({ feedback: '   ' }).success).toBe(false)
    expect(feedbackSchema.safeParse({ feedback: 'x'.repeat(5001) }).success).toBe(false)
  })
})
