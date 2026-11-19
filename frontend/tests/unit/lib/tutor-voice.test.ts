import { describe, expect, it } from 'vitest'
import { DEFAULT_TUTOR_VOICE, tutorVoiceLabel } from '~/common/data/tutor-voice'

describe('tutor voice label', () => {
  it('names the default and every choice', () => {
    expect(tutorVoiceLabel(DEFAULT_TUTOR_VOICE)).toBe('American · Female')
    expect(tutorVoiceLabel({ accent: 'GB', gender: 'MALE' })).toBe('British · Male')
  })
})
