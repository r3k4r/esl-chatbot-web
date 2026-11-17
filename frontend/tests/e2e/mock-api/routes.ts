import * as F from '../../fixtures/api'
import type { Persona } from '../../fixtures/api'

export interface Ctx {
  method: string
  path: string
  params: Record<string, string>
  query: URLSearchParams
  body: any
  persona: Persona | null
}
export interface Reply { status: number; body?: unknown }
type Handler = (ctx: Ctx) => Reply

const ok = (data: unknown, message = 'OK', extra: Record<string, unknown> = {}): Reply => ({ status: 200, body: { success: true, message, data, ...extra } })
const created = (data: unknown, message = 'Created'): Reply => ({ status: 201, body: { success: true, message, data } })
const fail = (status: number, message: string): Reply => ({ status, body: { success: false, message } })
const page = (items: unknown[], q: URLSearchParams): Reply => {
  const limit = Number(q.get('limit') ?? 20)
  const pageNo = Number(q.get('page') ?? 1)
  return ok(items.slice((pageNo - 1) * limit, pageNo * limit), 'OK', {
    meta: { page: pageNo, limit, total: items.length, totalPages: Math.max(1, Math.ceil(items.length / limit)) },
  })
}

/** Wraps a handler so it 401s without a valid token (and 403s for the wrong role). */
const auth = (h: Handler, roles?: Persona[]): Handler => (ctx) => {
  if (!ctx.persona) return fail(401, 'Authentication required')
  if (roles && !roles.includes(ctx.persona)) return fail(403, 'Forbidden')
  return h(ctx)
}
const STAFF: Persona[] = ['tutor', 'admin']

const personaByUsername = (username: string) =>
  (Object.keys(F.USERS) as Persona[]).find((p) => F.USERS[p].username === username) ?? null

// Same lifetimes as the backend defaults (JWT_ACCESS_EXPIRES=20m, JWT_REFRESH_EXPIRES=1h).
const ACCESS_TTL_MS = 20 * 60 * 1000
const REFRESH_TTL_MS = 60 * 60 * 1000
const inMs = (ms: number) => new Date(Date.now() + ms).toISOString()

const session = (p: Persona) => ({
  accessToken: F.tokenFor(p),
  refreshToken: F.refreshFor(p),
  accessTokenExpiresAt: inMs(ACCESS_TTL_MS),
  refreshTokenExpiresAt: inMs(REFRESH_TTL_MS),
  user: F.USERS[p],
})

export const routes: Record<string, Handler> = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  'POST /auth/login': ({ body }) => {
    const p = personaByUsername(body?.username)
    if (!p || body?.password !== F.PASSWORD) return fail(400, 'Invalid username or password') // backend uses 400, not 401
    return ok(session(p), 'Login successful')
  },
  'POST /auth/register': ({ body }) =>
    personaByUsername(body?.username)
      ? fail(409, 'Username is already taken')
      : created({ id: 'u-new', username: body?.username, email: body?.email }, 'Account created. Check your email for the code.'),
  'POST /auth/verify-email': ({ body }) =>
    body?.otp === '123456' ? ok(session('free'), 'Email verified') : fail(400, 'Invalid or expired verification code'),
  'POST /auth/resend-verification': () => ok(null, 'Code sent'),
  'POST /auth/forgot-password': () => ok(null, 'If that email exists, a code was sent'),
  'POST /auth/reset-password': ({ body }) => (body?.otp === '123456' ? ok(null, 'Password reset') : fail(400, 'Invalid or expired verification code')),
  'POST /auth/refresh': ({ body }) => {
    const p = (Object.keys(F.USERS) as Persona[]).find((x) => F.refreshFor(x) === body?.refreshToken)
    // Stateless mock: never rotates (the rotation rules are covered by the backend suite).
    return p
      ? ok({ accessToken: F.tokenFor(p), accessTokenExpiresAt: inMs(ACCESS_TTL_MS) })
      : fail(401, 'Invalid or expired refresh token')
  },
  'POST /auth/logout': () => ok(null, 'Logged out'),
  'POST /auth/google': () => fail(401, 'Google sign-in is not available in tests'),
  'POST /auth/accept-agreement': () => fail(400, 'Not needed in tests'),
  'GET /auth/agreement': () => ok(F.agreement),
  'GET /auth/me': auth(({ persona }) => ok(F.USERS[persona!])),

  // ── Me ────────────────────────────────────────────────────────────────────
  'GET /users/me': auth(({ persona }) => ok(F.profileFor(persona!))),
  'PATCH /users/me': auth(({ persona, body }) => ok({ ...F.profileFor(persona!), ...body }, 'Profile updated')),
  'PATCH /users/me/learner-profile': auth(({ persona, body }) => ok({ ...F.profileFor(persona!).learnerProfile, ...body }, 'Preferences saved')),
  'POST /users/me/avatar': auth(() => ok({ avatarUrl: '' }, 'Avatar updated')),
  'GET /users/me/subscription': auth(({ persona }) => ok(F.subscriptionFor(persona!))),
  'GET /users/me/notifications': auth(({ query }) =>
    page(query.get('read') === 'false' ? F.notifications.filter((n) => !n.read) : F.notifications, query)),
  'PATCH /users/me/notifications/read-all': auth(() => ok(null, 'All read')),
  'PATCH /users/me/notifications/:id/read': auth(() => ok(null, 'Read')),
  'GET /metrics/me': auth(() => ok(F.metrics)),

  // ── Dashboards ────────────────────────────────────────────────────────────
  'GET /dashboard/overview': auth(() => ok(F.overviewFixture)),
  'GET /dashboard/vocabulary-growth': auth(() => ok(F.overviewFixture.vocabChart)),
  'GET /tutor/dashboard': auth(() => ok(F.tutorDashboard), STAFF),
  'GET /admin/dashboard': auth(() => ok(F.adminDashboard), ['admin']),

  // ── Sessions / chat ───────────────────────────────────────────────────────
  'GET /sessions': auth(({ query }) => page(F.sessions, query)),
  'POST /sessions': auth(({ body }) => created({ ...F.sessions[0]!, id: 'sess-new', mode: body?.mode ?? 'TEXT', topic: body?.topic ?? null, endedAt: null, messageCount: 0, averageScore: null, summary: null, startedAt: new Date().toISOString() })),
  'GET /sessions/:id': auth(({ params }) => ok(F.sessionDetail(params.id!))),
  'PATCH /sessions/:id': auth(({ params, body }) => ok({ ...F.sessions.find((s) => s.id === params.id), ...body }, 'Session updated')),
  'DELETE /sessions/:id': auth(() => ok(null, 'Session deleted')),
  'POST /sessions/:id/end': auth(({ params }) => ok({ ...F.sessionDetail(params.id!), endedAt: new Date().toISOString(), evaluation: { avgGrammarScore: 80, avgVocabularyScore: 70, avgFluencyScore: 75, avgOverallScore: 76, detectedCefrLevel: 'B1', totalUserMessages: 3, totalUserWords: 30 } })),
  'GET /sessions/:id/messages': auth(({ query }) => page(F.messages, query)),
  'POST /sessions/:id/messages': auth(({ body }) => created(F.sentMessage(body?.content ?? ''))),

  // ── Vocabulary ────────────────────────────────────────────────────────────
  'GET /vocabulary': auth(({ query }) => {
    const search = query.get('search')?.toLowerCase()
    const source = query.get('source')
    let items = F.vocabulary
    if (search) items = items.filter((v) => v.word.includes(search))
    if (source) items = items.filter((v) => v.source === source)
    return page(items, query)
  }),
  'GET /vocabulary/stats': auth(() => ok(F.vocabularyStats)),
  'GET /vocabulary/due': auth(() => ok(F.vocabulary.filter((v) => new Date(v.srsDue) <= new Date()))),
  'POST /vocabulary': auth(({ body }) =>
    F.vocabulary.some((v) => v.word === String(body?.word).toLowerCase())
      ? fail(409, `"${body.word}" is already in your vocabulary list`)
      : created({ ...F.vocabulary[0]!, ...body, id: 'v-new', masteryLevel: 0, reviewCount: 0 }, 'Word added')),
  'GET /vocabulary/:id': auth(({ params }) => ok(F.vocabulary.find((v) => v.id === params.id) ?? F.vocabulary[0])),
  'PATCH /vocabulary/:id': auth(({ params, body }) => ok({ ...F.vocabulary.find((v) => v.id === params.id), ...body }, 'Word updated')),
  'DELETE /vocabulary/:id': auth(() => ok(null, 'Word deleted')),
  'POST /vocabulary/:id/review': auth(({ params }) => {
    const v = F.vocabulary.find((x) => x.id === params.id) ?? F.vocabulary[0]!
    return ok({ ...v, srsInterval: 3, srsDue: new Date(Date.now() + 3 * 86_400_000).toISOString(), reviewCount: v.reviewCount + 1, lastPracticed: new Date().toISOString() })
  }),

  // ── Goals ─────────────────────────────────────────────────────────────────
  'GET /goals': auth(({ query }) => {
    const status = query.get('status')
    return ok(status ? F.goals.filter((g) => g.status === status) : F.goals)
  }),
  'POST /goals': auth(({ body }) => created({ ...F.goals[0]!, ...body, id: 'g-new', status: 'ACTIVE', progress: 0 }, 'Goal created')),
  'PATCH /goals/:id': auth(({ params, body }) => ok({ ...F.goals.find((g) => g.id === params.id), ...body }, 'Goal updated')),
  'DELETE /goals/:id': auth(() => ok(null, 'Goal deleted')),

  // ── Classes ───────────────────────────────────────────────────────────────
  'GET /classes/mine': auth(({ query, persona }) => ok(query.get('archived') === 'true'
    ? []
    : F.classes.map((c) => ({ ...c, myRole: persona === 'tutor' ? 'TUTOR' : 'STUDENT' })))),
  'GET /classes': auth(({ query }) => page(query.get('archived') === 'true' ? [] : F.adminClasses, query), ['admin']),
  'POST /classes': auth(({ body, persona }) => created({ ...F.classDetail('c-new', persona!), ...body }, 'Class created'), STAFF),
  'POST /classes/join': auth(({ body }) =>
    String(body?.classCode).toUpperCase() === 'ENGB1X'
      ? ok({ classId: 'c1', className: 'English B1 Evening', classCode: 'ENGB1X', role: 'STUDENT', joinedAt: new Date().toISOString() }, 'Joined class')
      : fail(404, 'Class code not found')),
  'GET /classes/:id': auth(({ params, persona }) => ok(F.classDetail(params.id!, persona!))),
  'PATCH /classes/:id': auth(({ params, persona, body }) => ok({ ...F.classDetail(params.id!, persona!), ...body }, 'Class updated'), STAFF),
  'DELETE /classes/:id': auth(() => ok(null, 'Class deleted'), STAFF),
  'PATCH /classes/:id/archive': auth(({ params, persona, body }) => ok({ ...F.classDetail(params.id!, persona!), archived: Boolean(body?.archived) }), STAFF),
  'POST /classes/:id/code/refresh': auth(() => ok({ classCode: 'NEW-C0DE', classCodeExpiresAt: null }), STAFF),
  'PATCH /classes/:id/code/settings': auth(() => ok({}), STAFF),
  'PATCH /classes/:id/code/block': auth(() => ok({}), STAFF),
  'GET /classes/:id/students': auth(() => ok(F.classStudents), STAFF),
  'GET /classes/:id/students/:studentId': auth(({ params }) => ok(F.classStudentDetail(params.studentId!)), STAFF),
  'GET /classes/:id/analytics': auth(({ params }) => ok(F.classAnalytics(params.id!)), STAFF),
  'DELETE /classes/:id/members/:userId': auth(() => ok(null, 'Member removed')),
  'PATCH /classes/:id/members/:userId/role': auth(({ body }) => ok({ role: body?.role }), STAFF),
  'GET /classes/:id/announcements': auth(({ query }) => page(F.announcements, query)), // backend: flat list + meta
  'POST /classes/:id/announcements': auth(({ body }) => created({ ...F.announcements[0]!, id: 'an-new', content: body?.content }), STAFF),

  // ── Tasks ─────────────────────────────────────────────────────────────────
  'GET /classes/:id/tasks': auth(({ query, persona }) => page(F.tasks.map((t) => (persona === 'student' || persona === 'free' ? { ...t, submissionCount: undefined } : { ...t, mySubmission: undefined })), query)),
  'POST /classes/:id/tasks': auth(({ body }) => created({ ...F.tasks[0]!, ...body, id: 't-new' }, 'Task created'), STAFF),
  'GET /tasks/:id': auth(({ params }) => ok(F.tasks.find((t) => t.id === params.id) ?? F.tasks[0])),
  'PATCH /tasks/:id': auth(({ params, body }) => ok({ ...F.tasks.find((t) => t.id === params.id), ...body }), STAFF),
  'DELETE /tasks/:id': auth(() => ok(null, 'Task deleted'), STAFF),
  'GET /tasks/:id/submissions': auth(() => ok(F.submissions), STAFF),
  'POST /tasks/:id/submissions': auth(({ body }) => created({ ...F.submissions[0]!, ...body, id: 'sub-new' }, 'Submitted')),
  'PATCH /tasks/:id/submissions/:submissionId/feedback': auth(({ body }) => ok({ ...F.submissions[0]!, feedback: body?.feedback, feedbackAt: new Date().toISOString() }), STAFF),

  // ── Admin ─────────────────────────────────────────────────────────────────
  'GET /users': auth(({ query }) => {
    const search = query.get('search')?.toLowerCase()
    const role = query.get('role')
    let items = F.adminUsers
    if (search) items = items.filter((u) => `${u.username} ${u.displayName} ${u.email}`.toLowerCase().includes(search))
    if (role) items = items.filter((u) => u.role === role)
    return page(items, query)
  }, ['admin']),
  'GET /users/:id': auth(({ params }) => ok(F.adminUserDetail(params.id!)), ['admin']),
  'PATCH /admin/users/:id': auth(({ params, body }) => ok({ ...F.adminUserDetail(params.id!), ...body }, 'User updated'), ['admin']),
  'PUT /admin/users/:id/subscription': auth(() => ok({}, 'Subscription assigned'), ['admin']),
  'DELETE /admin/users/:id/subscription': auth(() => ok(null, 'Subscription cancelled'), ['admin']),
  'PATCH /admin/users/:id/profile': auth(() => ok({}, 'Profile updated'), ['admin']),
  'PATCH /admin/users/:id/learner-profile': auth(() => ok({}, 'Preferences saved'), ['admin']),
  'POST /admin/users/:id/avatar': auth(() => ok({ avatarUrl: '' }), ['admin']),

  // ── Billing (FIB) ─────────────────────────────────────────────────────────
  'GET /subscriptions/fib/pending': auth(() => ok(null)),
  'GET /subscriptions/fib/payments': auth(() => ok(F.fibPayments)),
  'POST /subscriptions/initiate-fib': auth(({ body }) => ok({
    fibSubscriptionId: 'fib-new', readableCode: 'ABCD-1234', qrCode: 'data:image/png;base64,iVBORw0KGgo=', appLink: 'fib://pay/fib-new',
    validUntil: new Date(Date.now() + 15 * 60_000).toISOString(), plan: body?.plan ?? 'GOLD', intervalMonths: body?.intervalMonths ?? 1,
    amountIQD: 25000, changeType: 'NEW', carryOverDays: 0, resumed: false,
  })),
  'GET /subscriptions/fib/:id/status': auth(() => ok({ fibStatus: 'DRAFT', plan: 'GOLD', intervalMonths: 1, amountIQD: 25000, activeUntil: null, lastPaymentAt: null })),
  'DELETE /subscriptions/fib/:id': auth(() => ok(null, 'Payment cancelled')),
  'DELETE /subscriptions/fib': auth(() => ok(null, 'Subscription cancelled')),

  // ── Search ────────────────────────────────────────────────────────────────
  'GET /search': auth(({ query }) => ok(F.searchResults(query.get('q') ?? ''))),
}

/** Matches `METHOD /path` against the table, binding `:params`. */
export function match(method: string, path: string): { handler: Handler; params: Record<string, string> } | null {
  const parts = path.split('/').filter(Boolean)
  for (const [key, handler] of Object.entries(routes)) {
    const [m, pattern] = key.split(' ') as [string, string]
    if (m !== method) continue
    const pp = pattern.split('/').filter(Boolean)
    if (pp.length !== parts.length) continue
    const params: Record<string, string> = {}
    if (pp.every((seg, i) => (seg.startsWith(':') ? ((params[seg.slice(1)] = decodeURIComponent(parts[i]!)), true) : seg === parts[i]))) {
      return { handler, params }
    }
  }
  return null
}
