import type { StudentTaskState } from '~/common/types/class-types'

// Plain-language labels for progress numbers, so teachers read a word before a score.

export type Tone = 'active' | 'blocked' | 'expired' | 'inactive'

/** A 0–100 skill score as a band. null/0 = no data, not a bad score. */
export function skillBand(score: number | null | undefined): { label: string; tone: Tone } {
  if (!score) return { label: 'No data yet', tone: 'inactive' }
  if (score >= 85) return { label: 'Strong', tone: 'active' }
  if (score >= 70) return { label: 'Good', tone: 'active' }
  if (score >= 50) return { label: 'Developing', tone: 'blocked' }
  return { label: 'Needs work', tone: 'expired' }
}

/**
 * Whole calendar days from `from` to `to` in the viewer's local time — counted the way
 * people do (Thu → Sat is 2 days, whatever the hours). Every "x days ago / in x days"
 * label uses this so two screens never disagree by one.
 */
export function calendarDays(from: Date | string, to: Date | string = new Date()): number {
  const a = new Date(from); a.setHours(0, 0, 0, 0)
  const b = new Date(to); b.setHours(0, 0, 0, 0)
  return Math.round((b.getTime() - a.getTime()) / 86_400_000) // round: DST days are 23/25 h
}

/** "today", "yesterday", "3 days ago", "5 weeks ago" */
export function daysAgo(iso: string | null | undefined): string {
  if (!iso) return 'never'
  const days = calendarDays(iso)
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 14) return `${days} days ago`
  if (days < 60) return `${Math.round(days / 7)} weeks ago`
  return `${Math.round(days / 30)} months ago`
}

/** Practised more than a week ago (or never) = worth a teacher's attention. */
export const isInactive = (iso: string | null | undefined) =>
  !iso || Date.now() - new Date(iso).getTime() > 7 * 86_400_000

export const taskStateLabel: Record<StudentTaskState, { label: string; tone: Tone }> = {
  REVIEWED: { label: 'Reviewed', tone: 'active' },
  HANDED_IN: { label: 'Handed in', tone: 'active' },
  LATE: { label: 'Handed in late', tone: 'blocked' },
  MISSING: { label: 'Missing', tone: 'expired' },
  ASSIGNED: { label: 'Assigned', tone: 'inactive' },
  CLOSED: { label: 'Closed', tone: 'inactive' },
}

export const toneStyle = (tone: Tone) => `background:var(--status-${tone}-bg);color:var(--status-${tone}-text)`

/** "1 teacher", "3 teachers" — never "1 teachers". */
export const plural = (n: number, word: string, many = `${word}s`) => `${n.toLocaleString()} ${n === 1 ? word : many}`

export function formatMinutes(mins: number): string {
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60)
  return mins % 60 ? `${h} h ${mins % 60} min` : `${h} h`
}
