# CLAUDE.md — ESL Chatbot Backend

## Overview
AI-powered English learning platform backend. Supports student-tutor-admin hierarchy,
conversation sessions, vocabulary SRS, progress tracking, and subscription management.

**Claude Code usage guide:** `docs/claude-code/` — prompting recipes, skills reference,
context efficiency tips, and memory system explained for this project.

---

## Tech Stack
- **Runtime:** Bun
- **Language:** TypeScript (strict mode)
- **Secrets:** Infisical (CLI-based injection — see `SECRETS.md`)
- **Framework:** Express.js 5
- **ORM:** Prisma 6 + PostgreSQL
- **Auth:** JWT (access + refresh tokens) + bcryptjs + Google OAuth (ID token verification via Google tokeninfo endpoint)
- **Cache:** Redis (placeholder — integrate later)
- **Email:** Resend (`src/config/resend.ts`) — active for password reset OTP; SendGrid scaffolded as fallback (`src/config/sendgrid.ts`)
- **File Uploads:** Multer
- **Realtime:** Socket.io v4 — `/chat` namespace (real-time message send) + `/notifications` namespace (server-push). See `src/socket/`
- **Security:** Helmet, express-rate-limit, cors
- **Logging:** Winston + Morgan
- **API Docs:** Swagger (OpenAPI 3.0 via swagger-jsdoc)
- **Type Sharing:** openapi-typescript (generates `frontend/types/api.ts` from Swagger spec)
- **Validation:** Zod 4
- **IDs:** UUID v4 (Prisma @default(uuid()))

---

## Commands

> All commands below require Infisical CLI to be set up (`infisical login` + `infisical init`).
> For running without Infisical, use `bun run dev:env` / `bun run start:env` with a `.env` file.

```bash
bun dev                # Start dev server with --watch (via Infisical)
bun start              # Start production server (via Infisical)
bun run dev:env        # Start dev server without Infisical (needs .env file)
bun run start:env      # Start production server without Infisical (needs .env file)
bun run db:generate    # Generate Prisma client
bun run db:migrate     # Run Prisma migrations (via Infisical)
bun run db:push        # Push schema to DB (no migration) (via Infisical)
bun run db:seed        # Seed the database (via Infisical)
bun run db:studio      # Open Prisma Studio (via Infisical)
bun run typecheck      # TypeScript type check
bun run generate:openapi   # Export Swagger spec → openapi.json (backend root, gitignored)
bun run generate:types     # Full pipeline: openapi.json → ../frontend/types/api.ts
bun test               # Run all tests (requires DB running + seeded) (via Infisical)
bun run test:watch     # Run tests in watch mode (via Infisical)
```

---

## Frontend Type Sharing (openapi-typescript)

The backend shares TypeScript types with the Nuxt.js frontend via `openapi-typescript`.
No tRPC, no code generation framework — just types derived from the existing Swagger spec.

### How it works
```
Swagger JSDoc comments in routers
        ↓
  swagger-jsdoc → openapi.json   (backend root, gitignored)
        ↓
  openapi-typescript → ../frontend/types/api.ts   (committed)
```

### When to regenerate
Run after **any** route change: new endpoint, changed request body, changed response shape.
```bash
bun run generate:types
```
Commit `../frontend/types/api.ts` alongside your backend changes so the frontend stays in sync.

### Frontend usage (Nuxt.js)
Install the companion HTTP client in the frontend once:
```bash
bun add openapi-fetch   # inside esl-chatbot-web/frontend/
```

Then use it with full type safety:
```ts
import createClient from "openapi-fetch";
import type { paths } from "~/types/api";

const api = createClient<paths>({ baseUrl: "http://localhost:8000/api/v1" });

// Fully typed — request body and response are inferred automatically
const { data, error } = await api.POST("/auth/login", {
  body: { username: "student_ali", password: "password123" },
});
// data.user.role is typed as "STUDENT" | "TUTOR" | "ADMIN"
```

### Key rules
- **Never edit `frontend/types/api.ts` manually** — it is always regenerated
- `openapi.json` is gitignored (intermediate artifact); `frontend/types/api.ts` is committed
- Types are only as good as the Swagger JSDoc comments — keep them accurate
- `scripts/export-openapi.ts` injects placeholder env vars so no real DB/JWT secrets are needed to generate types

### Pre-commit hook (enforces both of the above)
A committed git hook at `.githooks/pre-commit` runs automatically when any `backend/` file is
staged. It (1) runs `bun run typecheck` and (2) regenerates `frontend/types/api.ts` and blocks the
commit if the committed copy was stale — so a route change can't land without its types. It is a
no-op for commits that don't touch `backend/`, and skips with a warning if `bun` isn't on PATH.

Enable it once per clone (the backend `prepare` script does this automatically on `bun install`):
```bash
cd backend && bun run setup:hooks    # == git config core.hooksPath .githooks
```

---

## Architecture: Modular Domain-Based (Layered)

```
src/
├── config/          # env, database, redis, sendgrid, swagger, logger
├── modules/         # domain modules
│   ├── auth/        # login, register, token refresh, password reset
│   ├── users/       # CRUD, profile management
│   ├── classes/     # create classes, manage class code lifecycle, join by code
│   ├── sessions/    # conversation session lifecycle
│   ├── messages/    # chat messages within sessions
│   ├── vocabulary/  # flashcards + SRS scheduling
│   ├── goals/       # learning objectives + tracking
│   ├── progress/    # daily snapshots
│   ├── metrics/     # aggregated dashboard stats
│   ├── subscriptions/ # plan + billing management
│   └── admin/       # admin-only operations
├── middlewares/      # authenticate, authorize, errorHandler, notFound, upload
├── utils/           # AppError, asyncHandler, apiResponse, pagination
├── routes/v1/       # mounts all module routers under /api/v1
├── types/           # express.d.ts (req.user augmentation)
├── jobs/            # cron job placeholders
├── socket/          # Socket.io: index.ts (init), chat.socket.ts (/chat ns), voice.socket.ts (voice pipeline), notifications.socket.ts (/notifications ns), io-instance.ts (getIO singleton)
├── app.ts           # Express setup, middleware stack, routes
└── index.ts         # Server entry point
```

### Module Internal Pattern
Each module under `src/modules/[name]/` follows:
```
[name].router.ts      # Express router with route definitions
[name].controller.ts  # Handles req/res, calls service
[name].service.ts     # Business logic, calls Prisma
[name].schema.ts      # Zod validation schemas
[name].types.ts       # TypeScript types/interfaces
```

---

## Database Schema

### Enums
| Enum | Values |
|------|--------|
| Role | STUDENT, TUTOR, ADMIN |
| ClassRole | STUDENT, TUTOR — used exclusively on ClassUser.role; ADMIN is a global platform role and never appears as a class-membership role |
| AuthProvider | LOCAL, GOOGLE |
| ClassStatus | ACTIVE, INACTIVE |
| SessionMode | TEXT, VOICE |
| MessageRole | USER, ASSISTANT |
| MessageType | TEXT, VOICE |
| GoalStatus | ACTIVE, COMPLETED, PAUSED, CANCELLED |
| GoalType | VOCABULARY, SPEAKING, GRAMMAR, CONVERSATION, STUDY_TIME |
| GoalDifficulty | EASY, MEDIUM, HARD, EXPERT — used on Goal.difficulty (previously a freetext String) |
| AiPersonality | FRIENDLY, FORMAL, CASUAL, ENCOURAGING, STRICT, PATIENT |
| Plan | FREE, GOLD, PREMIUM |
| SubStatus | ACTIVE, INACTIVE, CANCELLED, PAST_DUE |
| VocabSource | MANUAL, SESSION, ASSIGNED — MANUAL=user added, SESSION=AI-detected, ASSIGNED=given by a tutor/admin (see Vocabulary.assignedByTutorId) |
| NotificationType | STREAK_MILESTONE, GOAL_COMPLETED, GOAL_ASSIGNED, VOCABULARY_ASSIGNED, CLASS_ANNOUNCEMENT, TASK_ASSIGNED, TASK_SUBMITTED |
| TaskStatus | OPEN, CLOSED — used on Task.status; OPEN = accepting submissions, CLOSED = no more submissions |

### Models
| Model | Table | Key Relations |
|-------|-------|---------------|
| User | users | 1:1 profile/subscription/metrics, has many classUsers, has many createdClasses (TUTOR/ADMIN as creator) |
| Class | classes | has many ClassUsers, optional createdBy (User), classCode lifecycle fields, `archived`/`archivedAt` (read-only soft state) |
| ClassUser | class_users | belongs to Class + User, has role ClassRole (TUTOR or STUDENT only), unique(classId, userId) |
| LearnerProfile | learner_profiles | 1:1 with User (students only) |
| Subscription | subscriptions | 1:1 with User, multi-provider payment fields (FIB/STRIPE/CASH) |
| UserMetrics | user_metrics | 1:1 with User, aggregated dashboard data |
| ConversationSession | conversation_sessions | belongs to User, has many Messages, optional SessionEvaluation. No averageScore — use SessionEvaluation.avgOverallScore |
| Message | messages | belongs to User + Session, has type (TEXT/VOICE), optional MessageEvaluation |
| MessageEvaluation | message_evaluations | 1:1 with Message (USER messages only), stores grammar/vocab/fluency scores and corrections |
| SessionEvaluation | session_evaluations | 1:1 with ConversationSession, aggregate scores + strengths/weaknesses/recommendations. avgPronunciationScore is nullable (null for text sessions, populated for voice sessions) |
| Vocabulary | vocabularies | belongs to User, SRS fields, unique(userId, word) |
| Goal | goals | belongs to User, optional tutor assigner. Type is GoalType enum. Difficulty is GoalDifficulty enum (EASY/MEDIUM/HARD/EXPERT). No timeframe or milestones columns. |
| Progress | progress | daily snapshot, unique(userId, date) |
| Task | tasks | belongs to Class + creator (User), has many TaskSubmissions. status=OPEN accepts submissions; status=CLOSED does not. Archived classes reject task creation (409). |
| TaskSubmission | task_submissions | belongs to Task + student (User), unique(taskId, studentId) — one submission per student per task. Has optional feedback + feedbackAt set by tutor. |
| UserAgreement | user_agreements | belongs to User. Terms-of-Service acceptance audit: `{ version, ipAddress, acceptedAt }`, unique(userId, version) — one row per accepted version (full history). Current version/text in `src/modules/auth/agreement.content.ts`; login requires a row matching it. |

### Key Design Decisions
- All IDs are UUID v4
- All tables have createdAt/updatedAt
- User model has username (unique), email (unique), displayName, password (nullable — null for Google-only accounts), authProvider (LOCAL|GOOGLE), googleId (unique, nullable), avatarUrl, isActive, isInternal, role, phoneNumber
- **Internal (stealth) accounts — `isInternal: Boolean` (default false):** a hidden programmer/monitoring account with full ADMIN power that is invisible to everyone, **including other admins**. It keeps `role=ADMIN` so all `authorize()` guards pass unchanged. Stealth rules: (1) **never serialized** — `isInternal` appears in no API response and no Swagger schema; (2) **never settable via API** — set only via seed (dev `sys_monitor`) or direct SQL (prod); (3) **hidden everywhere** — excluded from `GET /users` (even with search/role filters), admin dashboard counts (users by role, subscriptions by plan, DAU/WAU, sessions today, revenue), class member lists (`GET /classes/:id`), class student rosters/detail/analytics, `memberCount` on `GET /classes` + `/classes/mine`, the tutor dashboard, and notification/email fan-outs (announcements, task assigned/submitted, weekly digest); (4) endpoints targeting an internal user by id (`GET /users/:id`, all `PATCH/PUT/DELETE /admin/users/:id*`) return **404 "User not found"** — indistinguishable from a nonexistent user. Grep `isInternal` to find every filter site.
- AI chatbot access is gated by Subscription: `status === ACTIVE`. **Verification = a verified means of contact: verifying the registration email (6-digit OTP via `POST /auth/verify-email`) OR linking a Google account.** Both flip the FREE subscription `INACTIVE → ACTIVE`. Registration flow: LOCAL register → `plan=FREE, status=INACTIVE, emailVerified=false` (no AI, **no tokens issued, cannot log in yet**); email OTP verify → `emailVerified=true, status=ACTIVE` **and tokens issued (logs the user in)**; Google Sign-In / Google merge / `POST /auth/link-google` → `emailVerified=true, status=ACTIVE` (Google emails are pre-verified). **Login is blocked (403) until the email is verified.** Admin-assigned subscriptions are always `ACTIVE`. Class joining does NOT require a subscription. The gate lives in `sessions.service.ts` (checks `status === ACTIVE`); the `requireGoogleLinked` middleware exists but is unused — do not wire it onto AI routes, as that would defeat the email-verification activation path.
- **Subscription lifecycle:** LOCAL user registers → INACTIVE. Verifies email (OTP) OR links Google → FREE ACTIVE. Buys GOLD/PREMIUM (via FIB/STRIPE/CASH) → paid tier ACTIVE. Subscription period expires → lazy downgrade to FREE ACTIVE at next `POST /sessions`. Admin cancels subscription → FREE ACTIVE (not revoked; use `isActive=false` to block access entirely).
- Classes have a unique classCode; tutor/student membership tracked via ClassUser join table
- **Class archiving:** each Class has `archived` (Boolean, default false) + `archivedAt` (DateTime?). A tutor of the class or an admin toggles it via `PATCH /classes/:id/archive` (`{ archived }`). **Archived classes are read-only AND hidden from the default lists:** `getClasses`/`listMyClasses` default to `archived=false` (pass `?archived=true` to list archived ones); mutating paths (`updateClass`, `refreshClassCode`, `updateClassCodeSettings`, `setClassCodeBlocked`) call `assertNotArchived` and reject with **409**, and join is rejected with 409. Archiving is fully reversible — members, code, and data are preserved. The guard lives in `assertNotArchived(classId)` in `classes.service.ts`.
- ClassUser join table links any user to a class using the `ClassRole` enum (TUTOR or STUDENT — ADMIN is a global platform role and never stored in ClassUser). Admins can see all classes globally without joining them. An admin who also teaches a class joins as TUTOR.
- Class join flow is **direct** (no pending approval): a user submits a class code via `POST /classes/join` and is added as a STUDENT immediately, provided the code is not blocked, not expired, and the class is ACTIVE
- **Class code lifecycle:** each Class has `classCode`, `classCodeExpiresAt` (nullable — null = permanent), `classCodeRefreshIntervalSeconds` (nullable — null = no auto refresh), `classCodeBlocked` (boolean), and `classCodeRefreshedAt`. Tutors of the class (or admins) can rotate, change the refresh interval, or block/unblock the code via dedicated endpoints. Codes are 8-char uppercase alphanumeric (excludes ambiguous chars like 0/O/1/I/L) generated in `classes/classCode.util.ts`
- **Lazy auto-refresh on expiry:** the service rotates an expired code on demand, so no cron job is needed. Three triggers, all routed through the shared `refreshIfExpired(classId)` helper in `classes.service.ts`:
  1. **Join attempt with an expired code** — code is rotated internally and the join is rejected with HTTP 410 (Gone). The user must obtain the new code from the tutor.
  2. **`GET /classes/:id` by an admin or by a tutor of the class** — code is rotated before the response is built, so opening the class detail is enough to see a fresh code.
  3. **`GET /classes/mine`** — for each class where the caller is a TUTOR with a currently expired code, the code is rotated before the list is built. Student memberships do NOT trigger rotation, so students cannot bump the rotation by spamming reads.
- No separate settings table — settings live in LearnerProfile. Key fields: `currentLevel`/`targetLevel` (CEFR A1–C2), `aiPersonality` (AiPersonality enum: FRIENDLY/FORMAL/CASUAL/ENCOURAGING/STRICT/PATIENT), `topicsOfInterest` (JSON string[]), `voiceSpeed` (0.5–2.0), `theme` (light/dark), `weeklyGoalMinutes` (5–840). Updated via `PATCH /users/me/learner-profile`.
- Vocabulary uses SM-2 SRS algorithm fields (srsInterval, srsEase, srsDue). Has a `source` field (VocabSource enum: MANUAL/SESSION/ASSIGNED) — MANUAL = user added, SESSION = auto-detected by AI, ASSIGNED = given by a tutor/admin. ASSIGNED words carry `assignedByTutorId` (nullable FK → User, SetNull) so the UI can attribute "who added this word". `masteryLevel` (0-5) is computed from srsInterval: 0=new, 1=seen(1d), 2=learning(≤3d), 3=familiar(≤7d), 4=proficient(≤21d), 5=mastered(>21d). Words are stored in lowercase and must be unique per user.
- **Vocabulary assignment:** `POST /vocabulary` accepts an optional `assignedToUserId` (tutor/admin only). When set, the word is added to that student's list with `source=ASSIGNED` + `assignedByTutorId=caller`, and a `VOCABULARY_ASSIGNED` notification fires. Same guard as goal assignment: STUDENT→403, TUTOR must share a class with the student (else 404), ADMIN unrestricted. The list/detail responses include `assignedByTutor { id, displayName, role }`. Mirrors the `createGoal` assign pattern in `goals.service.ts`.
- Progress is exactly 1 row per user per calendar day. Updated automatically at session end (sessionsCount, studyMinutes, messagesCount, wordsTyped, skillSnapshot) and at vocabulary review (vocabularyPracticed).
- **UserMetrics skill fields:** grammarSkill, vocabularySkill, fluencySkill, speakingSkill (all Float 0–100). Updated via EMA (85% old + 15% new session) when a session ends. `lessonsCompleted`, `readingSkill`, `writingSkill`, `listeningSkill` were removed — they had no data source in the current pipeline. Re-add when a Lesson model is built.
- **Subscription payment fields:** `paymentProvider` (enum: STRIPE/FIB/CASH), `externalCustomerId` (Stripe customerId only), `externalSubscriptionId` (fibPaymentId for FIB, stripeSubscriptionId for Stripe). All nullable. Cash payments set `paymentProvider=CASH` only. FREE tier leaves all three null.
- Cascade delete on all user-owned relations
- RefreshToken table stores hashed (SHA-256) refresh tokens for server-side revocation; one row per active session/device
- PasswordResetToken table stores SHA-256-hashed 6-digit OTPs for password reset; 15-minute TTL; single-use (usedAt set on redemption); old tokens deleted when a new OTP is requested
- EmailVerificationToken table mirrors PasswordResetToken (SHA-256-hashed 6-digit OTP, single-use, old tokens deleted on resend) but with a 24-hour TTL; redeemed via `POST /auth/verify-email`. User model carries `emailVerified` (Boolean) + `emailVerifiedAt` (DateTime?)
- **Message evaluation flow:** each user message is evaluated by the AI for grammar (0-100), vocabulary (0-100 + CEFR level), fluency (0-100), overall score (weighted: 35% grammar + 35% vocab + 30% fluency), corrections (original/corrected/explanation), and feedback. Evaluations are stored in `message_evaluations` (1:1 with Message). Students see inline corrections after each message.
- **Session evaluation:** generated on `POST /sessions/:id/end`. Aggregates all message evaluations into averages (grammar, vocabulary, fluency, overall, and pronunciationScore for voice messages only → `avgPronunciationScore Float?`), detects session-level CEFR, identifies strengths/weaknesses/recommendations, and lists new vocabulary for SRS. Stored in `session_evaluations`. The old `ConversationSession.averageScore` field was removed — use `SessionEvaluation.avgOverallScore` instead.
- **Message type vs session mode:** `SessionMode` (TEXT/VOICE) is the starting mode. Individual `Message.type` (TEXT/VOICE) allows mixed-mode sessions — no separate MIXED enum needed.
- **Session limits:** soft limit shows a warning; hard limit (soft+10) blocks further messages. Daily session cap prevents runaway costs.
- **FREE tier cost controls:** 20 msg/session soft limit, 20 msg/day hard cap across all sessions, 10-message LLM context window (vs 20 for GOLD/PREMIUM). Reduces FREE tier AI cost ~65% vs naive design.
- **AI integration:** `src/modules/ai/ai.service.ts` exports `generateAIResponse()` — routing by plan and environment:
  - Dev (all plans) → `gemini-flash-latest` alias via `@google/genai`
  - FREE → `gemini-flash-lite-latest` alias via `@google/genai` (pinned 2.5 IDs 404 for new API keys — always use the rolling aliases)
  - GOLD → `gemini-flash-latest` alias via `@google/genai`
  - PREMIUM → GPT-5 mini (`gpt-5-mini`) via OpenAI SDK; **auto-falls back** to `gemini-flash-latest` if OpenAI errors
  - No API key → heuristic placeholder response
  - Model strings are constants in each provider file — model upgrades are one-line changes
  - Shared system prompt: `src/modules/ai/providers/prompt.ts`
  - See `docs/services/ai-providers.md` + `docs/ai-providers/llm.md` for full decision, costs, and upgrade paths.
- **TTS stack:** Dev→Edge TTS (npm, free) · FREE+GOLD→Azure Neural TTS (`AZURE_SPEECH_KEY`) · PREMIUM→OpenAI TTS-1-HD (`OPENAI_API_KEY`, already in stack). Future: Gemini 3.1 Flash TTS (launched Apr 2026, #2 global quality, same `GEMINI_API_KEY`) when GA. See `docs/ai-providers/tts.md`.
- **STT stack:** Dev+FREE→Deepgram Nova-3 (`DEEPGRAM_API_KEY`, $200 credit) · GOLD+PREMIUM→Azure Speech (`AZURE_SPEECH_KEY`, includes pronunciation assessment). See `docs/ai-providers/stt.md`.
- **AI tier limits:** Session/day caps: FREE=3, GOLD=15, PREMIUM=50. Messages/session soft limits: FREE=20+10 buffer, GOLD=100+10 buffer, PREMIUM=150+10 buffer. FREE also has 20 msg/day hard cap.

---

## API Conventions
- All routes prefixed: `/api/v1/`
- Standard response: `{ success: boolean, message: string, data: any, meta?: { page, limit, total, totalPages } }`
- Custom errors: `throw new AppError("message", statusCode)`
- All async controllers wrapped in `asyncHandler()`
- Pagination: `?page=1&limit=20` (max 100)
- All request inputs validated with Zod (body, params, query)
- Swagger JSDoc comments on all routes; shared `ErrorResponse` schema defined in `swagger.ts` components
- HTTP status code conventions:
  - **400 Bad Request**: submitted data is wrong (invalid credentials on login — wrong username/password, Google-only account attempting password login)
  - **401 Unauthorized**: token missing, invalid, or expired — triggers frontend refresh interceptor. Only from `authenticate` middleware or token-based operations (refresh, Google token verification)
  - **403 Forbidden**: valid token but insufficient role, or account deactivated
  - **422 Unprocessable Entity**: Zod validation failure (malformed/missing fields) — includes structured `errors` object for field-level frontend highlighting
- Auth middleware pattern: `authenticate` → attaches `req.user`; `authorize("ROLE")` → guards by role
  - 401: no token / invalid token / `req.user` missing when `authorize` runs
  - 403: valid token but insufficient role (`"Access denied. Required role: X or Y"`)
  - Usage: `router.get("/path", authenticate, authorize("ADMIN"), handler)`

---

## Code Standards
- TypeScript strict mode, avoid `any`
- Services: business logic only, never touch req/res
- Controllers: handle req/res only, call services
- Prisma transactions for multi-table writes
- Winston: info for requests, error for failures
- All relations use onDelete: Cascade (user-owned) or SetNull (optional refs)

## Testing
- **Runner:** Bun's built-in test runner (`bun test`) — no extra runner package needed
- **HTTP testing:** `supertest` — makes real HTTP requests against the Express app without starting a server
- **Test type:** Integration tests — tests the full middleware chain as the frontend experiences it
- **Token generation:** JWTs are signed directly in tests using env secrets (no DB user lookup needed for auth tests — JWTs are stateless)
- **DB dependency:** 401/403 (middleware) and 422 (Zod validation) tests are DB-independent; 200 success tests require DB running (seeded or empty — both return 200)
- **File location:** Co-located in `src/modules/[name]/__tests__/[name].router.test.ts`
- **Error handler:** `ZodError` is handled as 422 with a field-level `errors` map; `AppError` maps to its own `statusCode`; all other errors return 500

---

## Environment Variables

Secrets are managed via **Infisical**. See `SECRETS.md` for the full setup guide.

- Infisical project: `esl-chatbot`
- Environments: `dev` (local), `prod` (production)
- `.env.example` lists all required variables as a reference — do not copy secrets from there into a `.env` file unless absolutely necessary
- `.infisical.json` in the project root binds the directory to the `esl-chatbot` project (created by `infisical init`)

**Database setup (0 to hero):** See `docs/services/database.md` for the full Neon setup guide — creating a project, choosing a region, getting the connection string, running migrations, seeding, and troubleshooting.

**Note:** If your PostgreSQL password contains special characters (e.g. `&`, `(`, `)`),
URL-encode them in `DATABASE_URL`. Example: `(Gochan&DB)` → `(Gochan%26DB)`.

---

## Startup Behavior
On `bun dev` / `bun start`, the server:
1. Validates all env vars via Zod (exits if invalid)
2. Connects to PostgreSQL and logs connection status
3. Lists all tables with row counts
4. Starts Express on the configured PORT
5. Logs server URL, API docs URL, and health endpoint

---

## Seed Data
Run `bun run db:seed` to populate the database with test data:
- **Admin:** admin_main / admin@tutelage.com
- **Tutor:** tutor_sarah / sarah@tutelage.com (class code: `SARAH123`, weekly auto-refresh, expires in 7 days)
- **Student 1:** student_ali / ali@tutelage.com (PREMIUM, B1 level)
- **Student 2:** student_yuki / yuki@tutelage.com (FREE, A2 level, `emailDigestEnabled=false` — opted out of weekly digest)
- **Internal:** sys_monitor / monitor@tutelage.com (stealth ADMIN, `isInternal=true` — hidden from listings/dashboards/class lists)
- **Password for all:** `password123`

Includes: classes (with full code-lifecycle fields populated) with enrolled users (tutor + students via ClassUser), learner profiles, subscriptions (all 4 users get one — admin/tutor get FREE ACTIVE), metrics (all 4 users get a row — admin/tutor zeroed), conversation sessions with messages, vocabulary with SRS data, goals, and daily progress snapshots.

---

## Recommended Next Phases

### Phase 2 — Auth Module (Critical Path)
- ✅ `POST /auth/login` — username + password → access token (15m) + refresh token (7d) + user data (id, username, email, displayName, role, avatarUrl, isActive, emailVerified, subscription.plan/status). **403 if the email is not yet verified** (checked only after the password is confirmed valid, so verification state never leaks to non-owners).
- ✅ `POST /auth/register` — creates User + LearnerProfile + Subscription (FREE/INACTIVE) + UserMetrics in a single transaction; sends an email-verification OTP best-effort (registration still succeeds if the email service is down). **Does NOT return tokens and does NOT log the user in** — the account is unverified and cannot log in until the email is verified. Returns the created `AuthUser` (201).
- ✅ `POST /auth/google` — Google Sign-In: verifies Google ID token, handles login / account merge / new registration in one endpoint; see `docs/services/google-oauth.md`
- ✅ `GET /auth/google/test` — dev-only HTML page: renders a Google Sign-In button and displays the resulting ID token so it can be copy-pasted into Swagger (disabled in production)
- ✅ `GET /auth/me` — returns the authenticated user's profile (same `AuthUser` shape as login). DB is queried on every call so subscription/role/deactivation changes are reflected; 403 if account was deactivated after the token was issued, 404 if the user no longer exists. Also serves as a token-validity probe on app load.
- ✅ `POST /auth/refresh` — exchange valid refresh token for a new access token
- ✅ `POST /auth/logout` — revoke refresh token (deleted from DB)
- ✅ `authenticate.ts` middleware — verifies Bearer access token, attaches `req.user = { id, username, email, role }`
- ✅ Refresh tokens stored server-side as SHA-256 hashes in `refresh_tokens` table (supports multi-device, true revocation)
- ✅ `authorize.ts` middleware factory (role guard) — `authorize(...roles: Role[])` factory; throws 401 if `req.user` missing, 403 with `"Access denied. Required role: X"` if role not in allowed list
- ✅ `POST /auth/forgot-password` — sends 6-digit OTP to registered email via Resend (15 min TTL); always 200 to prevent enumeration; Google-only accounts get a redirect email instead of OTP
- ✅ `POST /auth/reset-password` — verifies OTP (single-use, hashed in DB) + sets new password
- ✅ `POST /auth/link-google` — authenticated; links Google account to an existing LOCAL account; preserves existing avatar; 409 if already linked
- ✅ `POST /auth/set-password` — authenticated; lets Google-only accounts add a password (recommended, not forced); 409 if password already set
- ✅ `POST /auth/verify-email` — verifies the registration OTP (`{ email, otp }`), marks `emailVerified=true`, activates the FREE subscription (`INACTIVE→ACTIVE`), **and issues a token pair so the user is logged in** (the valid OTP is the proof of ownership — this is the first point a LOCAL account gets tokens). Unauthenticated; sends a welcome email on success; returns a `LoginResponse` (`{ user, accessToken, refreshToken }`). **No longer idempotent** — an already-verified email returns **409** (sign in normally) so tokens can't be minted by replaying a verified email.
- ✅ `POST /auth/resend-verification` — resends a fresh OTP (`{ email }`, 24h TTL); always 200 to prevent enumeration; 503 if the email service is unconfigured
- ✅ **Terms of Service (`UserAgreement`):** `GET /auth/agreement` (public) returns `{ version, effectiveDate, text }` from `agreement.content.ts`. `POST /auth/register` requires `acceptAgreement: true` and records acceptance (version + `req.ip`) in the create transaction; the Google new-account branch requires it too. **Login re-accept guard:** both `POST /auth/login` **and** the existing-user/merge paths of `POST /auth/google` return 403 `{ needsAgreement: true, agreementVersion }` when the user hasn't accepted the current version; the blocked user calls `POST /auth/accept-agreement` — `{ username, password }` (LOCAL) or `{ idToken }` (Google, which has no password) — to re-prove identity, record acceptance, and receive tokens. Bumping `CURRENT_AGREEMENT.version` forces everyone to re-accept (no migration). The agreement text in `agreement.content.ts` is a project-specific v1.0 template (review `[Company]`/governing-law/refund clauses before launch). The 403 carries structured fields via the optional `details` arg on `AppError` (spread top-level by `errorHandler`, where the canonical envelope keys always win).
- ✅ `requireGoogleLinked` middleware — exists but **unused**. AI access is gated by `subscription.status === ACTIVE` (set by email verify OR Google link), so this middleware is intentionally not mounted — wiring it onto AI routes would block email-verified-but-not-Google-linked users
- Remaining: (none for Phase 2 — email verification + welcome email done)

### Phase 3 — User & Class Modules
- ✅ `GET /users` — paginated user list, filterable by `?role=`, `?search=` (username/email/displayName), `?subscriptionStatus=`; includes subscription summary (plan/status/expiry) in each row (admin only)
- ✅ `GET /users/:id` — full user profile: learnerProfile, subscription, metrics, classUsers (admin only)
- ✅ `GET /classes` — paginated class list with memberCount + code-lifecycle fields, filterable by `?status=` (admin only)
- ✅ `GET /classes/:id` — class detail with enrolled members (id, role, user: id/username/displayName/avatarUrl). Access: admins or members of the class only (anyone else gets 404). Also returns **`myRole`** (`TUTOR`/`STUDENT`/`null`) — the caller's own class role from a direct membership lookup (NOT derived from `members`, which is `isInternal`-filtered). Clients must gate tutor-only UI on `myRole`, not by scanning `members` for themselves — an internal/stealth account is absent from `members` but still gets its correct `myRole`. Returned by create/update/archive too. **Refresh-on-read:** triggers a lazy rotation when the caller is an admin or a tutor of this class and the code is currently expired
- ✅ `POST /classes` — tutor or admin creates a class; creator becomes a TUTOR member; a fresh code is generated; optional `classCodeRefreshIntervalSeconds`
- ✅ `POST /classes/join` — any authenticated user joins by code; no pending state. Rejects with 403 (blocked), 410 (expired — code is auto-rotated internally), 409 (already a member or class INACTIVE), 404 (unknown code)
- ✅ `GET /classes/mine` — list classes the authenticated user is a member of, with their role per class. **Refresh-on-read:** any class where the caller is a TUTOR with an expired code is rotated before the list is built (student memberships do not trigger rotation)
- ✅ `POST /classes/:id/code/refresh` — tutor of the class (or admin) manually rotates the code; expiry resets per the configured interval
- ✅ `PATCH /classes/:id/code/settings` — change `classCodeRefreshIntervalSeconds` (null = permanent); recomputes expiry from `classCodeRefreshedAt`
- ✅ `PATCH /classes/:id/code/block` — block or unblock the code with `{ blocked: boolean }`. Blocking does not change the code value or expiry
- ✅ `PATCH /classes/:id/archive` — archive/unarchive a class with `{ archived: boolean }` (tutor of class or admin). Archived classes are hidden from default lists (filter with `?archived=true` on `/classes` and `/classes/mine`) and are read-only — edit, code rotation/block, and join all reject with 409 until unarchived. Reversible; preserves members/code/data.
- ✅ `GET /classes/:id/students` — tutor of the class (or admin) lists all STUDENT members with a progress snapshot: self-reported level, AI-estimated CEFR, streak, study time, grammar/vocab skill scores, vocab total + SRS cards due today
- ✅ `GET /classes/:id/students/:userId` — tutor (or admin) fetches full learner profile + all metric skill scores + vocab stats for a specific student in the class
- ✅ `DELETE /classes/:id/members/:userId` — remove a member. Self-leave: any member can leave. Tutor: can remove STUDENT members only. Admin: can remove anyone. Guard: last tutor cannot be removed.
- ✅ `PATCH /admin/users/:id` — update a user's `role` (STUDENT/TUTOR/ADMIN) and/or `isActive` (true/false soft ban); at least one field required
- ✅ `PUT /admin/users/:id/subscription` — assign/overwrite subscription: `{ plan, durationMonths?: 1|3|6|12, endDate?: ISO }` — one of the two must be provided; sets status=ACTIVE, currentPeriodStart=now
- ✅ `DELETE /admin/users/:id/subscription` — cancel subscription (sets status=CANCELLED, keeps dates for audit)
- ✅ `GET /users/me` — own full profile (displayName, phoneNumber, avatarUrl, authProvider, learnerProfile with all settings, subscription plan/status)
- ✅ `PATCH /users/me` — update own basic profile: `displayName`, `phoneNumber`, `avatarUrl`
- ✅ `PATCH /users/me/learner-profile` — update learner settings: currentLevel/targetLevel (CEFR A1–C2), learningPurpose, topicsOfInterest, aiPersonality (FRIENDLY/FORMAL/CASUAL/ENCOURAGING/STRICT/PATIENT), voiceSpeed, autoSpeak, uiLanguage, theme (light/dark), weeklyGoalMinutes, timezone

### Phase 4 — Conversation Sessions & Messages
- ✅ `POST /sessions` — start a new conversation session (requires active subscription, daily caps: FREE=3, PREMIUM=50)
- ✅ `GET /sessions` — list user's sessions (paginated, filterable by mode/active status)
- ✅ `GET /sessions/:id` — session detail with all messages and evaluations
- ✅ `POST /sessions/:id/end` — end session, compute averages, generate SessionEvaluation
- ✅ `POST /sessions/:sessionId/messages` — send message → AI responds → MessageEvaluation generated (grammar, vocabulary, fluency, corrections). Per-session limits: FREE=20+10, GOLD=100+10, PREMIUM=150+10. FREE also has 20 msg/day hard cap and 10-message context window.
- ✅ `GET /sessions/:sessionId/messages` — paginated message list with evaluations
- ✅ MessageEvaluation table: per-message grammar/vocabulary/fluency scores, corrections, CEFR detection
- ✅ SessionEvaluation table: aggregate scores, strengths, weaknesses, recommendations, detected CEFR level
- ✅ Message type field (TEXT/VOICE) — sessions can contain both types (mixed mode)
- ✅ AI integration — `src/modules/ai/` module with plan-based model selection (PREMIUM→gpt-5-mini via OpenAI; FREE/GOLD→Gemini pending migration); heuristic fallback when no API key
- Remaining: real AI provider integration ✅ (done), TTS/STT pipeline ✅ (done), Socket.io real-time messaging ✅ (done)

### Phase 5 — Vocabulary & SRS System
- ✅ `GET /vocabulary` — list user's vocabulary, filterable by `?due=true/false`, `?source=MANUAL/SESSION`, `?category=`, `?search=`; paginated
- ✅ `GET /vocabulary/due` — fetch up to 50 SRS cards due today (ordered by most overdue)
- ✅ `POST /vocabulary` — add a word (self: `source=MANUAL`). **Tutor/admin may pass `assignedToUserId`** to assign the word to a student (`source=ASSIGNED`, `assignedByTutorId` set, `VOCABULARY_ASSIGNED` notification fired; tutor must share a class with the student → else 404, student→403). Word stored in lowercase; 409 if the target already has it
- ✅ `GET /vocabulary/:id` — get a single vocabulary item
- ✅ `PATCH /vocabulary/:id` — update definition, pronunciation, example, partOfSpeech, difficulty, category
- ✅ `DELETE /vocabulary/:id` — delete a word
- ✅ `POST /vocabulary/:id/review` — submit SM-2 review (quality 0–5); updates srsInterval, srsEase, srsDue, masteryLevel, correctCount/incorrectCount; also increments today's progress.vocabularyPracticed
- ✅ SM-2 algorithm implemented in `vocabulary.service.ts` — masteryLevel derived from srsInterval (0=new, 1=seen, 2=learning, 3=familiar, 4=proficient, 5=mastered)
- ✅ `source` field (VocabSource: MANUAL/SESSION) — tracks whether words were user-added or AI-detected
- Remaining: bulk import/export
- ✅ Auto-add from session: AI returns `newWords` per message → stored in `MessageEvaluation.newWords` → aggregated + upserted to vocabulary table on `POST /sessions/:id/end`. `SessionEvaluation.newVocabulary` now populated with `{word,definition,partOfSpeech?,example?}` objects.

### Phase 6 — Goals & Progress
- ✅ `GET /goals` — list own goals; tutors/admins can add `?studentId=` (tutor must have the student in their class). Filterable by `?status=` and `?type=`
- ✅ `POST /goals` — create a goal. Students create for self (no `assignedToUserId`). Tutors/admins provide `assignedToUserId` to assign to a student in their class.
- ✅ `GET /goals/:id` — get single goal (own or assigned by caller or admin)
- ✅ `PATCH /goals/:id` — update description, target, difficulty, status, progress, targetDate, actionPlan. Setting status=COMPLETED auto-sets completedDate + progress=100.
- ✅ `DELETE /goals/:id` — delete goal (own or tutor-assigned or admin)
- **GoalType enum:** VOCABULARY, SPEAKING, GRAMMAR, CONVERSATION, STUDY_TIME
- **GoalDifficulty enum:** EASY, MEDIUM, HARD, EXPERT — stored on `Goal.difficulty` (nullable). Was previously a freetext String; enum enforces valid values.
- **Removed from schema:** `timeframe` (redundant with startDate/targetDate) and `milestones` (deferred to later phase)
- ✅ Progress daily snapshot auto-updated at session end (`POST /sessions/:id/end`) — increments sessionsCount, studyMinutes, messagesCount, wordsTyped, writes skillSnapshot
- ✅ Progress vocabularyPracticed incremented on each vocab review (`POST /vocabulary/:id/review`)
- Goal status transitions (ACTIVE → COMPLETED/PAUSED/CANCELLED) ✅ already handled in PATCH
- ✅ `GET /progress` — paginated list of daily progress entries, filterable by `?startDate=` / `?endDate=` (YYYY-MM-DD)
- ✅ `GET /progress/today` — today's progress entry (created on-demand if not exists)
- ✅ `GET /progress/summary` — chart-ready day-by-day data for last 7/14/30 days (`?days=7`)
- Dashboard aggregation queries (remaining)

### Phase 7 — Metrics & Dashboard
- ✅ `GET /metrics/me` — own lifetime metrics (streak, study time, skill scores). Auto-creates a zeroed metrics row via upsert if none exists — never returns 404
- ✅ `GET /metrics/:userId` — tutor/admin view of a student's metrics (tutor must share a class)
- ✅ UserMetrics auto-updated at session end: totalStudyTimeMinutes, totalWordsTyped, currentStreak, longestStreak, lastStudyDate, estimatedLevel, skill EMA (grammarSkill, vocabularySkill, fluencySkill)
- ✅ Streak calculation: consecutive-day check against lastStudyDate; streak resets if user skips a day
- ✅ Skill scores use EMA (85% old + 15% new session) to smooth out single-session spikes
- ✅ speakingSkill updated from pronunciationScore (voice sessions only — currently placeholder)
- Admin dashboard: platform-wide analytics (remaining)

### FIB Billing — the rules that are easy to get wrong

Everything below was learned by losing real money in testing. Read before touching
`src/modules/subscriptions/` or `src/jobs/fib-reconcile.job.ts`.

- **FIB's status feed lags the actual payment — by minutes, and confirmed by FIB (2026-07-29) sometimes by ONE TO TWO DAYS.** Never make a user-facing decision from a locally-`DRAFT` record without live-verifying via `syncDraftWithFib()` first. Every violation of this either lost money or told the user something false (pending card showing "payment waiting" for money already sent; cancel discarding a paid draft; initiate blocking an upgrade behind a paid draft).
- **Recovery windows must key off `createdAt`, never `validUntil`.** `expiresIn` is 36h, so a `validUntil`-based cutoff goes blind exactly when late settlement lands. `PAYMENT_RECOVERY_WINDOW_DAYS` (7) in `subscriptions.service.ts` is the single source of truth, shared by the reconcile job and the `awaitingConfirmation` flag on `GET /fib/payments`.
- **"Not activated" ≠ "not paid".** While a record is inside the recovery window, the honest answer is "still checking" — telling a user their payment failed is how they end up paying twice.
- **A dying DRAFT must never mutate the Subscription row.** Cancellation only touches the plan when the record was locally `ACTIVE`/`TRIAL` (`recordWasLive` in `applyFibStatusChange`); otherwise an abandoned upgrade QR expiring would flag `cancelAtPeriodEnd` on a plan the user never cancelled.
- **Cancel endpoints are not interchangeable.** `DELETE /subscriptions/fib` (no id) prefers the LIVE subscription — correct for "cancel my plan", catastrophic for the pending-payment card, which must use `DELETE /subscriptions/fib/:id`. Getting this wrong cancelled users' active plans while leaving the draft alive.
- **Plan changes never take paid time away.** `carryOverDays()` converts unused value on the old plan into days on the new one at the new plan's daily rate — one formula covers renewal (1:1), upgrade (fewer days) and downgrade (more days). Round, never floor: `remainingDays` is always a hair under the whole number.
- **The old subscription is retired at FIB only AFTER the new one is paid** (`retireSupersededFibSubscriptions`), never before — cancelling up front would strip a paying user's plan for a payment that may never complete.
- **Known, accepted behaviour:** if a user pays an old abandoned QR while a newer subscription is already live, the late payment wins — it activates, carries the newer plan's remaining value over, and retires the newer FIB subscription. No money is lost, but the plan can change under them. Honouring a real payment is the lesser evil than ignoring it.

### Phase 8 — Subscriptions & Billing
- Plan enforcement middleware (FREE vs PREMIUM limits)
- TTS usage tracking and monthly reset
- **FIB payment integration** (primary): create payment → QR/deep-link → webhook callback → set `plan=GOLD/PREMIUM, status=ACTIVE, paymentProvider=FIB, externalSubscriptionId=fibPaymentId`
- **Stripe integration** (future): customer creation, checkout, webhook handling; `paymentProvider=STRIPE, externalCustomerId=stripeCustomerId, externalSubscriptionId=stripeSubscriptionId`
- Plan upgrade/downgrade flows; expired subscription lazy-downgrade already implemented at session creation

### Phase 9 — Infrastructure & Polish
- Redis caching for hot queries (user profiles, session data)
- ✅ Rate limiting — `src/middlewares/rateLimits.ts`: IP-based limits on all auth endpoints (10 login / 5 register / 5 forgot-password per window), per-user burst limits on AI endpoints (10 msg/min, 5 voice/min, 20 sessions/hr) + search (30/min), global fallback 500/15 min. `trust proxy 1` set in `app.ts`. Active in production only (no-op in dev/test).
- ✅ Email notifications (Resend): welcome, password reset, weekly digest. Weekly digest opt-out via `LearnerProfile.emailDigestEnabled` (default true); `bun run job:digest [-- --force]` for manual runs
- File upload handling (audio recordings, avatars)
- ✅ Socket.io real-time chat — `/chat` namespace (text `message:send` + voice `voice:start/chunk/end` pipeline) + `/notifications` namespace (server-push). JWT auth at handshake. See `src/socket/`. Voice: client streams base64 chunks → server buffers + streams to Deepgram live for partial transcripts → on `voice:end` runs batch STT→LLM→TTS via `sendVoiceMessage`. To push a notification from any service: `getIO().of('/notifications').to('user:{userId}').emit('notification:new', data)`
- ✅ Cron jobs (6, all in `src/jobs/`, registered in `jobs/index.ts`): streak reset (00:00 UTC), subscription expiry (01:00 UTC), stale session cleanup (02:00 UTC), **fib-reconcile (every 15 min)**, weekly digest (hourly tick — fires per-user at local Sunday 08:00 via `LearnerProfile.timezone`), **renewal reminder (09:00 UTC daily)**
  - ⚠️ **`renewal-reminder` must stay DAILY** — it dedups structurally on a 24h window (no `sentAt` column), so a more frequent schedule would re-email the same cohort. Assumes ONE instance runs cron (Render Starter = 1).
  - ⚠️ **Payment alerting depends on `SENTRY_DSN`.** It is optional (`env.ts`) and `sync: false` in `render.yaml`, and `config/sentry.ts` sets `enabled: NODE_ENV === "production" && !!SENTRY_DSN`. If it is unset in prod, **every** payment-failure alert (failed activation, failed retire, stale payment, reconcile error) is a silent no-op — only the Winston logs remain, and nobody reads those proactively.
- Comprehensive error logging and monitoring
- API documentation completion (Swagger)
- Integration and unit tests

---

## API Backlog — Deferred (identified 2026-05-18 during dashboard audit)

These were identified during a full API audit and agreed to implement after the dashboard is polished.
Check them off (✅) as they are built.

### Classes
- ✅ `PATCH /classes/:id` — tutor or admin updates class name, category, or status (ACTIVE/INACTIVE). Simple PATCH with all fields optional. Authorization: tutor of the class or admin.
- ✅ `GET /classes/:id/analytics` — class-wide aggregated analytics for tutors: average skill scores (grammar/vocab/fluency) across all students, most common grammar weaknesses (from MessageEvaluation.grammarErrors), vocabulary coverage. Tutor + admin only.
- ✅ `GET /classes/:id/announcements` + `POST /classes/:id/announcements` — tutor broadcasts a text update or homework note to the class. Simple model: `{ classId, authorId, content, createdAt }`. Students see the list on the class page. No replies needed at first. POST fires `CLASS_ANNOUNCEMENT` notification to all student members.

### Sessions & Conversation
- ✅ `GET /sessions/stats` — session history summary for charts: sessions per day over last N days, average session duration. Filterable by `?days=30` (max 90). Own stats only (students); tutor/admin can add `?userId=`.

### Subscriptions
- ✅ `GET /users/me/subscription` — dedicated endpoint returning the authenticated user's full subscription record (plan, status, currentPeriodStart, currentPeriodEnd, paymentProvider).
- [ ] **FIB payment flow** — `POST /subscriptions/initiate-fib` (creates payment intent, returns QR/deep-link) + `POST /subscriptions/webhook/fib` (receives callback, sets plan=GOLD/PREMIUM, status=ACTIVE, externalSubscriptionId=fibPaymentId). See existing Phase 8 notes for context.

### Search
- ✅ `GET /search?q=` — role-aware global search (module `src/modules/search/`). Returns grouped results `{ users, classes, vocabulary, goals, sessions }`, each capped to 6. Scoping: every user searches their **own** vocabulary/goals/sessions; classes are scoped (ADMIN→all, TUTOR/STUDENT→classes they belong to, archived excluded); users are **ADMIN only** (stealth `isInternal` accounts always excluded). Query requires min 2 chars; rate-limited 30/min per user. Powers the frontend header command palette.

### Admin & Notifications
- ✅ `GET /admin/dashboard` — platform-wide stats for the admin panel: total users by role, active subscriptions by plan (FREE/GOLD/PREMIUM counts), daily/weekly active users (users with a session in last 1/7 days), total sessions today, revenue by payment method (CASH/FIB/STRIPE). Single aggregated query, no pagination needed.
- ✅ `GET /users/me/notifications` + `PATCH /users/me/notifications/read-all` + `PATCH /users/me/notifications/:id/read` — in-app notification feed. All 7 types implemented: `STREAK_MILESTONE`, `GOAL_COMPLETED`, `GOAL_ASSIGNED`, `VOCABULARY_ASSIGNED`, `CLASS_ANNOUNCEMENT`, `TASK_ASSIGNED`, `TASK_SUBMITTED`. Filter by `?read=false`. Notification model has a `data Json?` field carrying routing metadata (`{ classId, taskId, goalId, vocabularyId }`) — used by the frontend to deep-link to the relevant page+tab.
