// Daily practice goal choices. Saved as weeklyGoalMinutes = minutes a day × 7 (backend range 35-840).
export const DAILY_GOAL_OPTIONS: { minutes: number; label: string }[] = [
  { minutes: 10, label: 'Light' },
  { minutes: 15, label: 'Easy' },
  { minutes: 20, label: 'Steady' },
  { minutes: 30, label: 'Serious' },
  { minutes: 45, label: 'Intense' },
  { minutes: 60, label: 'Full hour' },
]

/** New accounts start at 210 minutes a week. */
export const DEFAULT_WEEKLY_GOAL = 210

export const dailyGoalOf = (weeklyMinutes: number | null | undefined) =>
  Math.round((weeklyMinutes ?? DEFAULT_WEEKLY_GOAL) / 7)
