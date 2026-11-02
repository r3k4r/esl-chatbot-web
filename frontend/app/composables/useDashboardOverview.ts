import type { DashboardOverviewData, OverviewGoalItem, OverviewHeatmapSession } from '~/common/types/dashboard-overview-types'
import type { StatCard, ChartPoint, HeatWeek, RecentSession, DueWord } from '~/common/types/dashboard-types'

// ── SRS due label ─────────────────────────────────────────────────────────────

function formatDueLabel(srsDue: string): string {
  const diff = new Date(srsDue).getTime() - Date.now()
  if (diff <= 0) return 'now'
  const mins = Math.round(diff / 60_000)
  if (mins < 60) return `in ${mins}m`
  const hrs = Math.round(diff / 3_600_000)
  if (hrs < 24) return `in ${hrs}h`
  const days = Math.round(diff / 86_400_000)
  if (days === 1) return 'tomorrow'
  return `in ${days}d`
}

// ── Relative time label ───────────────────────────────────────────────────────

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.round(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.round(diff / 3_600_000)
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? 's' : ''} ago`
  const days = Math.round(diff / 86_400_000)
  if (days === 1) return 'Yesterday'
  return `${days} days ago`
}

// ── Session meta label ────────────────────────────────────────────────────────

function sessionMetaLabel(s: OverviewHeatmapSession): string {
  if (s.mode === 'VOICE' && s.avgPronunciationScore !== null) {
    return `${s.messageCount} turns · ${s.avgPronunciationScore}% accuracy`
  }
  if (s.avgOverallScore !== null) {
    return `${s.messageCount} turns · ${s.avgOverallScore}%`
  }
  return `${s.messageCount} turns`
}

// ── GoalType → display label ──────────────────────────────────────────────────

const GOAL_TYPE_LABEL: Record<string, string> = {
  VOCABULARY: 'Vocabulary',
  SPEAKING: 'Speaking',
  GRAMMAR: 'Grammar',
  CONVERSATION: 'Conversation',
  STUDY_TIME: 'Study Time',
}

function goalTypeLabel(type: string): string {
  return GOAL_TYPE_LABEL[type] ?? type
}

// ── Main composable ───────────────────────────────────────────────────────────

export function useDashboardOverview() {
  const raw = ref<DashboardOverviewData | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchOverview() {
    loading.value = true
    error.value = null
    try {
      const res = await useHttp<{ success: boolean; message: string; data: DashboardOverviewData }>({
        method: 'GET',
        url: '/dashboard/overview',
        requireAuth: true,
        showToast: false,
      })
      if (res.success && res.data?.data) {
        raw.value = res.data.data
      } else {
        error.value = res.data?.message ?? res.message ?? 'Failed to load dashboard'
      }
    } finally {
      loading.value = false
    }
  }

  // ── GreetingHero props ──────────────────────────────────────────────────────

  const greetingHeroProps = computed(() => {
    const g = raw.value?.greetingHero
    return {
      streak: g?.streak ?? 0,
      doneMins: g?.doneMins ?? 0,
      goalMins: g?.goalMins ?? 25,
    }
  })

  const dueVocabCount = computed(() => raw.value?.greetingHero.dueVocabCount ?? 0)

  // ── StatCards ───────────────────────────────────────────────────────────────

  const statCards = computed((): StatCard[] => {
    const s = raw.value?.statCards
    if (!s) return []

    const practiceHours = s.practiceTimeMinutes < 60
      ? `${s.practiceTimeMinutes}m`
      : `${Math.round(s.practiceTimeMinutes / 60)}h`
    const practiceMonthHours = s.practiceTimeThisMonthMinutes < 60
      ? `${s.practiceTimeThisMonthMinutes}m this month`
      : `${Math.round(s.practiceTimeThisMonthMinutes / 60)}h this month`

    const pronDeltaStr =
      s.pronunciationDelta === null
        ? 'voice sessions only'
        : s.pronunciationDelta >= 0
          ? `+${s.pronunciationDelta}% vs last`
          : `${s.pronunciationDelta}% vs last`

    const levelLabel = s.currentLevel ?? '—'
    const nextCefr = getNextCefr(s.currentLevel)
    const levelDelta = nextCefr ? `${100 - s.levelPct}% to ${nextCefr}` : 'max level'

    return [
      {
        label: 'Words mastered',
        value: s.wordsMastered.toLocaleString(),
        delta: `+${s.wordsMasteredWeekDelta} this week`,
        icon: 'Book1',
      },
      {
        label: 'Practice time',
        value: practiceHours,
        delta: practiceMonthHours,
        icon: 'Clock',
      },
      {
        label: 'Pronunciation',
        value: `${s.pronunciationScore}%`,
        delta: pronDeltaStr,
        icon: 'Microphone',
      },
      {
        label: 'Current level',
        value: levelLabel,
        delta: levelDelta,
        icon: 'Star1',
      },
    ]
  })

  function getNextCefr(level: string | null): string | null {
    const order = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
    if (!level) return null
    const idx = order.indexOf(level.toUpperCase())
    if (idx === -1 || idx === order.length - 1) return null
    return order[idx + 1] ?? null
  }

  // ── VocabChart ──────────────────────────────────────────────────────────────

  const vocabChartPoints = computed((): ChartPoint[] => {
    return (raw.value?.vocabChart.points ?? []).map((p) => ({
      label: p.label,
      value: p.value,
    }))
  })

  const vocabChartTotal = computed(() => raw.value?.vocabChart.totalWords ?? 0)

  const vocabChartGrowth = computed(() => {
    const pct = raw.value?.vocabChart.growthPct ?? 0
    if (pct === 0) return '+0%'
    return pct > 0 ? `+${pct}%` : `${pct}%`
  })

  // ── NextUp (Goals) ──────────────────────────────────────────────────────────

  const nextUpPrimary = computed(() => {
    const g = raw.value?.nextUp.primary
    if (!g) return null
    return adaptGoal(g)
  })

  const nextUpOthers = computed(() => {
    return (raw.value?.nextUp.others ?? []).map(adaptGoal)
  })

  function adaptGoal(g: OverviewGoalItem) {
    return {
      title: g.description,
      tag: goalTypeLabel(g.type),
      minutes: 15, // placeholder until Lesson model exists
      level: g.difficulty ?? 'MEDIUM',
      icon: goalIcon(g.type),
    }
  }

  function goalIcon(type: string): string {
    const map: Record<string, string> = {
      VOCABULARY: 'Book1',
      SPEAKING: 'Microphone',
      GRAMMAR: 'Teacher',
      CONVERSATION: 'Messages',
      STUDY_TIME: 'Clock',
    }
    return map[type] ?? 'Flag'
  }

  // ── ActivityHeatmap ─────────────────────────────────────────────────────────

  const heatData = computed((): HeatWeek[] => {
    return raw.value?.activityHeatmap.weeks ?? []
  })

  const activePct = computed(() => raw.value?.activityHeatmap.activePct ?? 0)

  const recentSessions = computed((): RecentSession[] => {
    return (raw.value?.activityHeatmap.recentSessions ?? []).map((s) => ({
      type: s.mode === 'VOICE' ? 'Voice' : 'Chat',
      topic: s.topic ?? 'Untitled session',
      time: formatRelativeTime(s.startedAt),
      meta: sessionMetaLabel(s),
      icon: s.mode === 'VOICE' ? 'Microphone' : 'Messages',
    }))
  })

  // ── DueWords ────────────────────────────────────────────────────────────────

  const dueWords = computed((): DueWord[] => {
    return (raw.value?.dueWords.words ?? []).map((w) => ({
      word: w.word,
      meaning: w.definition,
      due: formatDueLabel(w.srsDue),
    }))
  })

  const totalDue = computed(() => raw.value?.dueWords.totalDue ?? 0)

  const levelPct = computed(() => raw.value?.dueWords.levelPct ?? 0)

  return {
    loading,
    error,
    fetchOverview,
    // GreetingHero
    greetingHeroProps,
    dueVocabCount,
    // StatCards
    statCards,
    // VocabChart
    vocabChartPoints,
    vocabChartTotal,
    vocabChartGrowth,
    // NextUp
    nextUpPrimary,
    nextUpOthers,
    // ActivityHeatmap
    heatData,
    activePct,
    recentSessions,
    // DueWords
    dueWords,
    totalDue,
    levelPct,
  }
}
