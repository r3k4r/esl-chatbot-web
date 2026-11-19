import type { TutorAccent, TutorVoiceChoice, TutorVoiceGender } from '~/common/types/profile-types'

// The tutor's voice choices (backend: modules/ai/voices.ts). American female is the default.
export const DEFAULT_TUTOR_VOICE: TutorVoiceChoice = { accent: 'US', gender: 'FEMALE' }

export const TUTOR_ACCENTS: { value: TutorAccent; label: string; hint: string }[] = [
  { value: 'US', label: 'American', hint: 'color, apartment, vacation' },
  { value: 'GB', label: 'British', hint: 'colour, flat, holiday' },
]

export const TUTOR_VOICES: { value: TutorVoiceGender; label: string }[] = [
  { value: 'FEMALE', label: 'Female' },
  { value: 'MALE', label: 'Male' },
]

export function tutorVoiceLabel(v: TutorVoiceChoice): string {
  const accent = TUTOR_ACCENTS.find((a) => a.value === v.accent)?.label ?? 'American'
  const gender = TUTOR_VOICES.find((g) => g.value === v.gender)?.label ?? 'Female'
  return `${accent} · ${gender}`
}
