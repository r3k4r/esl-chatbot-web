import type { DashboardOverviewData, LearnerNextStep, LearnerStat } from '~/common/types/dashboard-overview-types'
import { formatMinutes, skillBand } from '~/lib/progress'

const DAY = 86_400_000

/**
 * The one thing worth doing next, in priority order: missed class work, work due within
 * two days, words waiting for review, the rest of today's practice goal. Pure, so it can be
 * unit-tested.
 */
export function learnerNextStep(d: DashboardOverviewData, now = Date.now()): LearnerNextStep {
  const taskLink = (t: { classId: string; id: string }) => `/dashboard/classes/${t.classId}/tasks/${t.id}`
  const missing = d.tasks.filter(t => t.state === 'MISSING')
  if (missing.length) {
    const t = missing[0]!
    return {
      title: missing.length === 1 ? `"${t.title}" is past its deadline` : `${missing.length} tasks are past their deadline`,
      detail: `${t.className}. You can still hand it in.`,
      action: 'Open task',
      to: taskLink(t),
      icon: 'TaskSquare',
    }
  }
  const soon = d.tasks.find(t => t.deadline && new Date(t.deadline).getTime() - now < 2 * DAY)
  if (soon) {
    const hours = Math.max(1, Math.round((new Date(soon.deadline!).getTime() - now) / 3_600_000))
    return {
      title: `"${soon.title}" is due ${hours < 24 ? `in ${hours} h` : 'tomorrow'}`,
      detail: soon.className,
      action: 'Open task',
      to: taskLink(soon),
      icon: 'TaskSquare',
    }
  }
  if (d.vocab.due > 0) {
    return {
      title: `${d.vocab.due} word${d.vocab.due === 1 ? '' : 's'} ready to review`,
      detail: 'A quick review now helps them stick.',
      action: 'Review words',
      to: '/dashboard/vocab',
      icon: 'Book1',
    }
  }
  const left = d.today.dailyGoalMinutes - d.today.minutes
  if (left > 0) {
    return {
      title: d.today.minutes ? `${left} more minutes to reach today's goal` : `Practise ${d.today.dailyGoalMinutes} minutes today`,
      detail: d.today.streak ? `Keep your ${d.today.streak}-day streak going.` : 'A short chat with the AI tutor is enough.',
      action: 'Start a chat',
      to: '/dashboard/chat',
      icon: 'Messages',
    }
  }
  return {
    title: "You reached today's goal",
    detail: 'Anything more is a bonus.',
    action: 'Keep chatting',
    to: '/dashboard/chat',
    icon: 'TickCircle',
  }
}

/** The four stat cards under the greeting, each with what it's measured against. */
export function learnerStats(d: DashboardOverviewData): LearnerStat[] {
  const { vocab, week, skills } = d
  const level = skills.level ?? skills.selfLevel
  return [
    { label: 'Words mastered', value: vocab.mastered.toLocaleString(), sub: `${vocab.total} saved · ${vocab.addedThisWeek} new this week`, icon: 'Book1' },
    { label: 'Practice this week', value: formatMinutes(week.minutes), sub: `Goal ${formatMinutes(week.weeklyGoalMinutes)}`, icon: 'Clock' },
    {
      label: 'Speaking',
      value: skills.speaking ? String(Math.round(skills.speaking)) : '–',
      sub: skills.speaking ? `${skillBand(skills.speaking).label} · ${skills.basedOnSpoken} spoken messages` : 'Try a voice chat to get a score',
      icon: 'Microphone2',
    },
    {
      label: 'Level',
      value: level ?? '–',
      sub: skills.targetLevel ? `Aiming for ${skills.targetLevel}` : skills.level ? 'From your recent chats' : 'Shows after a few chats',
      icon: 'Teacher',
    },
  ]
}

export function useDashboardOverview() {
  const data = ref<DashboardOverviewData | null>(null)
  const loading = ref(false)
  // Kept until the next answer arrives, so a retry keeps the error screen (spinning button) up.
  const error = ref<string | null>(null)

  async function fetchOverview() {
    loading.value = true
    const res = await useHttp<{ success: boolean; data: DashboardOverviewData }>({
      method: 'GET',
      url: '/dashboard/overview',
      requireAuth: true,
      showToast: false,
    })
    if (res.success && res.data?.data) {
      data.value = res.data.data
      error.value = null
    } else {
      error.value = res.message || 'Failed to load your dashboard'
    }
    loading.value = false
  }

  const nextStep = computed(() => (data.value ? learnerNextStep(data.value) : null))
  const stats = computed(() => (data.value ? learnerStats(data.value) : []))

  return { data, loading, error, fetchOverview, nextStep, stats }
}
