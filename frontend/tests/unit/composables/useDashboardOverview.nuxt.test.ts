import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { mockFetch, ok, fail } from '../helpers/fetch-mock'
import { overviewFixture, FIXTURE_NOW } from '../../fixtures/overview'
import { learnerNextStep, learnerStats } from '~/composables/useDashboardOverview'
import type { DashboardOverviewData, LearnerTask } from '~/common/types/dashboard-overview-types'

const base = () => useRuntimeConfig().public.baseUrl as string
const NOW = FIXTURE_NOW.getTime()
const hours = (h: number) => new Date(NOW + h * 3_600_000).toISOString()
const task = (over: Partial<LearnerTask>): LearnerTask => ({ id: 't9', classId: 'c1', className: 'B1', title: 'Essay', deadline: null, state: 'ASSIGNED', ...over })
const withData = (over: Partial<DashboardOverviewData>): DashboardOverviewData => ({ ...overviewFixture, ...over })

describe('learnerNextStep', () => {
  it('puts missed class work first', () => {
    const s = learnerNextStep(withData({ tasks: [task({ state: 'MISSING', title: 'Late one' }), task({ deadline: hours(3) })] }), NOW)
    expect(s.title).toBe('"Late one" is past its deadline')
    expect(s.to).toBe('/dashboard/classes/c1/tasks/t9')
  })

  it('counts several missed tasks', () => {
    const s = learnerNextStep(withData({ tasks: [task({ state: 'MISSING' }), task({ id: 't8', state: 'MISSING' })] }), NOW)
    expect(s.title).toBe('2 tasks are past their deadline')
  })

  it('then work due within two days', () => {
    expect(learnerNextStep(withData({ tasks: [task({ deadline: hours(5) })] }), NOW).title).toBe('"Essay" is due in 5 h')
    expect(learnerNextStep(withData({ tasks: [task({ deadline: hours(30) })] }), NOW).title).toBe('"Essay" is due tomorrow')
  })

  it('then words due for review (a deadline days away does not win)', () => {
    const s = learnerNextStep(overviewFixture, NOW)
    expect(s.title).toBe('4 words ready to review')
    expect(s.to).toBe('/dashboard/vocab')
  })

  it("then the rest of today's goal", () => {
    const d = withData({ tasks: [], vocab: { ...overviewFixture.vocab, due: 0 } })
    expect(learnerNextStep(d, NOW).title).toBe("8 more minutes to reach today's goal")
    expect(learnerNextStep(withData({ ...d, today: { ...d.today, minutes: 0 } }), NOW).title).toBe('Practise 20 minutes today')
    expect(learnerNextStep(withData({ ...d, today: { ...d.today, minutes: 25 } }), NOW).title).toBe("You reached today's goal")
  })
})

describe('learnerStats', () => {
  it('says what each number is measured against', () => {
    expect(learnerStats(overviewFixture).map(s => [s.label, s.value, s.sub])).toEqual([
      ['Words mastered', '35', '120 saved · 6 new this week'],
      ['Practice this week', '12 min', 'Goal 2 h 20 min'],
      ['Speaking', '81', 'Good · 9 spoken messages'],
      ['Level', 'B1', 'Aiming for B2'],
    ])
  })

  it('shows no data as a dash with a hint, never as a zero score', () => {
    const d = withData({ skills: { ...overviewFixture.skills, speaking: null, level: null, selfLevel: null, targetLevel: null, basedOnMessages: 0, basedOnSpoken: 0 } })
    const [, , speaking, level] = learnerStats(d)
    expect([speaking!.value, speaking!.sub]).toEqual(['–', 'Try a voice chat to get a score'])
    expect([level!.value, level!.sub]).toEqual(['–', 'Shows after a few chats'])
  })
})

describe('useDashboardOverview', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(FIXTURE_NOW)
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('has no data or next step before loading', () => {
    const o = useDashboardOverview()
    expect(o.data.value).toBeNull()
    expect(o.nextStep.value).toBeNull()
  })

  it('loads the overview and works out the next step', async () => {
    mockFetch({ 'GET /dashboard/overview': ok(overviewFixture) }, base())
    const o = useDashboardOverview()
    await o.fetchOverview()
    expect(o.error.value).toBeNull()
    expect(o.data.value?.today.streak).toBe(6)
    expect(o.nextStep.value?.action).toBe('Review words')
  })

  it('keeps the server message on failure', async () => {
    mockFetch({ 'GET /dashboard/overview': fail(500, 'Database unavailable') }, base())
    const o = useDashboardOverview()
    await o.fetchOverview()
    expect(o.error.value).toBe('Database unavailable')
    expect(o.loading.value).toBe(false)
  })
})
