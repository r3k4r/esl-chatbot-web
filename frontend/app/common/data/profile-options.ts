// Choices on the profile page (values match the backend's users.schema.ts enums).
export const CEFR_LEVELS: { value: string; label: string }[] = [
  { value: 'A1', label: 'A1 · Beginner' },
  { value: 'A2', label: 'A2 · Elementary' },
  { value: 'B1', label: 'B1 · Intermediate' },
  { value: 'B2', label: 'B2 · Upper intermediate' },
  { value: 'C1', label: 'C1 · Advanced' },
  { value: 'C2', label: 'C2 · Mastery' },
]

export const AI_PERSONALITIES: { value: string; label: string }[] = [
  { value: 'FRIENDLY', label: 'Friendly' },
  { value: 'ENCOURAGING', label: 'Encouraging' },
  { value: 'PATIENT', label: 'Patient' },
  { value: 'CASUAL', label: 'Casual' },
  { value: 'FORMAL', label: 'Formal' },
  { value: 'STRICT', label: 'Strict' },
]

export const optionLabel = (options: { value: string; label: string }[], value: string | null | undefined) =>
  options.find((o) => o.value === value)?.label ?? null
