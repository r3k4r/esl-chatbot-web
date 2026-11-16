import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { mockFetch, ok, fail } from '../helpers/fetch-mock'
import { overviewFixture, FIXTURE_NOW } from '../../fixtures/overview'

const base = () => useRuntimeConfig().public.baseUrl as string

async function loaded(data = overviewFixture) {
  mockFetch({ 'GET /dashboard/overview': ok(data) }, base())
  const overview = useDashboardOverview()
  await overview.fetchOverview()
  return overview
}

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

  it('exposes safe defaults before data arrives', () => {
    const o = useDashboardOverview()
    expect(o.greetingHeroProps.value).toEqual({ streak: 0, doneMins: 0, goalMins: 25 })
    expect(o.statCards.value).toEqual([])
    expect(o.vocabChartGrowth.value).toBe('+0%')
    expect(o.nextUpPrimary.value).toBeNull()
  })

  it('formats the stat cards', async () => {
    const o = await loaded()
    expect(o.statCards.value.map((c) => [c.label, c.value, c.delta])).toEqual([
      ['Words mastered', (1240).toLocaleString(), '+18 this week'],
      ['Practice time', '3h', '45m this month'],
      ['Pronunciation', '82%', '-3% vs last'],
      ['Current level', 'B1', '60% to B2'],
    ])
  })

  it.each([
    [{ pronunciationDelta: null }, 'Pronunciation', 'voice sessions only'],
    [{ pronunciationDelta: 4 }, 'Pronunciation', '+4% vs last'],
    [{ currentLevel: 'C2' }, 'Current level', 'max level'],
    [{ currentLevel: null }, 'Current level', 'max level'],
  ])('stat card edge case %j', async (patch, label, delta) => {
    const o = await loaded({ ...overviewFixture, statCards: { ...overviewFixture.statCards, ...patch } })
    expect(o.statCards.value.find((c) => c.label === label)?.delta).toBe(delta)
  })

  it('labels goals and falls back for unknown types and missing difficulty', async () => {
    const o = await loaded()
    expect(o.nextUpPrimary.value).toMatchObject({ title: 'Hold a 5-minute conversation', tag: 'Speaking', level: 'HARD', icon: 'Microphone' })
    expect(o.nextUpOthers.value.map((g) => [g.tag, g.level, g.icon])).toEqual([
      ['Vocabulary', 'MEDIUM', 'Book1'],
      ['UNKNOWN_TYPE', 'EASY', 'Flag'],
    ])
  })

  it('describes recent sessions relative to now', async () => {
    const o = await loaded()
    expect(o.recentSessions.value).toEqual([
      { type: 'Voice', topic: 'Ordering coffee', time: '30 min ago', meta: '12 turns · 88% accuracy', icon: 'Microphone' },
      { type: 'Chat', topic: 'Untitled session', time: 'Yesterday', meta: '8 turns · 75%', icon: 'Messages' },
      { type: 'Chat', topic: 'Job interview', time: '3 days ago', meta: '3 turns', icon: 'Messages' },
    ])
  })

  it('labels when each due word is due', async () => {
    const o = await loaded()
    expect(o.dueWords.value.map((w) => w.due)).toEqual(['now', 'in 40m', 'in 5h', 'tomorrow', 'in 4d'])
  })

  it('keeps the error while a retry is in flight, then clears it on success', async () => {
    let answer: (v: Response) => void = () => {}
    const fail500 = () => new Response(JSON.stringify({ success: false, message: 'Database unavailable' }), { status: 500 })
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(fail500())
      .mockImplementationOnce(() => new Promise<Response>((r) => { answer = r }))
    vi.stubGlobal('fetch', fetchMock)
    const o = useDashboardOverview()

    await o.fetchOverview()
    expect(o.error.value).toBe('Database unavailable')

    const retry = o.fetchOverview()
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    expect(o.loading.value).toBe(true)
    expect(o.error.value).toBe('Database unavailable')

    answer(new Response(JSON.stringify({ success: true, data: overviewFixture })))
    await retry
    expect(o.error.value).toBeNull()
    expect(o.statCards.value).toHaveLength(4)
  })

  it('reports the server message and stops loading on failure', async () => {
    mockFetch({ 'GET /dashboard/overview': fail(500, 'Database unavailable') }, base())
    const o = useDashboardOverview()
    await o.fetchOverview()
    expect(o.error.value).toBe('Database unavailable')
    expect(o.loading.value).toBe(false)
  })
})
