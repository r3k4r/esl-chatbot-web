import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '~~/stores/auth'
import { mockFetch, ok, sampleUser } from '../helpers/fetch-mock'

const base = () => useRuntimeConfig().public.baseUrl as string

describe('useRole', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it.each([
    ['STUDENT', { isAdmin: false, isTutor: false, isStaff: false }],
    ['TUTOR', { isAdmin: false, isTutor: true, isStaff: true }],
    ['ADMIN', { isAdmin: true, isTutor: false, isStaff: true }],
  ] as const)('%s', (role, expected) => {
    useAuthStore().setUserFromResponse(sampleUser({ role }) as never)
    const { isAdmin, isTutor, isStaff } = useRole()
    expect({ isAdmin: isAdmin.value, isTutor: isTutor.value, isStaff: isStaff.value }).toEqual(expected)
  })

  it('treats a signed-out visitor as a non-staff user', () => {
    const { isAdmin, isStaff } = useRole()
    expect(isAdmin.value || isStaff.value).toBe(false)
  })

  it('reacts when the user changes', () => {
    const { isAdmin } = useRole()
    expect(isAdmin.value).toBe(false)
    useAuthStore().setUserFromResponse(sampleUser({ role: 'ADMIN' }) as never)
    expect(isAdmin.value).toBe(true)
  })
})

describe('useTheme', () => {
  beforeEach(() => localStorage.clear())

  it('applies the theme to <html> on dashboard pages and remembers it', () => {
    const { theme, applyTheme } = useTheme()
    window.history.replaceState(null, '', '/dashboard')
    applyTheme('dark')
    expect(theme.value).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(localStorage.getItem('theme')).toBe('dark')

    applyTheme('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('keeps public pages light even when the saved theme is dark', () => {
    const { applyTheme } = useTheme()
    window.history.replaceState(null, '', '/')
    applyTheme('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(localStorage.getItem('theme')).toBe('dark')
  })

  it('syncFromProfile ignores missing or unknown values', () => {
    const { theme, applyTheme, syncFromProfile } = useTheme()
    applyTheme('light')
    syncFromProfile(null)
    syncFromProfile('sepia')
    expect(theme.value).toBe('light')
    syncFromProfile('dark')
    expect(theme.value).toBe('dark')
  })
})

describe('useCopyToClipboard', () => {
  const writeText = vi.fn()
  beforeEach(() => {
    writeText.mockReset()
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
  })

  it('copies strings, numbers and joined arrays', () => {
    useCopyToClipboard('ABC123')
    useCopyToClipboard(42)
    useCopyToClipboard(['a', 1])
    expect(writeText.mock.calls).toEqual([['ABC123'], ['42'], ['a, 1']])
  })

  it('ignores unsupported values', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    useCopyToClipboard(undefined)
    expect(writeText).not.toHaveBeenCalled()
    expect(warn).toHaveBeenCalled()
  })
})

describe('API composables build the right requests', () => {
  beforeEach(() => setActivePinia(createPinia()))
  afterEach(() => vi.unstubAllGlobals())

  it('useSessions.listSessions only sends the filters it was given', async () => {
    const api = mockFetch({ 'GET /sessions': ok([]) }, base())
    const { listSessions } = useSessions()
    await listSessions()
    await listSessions({ page: 2, limit: 10, active: 'false' })
    expect(api.calls.map((c) => c.path)).toEqual(['/sessions', '/sessions?page=2&limit=10&active=false'])
  })

  it('useSessions.createSession defaults to a TEXT session with no topic', async () => {
    const api = mockFetch({ 'POST /sessions': ok({}) }, base())
    await useSessions().createSession()
    expect(api.calls[0]!.body).toEqual({ mode: 'TEXT', topic: null })
  })

  it('useSessions.sendMessage posts the content and type', async () => {
    const api = mockFetch({ 'POST /sessions/s1/messages': ok({}) }, base())
    await useSessions().sendMessage('s1', 'Hello', 'VOICE')
    expect(api.calls[0]!.body).toEqual({ content: 'Hello', type: 'VOICE' })
  })

  it('useVocabulary.listVocabulary encodes every filter', async () => {
    const api = mockFetch({ 'GET /vocabulary': ok([]) }, base())
    await useVocabulary().listVocabulary({ page: 1, limit: 20, due: 'true', source: 'MANUAL', search: 'run fast' } as never)
    expect(api.calls[0]!.path).toBe('/vocabulary?page=1&limit=20&due=true&source=MANUAL&search=run+fast')
  })

  it('useVocabulary.assignVocabulary tags the word with the student id', async () => {
    const api = mockFetch({ 'POST /vocabulary': ok({}) }, base())
    await useVocabulary().assignVocabulary('stu-1', { word: 'resilient' } as never)
    expect(api.calls[0]!.body).toEqual({ word: 'resilient', assignedToUserId: 'stu-1' })
  })

  it('useVocabulary.reviewVocabulary sends the SM-2 quality', async () => {
    const api = mockFetch({ 'POST /vocabulary/v1/review': ok({}) }, base())
    await useVocabulary().reviewVocabulary('v1', 4 as never)
    expect(api.calls[0]!.body).toEqual({ quality: 4 })
  })

  it('useGlobalSearch URL-encodes the query and requires auth', async () => {
    useAuthStore().accessToken = 't'
    const api = mockFetch({ 'GET /search': ok({}) }, base())
    await useGlobalSearch().search('a&b c')
    expect(api.calls[0]!.path).toBe('/search?q=a%26b%20c')
    expect(api.calls[0]!.headers.authorization).toBe('Bearer t')
  })
})
