# Backend Task Board

Tasks are ordered by recommended priority. Work top-to-bottom.

---

## 1. Teacher Task System ✅ DONE (2026-06-11)
Tutors assign homework/tasks with deadlines. Students submit their work. Tutor gives feedback.

- ✅ New `Task` and `TaskSubmission` models in Prisma schema + `TaskStatus` enum (OPEN/CLOSED)
- ✅ `TASK_ASSIGNED` + `TASK_SUBMITTED` added to `NotificationType` enum
- ✅ `POST /classes/:id/tasks` — tutor creates a task with title, description, deadline
- ✅ `GET /classes/:id/tasks` — list tasks for a class (tutors/admins get submissionCount, students get mySubmission)
- ✅ `GET /tasks/:id` — task detail
- ✅ `PATCH /tasks/:id` — tutor updates title/description/deadline or opens/closes a task (`closed: bool`)
- ✅ `DELETE /tasks/:id` — tutor deletes
- ✅ `POST /tasks/:id/submissions` — student uploads their submission (text or fileUrl; 409 if already submitted or task closed)
- ✅ `GET /tasks/:id/submissions` — tutor lists submissions for a task
- ✅ `PATCH /tasks/:id/submissions/:submissionId/feedback` — tutor writes feedback
- ✅ Notifications: TASK_ASSIGNED → all students on create; TASK_SUBMITTED → all tutors on submit
- ✅ Added to `frontend/TASKS.md` so Rekar knows what to wire
- ✅ `bun run db:push` applied schema to DB; `bun run generate:types` updated `frontend/types/api.ts`

---

## 2. CI/CD Pipeline — GitHub Actions ✅ DONE (2026-06-12)
Automated checks on every push to main and on PRs.

- ✅ `.github/workflows/ci.yml` created — two parallel jobs: `typecheck` and `test`
- ✅ `typecheck` job: `bun install` → `prisma generate` → `tsc --noEmit` (dummy DATABASE_URL, no real DB needed)
- ✅ `test` job: spins up a **Postgres 16 service container** (no external secret needed) → `prisma generate` → `test:setup:env` (db push + seed) → `test:env` (239 tests, AI mocked, FIB stubbed)
- ✅ Concurrency group cancels redundant runs on the same branch
- **Manual step required:** Enable branch protection in GitHub repo settings:
  `Settings → Branches → Add rule for main → "Require status checks to pass before merging"` → select `Typecheck` and `Integration tests`
- **CD deferred:** auto-deploy to Render will be wired in Task 5 (Hosting) once a host is configured

---

## 3. Docker — Local Dev Setup ✅ DONE (2026-06-12)
One-command local stack for onboarding without Infisical or cloud accounts.

- ✅ `backend/Dockerfile` — multi-stage: `deps` (full install + prisma generate) → `dev` (db push + bun --watch) → `prod-deps` → `production` (prod-only deps, ready for Task 5)
- ✅ `docker-compose.yml` at repo root — services: `api` (dev target), `postgres:16-alpine`, `redis:7-alpine`; healthchecks; persistent `pgdata` volume; targeted bind mounts for hot reload; optional AI keys via root `.env`
- ✅ `backend/.dockerignore` — excludes node_modules, .env*, uploads, logs, docs, openapi.json, .git
- ✅ `backend/docs/services/docker.md` — quickstart, seeding, infra-only mode, hot reload scope, troubleshooting
- ✅ Root `.gitignore` updated: `/.env` (compose interpolation file) is now gitignored
- ✅ Root `CLAUDE.md` updated: Docker compose listed as the no-Infisical dev alternative

---

## 4. Account Migration — All Services → Business IT Email
Everything is currently on Aland's personal accounts. Must move before production launch.

**Services to migrate:**
- Neon Postgres (current DB + test DB)
- Infisical project `esl-chatbot` (ownership + billing)
- Google OAuth client (`GOOGLE_CLIENT_ID` + frontend `NUXT_PUBLIC_GOOGLE_CLIENT_ID`) — re-create under business account, update Authorized JS origins for prod domain
- Resend (`RESEND_API_KEY`, `EMAIL_FROM`) — move off `onboarding@resend.dev` to verified sending domain
- Cloudflare R2 (`R2_*`, bucket `tutelage-uploads`)
- Gemini API key (`GEMINI_API_KEY`)
- OpenAI API key (`OPENAI_API_KEY`) — PREMIUM tier
- Azure Speech (`AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION`)
- Deepgram (`DEEPGRAM_API_KEY`)
- Upstash Redis (`REDIS_URL`)

**After migration:** rotate every secret (old dev values were shared in chat and are compromised). Update Infisical `prod` env with all new values.

---

## 5. Hosting & Deployment
In progress (started 2026-07-02). **Backend is LIVE.** Business owner's email is the account
owner; Aland is fronting hosting cost on his personal card until the owner's card is ready.

**Identity for all new infra:** dedicated business Gmail `tutelage.it.team@gmail.com`
(NOT Aland's personal), every credential in Bitwarden. `Alandkf` added as a second GitHub
org owner after the 2026-07-02→07-10 account-suspension incident (single-point-of-failure fix).

**Host decision — researched and confirmed 2026-07-02** (compared Render, Railway,
Fly.io, Vercel on cost/reliability/fit for our Bun+WebSocket+cron workload; see
`docs/handover/deployment-runbook.md` §1 for the writeup and sources):
- **Backend → Render** (Starter, $7/mo target). `render.yaml` blueprint committed at the repo root.
- **Frontend → Vercel** (Pro, $20/mo — Hobby forbids commercial use).

**Infra provisioned under the business email (all in Bitwarden):**
- ✅ Render service `tutelage-api` — LIVE at `https://tutelage-api.onrender.com` (Frankfurt,
  Docker `production` stage, deploys from `main` via `render.yaml`). On the **Free** instance
  for now (deliberate — no traffic yet; flip to Starter before public launch).
- ✅ Neon (`tutelage-prod` project + `test` branch for TEST_DATABASE_URL, Frankfurt, direct/unpooled URL)
- ✅ Upstash Redis (`tutelage-prod`, Frankfurt, `rediss://` TLS)
- ✅ Cloudflare R2 (bucket `tutelage-uploads`, public R2.dev URL, scoped token)
- ✅ Prod DB migrations run (`prisma migrate deploy` — fresh Neon, no baseline dance needed)
- ✅ Prod-only fixes shipped during first deploy: dropped Winston file transports (EACCES on
  non-root container) + multi-origin comma-separated `CORS_ORIGIN`.

**Frontend / domain:**
- ✅ Rekar's Vercel deploy is LIVE at `https://ai.tutelage.krd`. DNS is managed directly at
  **Namecheap** (Cloudflare turned out not to be involved — all records go in Namecheap's
  Advanced DNS for `tutelage.krd`).

**AI / service provider keys** (overlaps Task 4 rotation):
- ⚠️ Gemini (`GEMINI_API_KEY`) — **running on Aland's personal-account key** (2026-07-17).
  The business account (`tutelage.it.team@gmail.com`) is **denied Gemini API access
  account-wide**: every key, even from a fresh AI Studio project, returns "Your project
  has been denied access. Please contact support." (likely fallout from the July account
  suspension; billing can't be added either — no Iraq option). Needs a Google support
  ticket or the Payoneer/Wise billing route to fix; until then the personal key is the
  working fallback. Migrate in Task 4. **AI chat verified working E2E on prod 2026-07-17**
  (register → verify → session → message → Gemini reply + evaluation).
  - 🔴 **Gemini geo-block incident (2026-07-23):** prod LLM started 500ing with
    `AI error: User location is not supported for the API use`. Root cause is **NOT** the
    key or the Iraq account — a well-formed curl with the same personal key succeeds even
    from Aland's machine in Iraq. It's Google's Gemini API geo-checking the **caller's IP**
    (i.e. Render's egress), and **Render Free tier has no stable outbound IP** — a
    spin-down/redeploy moved the service onto an IP Google rejects (datacenter/ambiguous
    range). It "worked yesterday" only because the instance sat on an accepted IP.
    Note: this is a *server-side* problem — users' own locations are irrelevant (Gemini
    only ever sees Render's IP), so global users are not individually blocked.
  - ✅ **Fix shipped (2026-07-23):** FREE/GOLD now fall back to OpenAI (`gpt-5-mini`) on
    ANY Gemini failure (`ai.service.ts`), logged loudly via Winston warn + Sentry warning
    (`ai.provider=gemini`, `ai.fallback=openai`) so Gemini outages stay visible, never
    silently masked. Also fixed the OpenAI call for the reasoning model: `gpt-5-mini`
    needs `max_completion_tokens` (not `max_tokens`) and rejects `temperature`
    (`openai.llm.ts`) — the fallback 400'd on first real use until this landed.
  - **Durable fixes for reliable Gemini (in order of effort):** (1) flip Render Free →
    Starter — dedicated instance, no spin-down = stable IP that Google is more likely to
    accept (cheap, try first); (2) **Vertex AI** — the region-pinned enterprise Gemini
    endpoint has NO consumer geo-block, so it works from any server IP — but needs GCP
    billing (the Iraq/Payoneer wall). **Rejected idea:** a second Gemini key from another
    account (e.g. Rekar's) does NOT help — the block is per-IP, so both keys fail
    identically from the same Render IP; a 2nd key only helps for quota/account-suspension,
    which isn't the current problem, and coupling prod to a personal account is the wrong
    direction while migrating onto business accounts.
- ✅ Deepgram (`DEEPGRAM_API_KEY`, saved in backend env)
- [ ] Azure Speech (`AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION`)
- [ ] OpenAI (`OPENAI_API_KEY`, PREMIUM tier)
- ✅ Resend — **fully DONE & smoke-tested E2E on prod (2026-07-17)**: domain `tutelage.krd`
  verified (eu-west-1, DNS at Namecheap), `tutelage-prod` API key (Sending access, scoped
  to the domain), `RESEND_API_KEY` + `EMAIL_FROM=Tutelage <noreply@tutelage.krd>` set on
  Render. Verified live: register → OTP email delivered → verify-email → FREE ACTIVE + tokens.
  Gotchas hit: `EMAIL_FROM` must be `Name <addr>` or bare `addr` (bare `<addr>` → Resend 422);
  domain-scoped API keys break when the domain is deleted/re-added. Cleanup notes: test user
  `aland_smoketest` exists in prod DB; local `.env` still has the old personal-account dev key
  (rotate in Task 4).

**Remaining steps:**
- ✅ Google OAuth — prod origins added to the single business-account client
      (`ai.tutelage.krd`, `tutelage-api.onrender.com`, localhost) 2026-07-17; **verified
      working live 2026-07-20** (Aland + friends registered real accounts on prod).
- ✅ DNS for `ai.tutelage.krd` done; Rekar wired `NUXT_PUBLIC_BASE_URL` to Render.
- ✅ `CORS_ORIGIN` (comma-separated) + `FRONTEND_URL` set on Render (2026-07-17).
- [ ] Populate remaining Render env vars: `AZURE_SPEECH_KEY`/`REGION` + `OPENAI_API_KEY`
      (PREMIUM tier only). **Mitigated 2026-07-20:** `generateTTS` now falls back to Edge TTS
      (keyless) when no paid TTS key is set, so prod Voice Lab speaks instead of returning
      silent audio. Azure key still wanted pre-launch (Edge endpoint is unofficial, no SLA;
      Azure signup may hit the same Iraq-billing wall as Google — check free F0 tier).
- 🔄 Private beta: **underway (2026-07-20)** — Aland + friends registered and are using prod.
      Still to do: owner tries it; collect feedback.
- [ ] Flip Render Free → Starter before public launch (~50s cold starts now hit real
      beta users — consider flipping early)
- [ ] Smoke-test all critical paths (§5 below) before announcing

**Small follow-ups found during the Resend rollout (2026-07-17):**
- ✅ **Bug: auth emails swallow Resend errors** — fixed (`ec787f9`): all 4 send sites in
      `auth.service.ts` now check `{ error }` and throw, same pattern as `weekly-digest.job.ts`.
- [ ] Swagger (`/api-docs`) is publicly exposed on prod — decide whether to disable or
      protect it before public launch.
- ✅ `docs/services/hosting.md` health-endpoint typo fixed (`/api/v1/health` → `/health`, 2026-07-20).
- [ ] Delete the `aland_smoketest` prod test user (beta is live, no longer needed). Run in
      the Neon SQL console: `DELETE FROM users WHERE username = 'aland_smoketest';`
      (all user-owned relations cascade).

**Pre-deploy checklist:**
- [ ] `bun run typecheck` passes
- [ ] `bun test` passes (auth + sessions minimum)
- ✅ All Prisma migrations committed
- [ ] All prod secrets in Infisical `prod` env
- [ ] `CORS_ORIGIN` set to live frontend domain
- ✅ Health endpoint responding (Render `tutelage-api` boots + serves `/api/v1/health`)

---

## 6. FIB Production Submission
Unblocked once the app is hosted and has a public URL.

- Code is 100% complete (webhook 202, fail-fast guard, reconcile job, docs)
- Fill in business fields in `docs/payment/fib-preproduction-checklist.md` (business name, IBAN, contacts, logo 500×500 PNG)
- Set `FIB_ENV=prod`, real `FIB_CLIENT_ID`/`FIB_CLIENT_SECRET`, `FIB_WEBHOOK_URL` in Infisical `prod`
- Submit checklist to FIB — they issue live credentials
- Smoke-test one real low-value subscription end-to-end
- Note: FIB charges 1% commission per transaction — confirm pricing accounts for it

---

## 7. Weekly Digest Email ✅ DONE (2026-06-12)
Resend is already wired (welcome + password reset done). This adds the weekly summary.

- ✅ `emailDigestEnabled Boolean @default(true)` + `digestLastSentAt DateTime?` added to `LearnerProfile`; migration `20260612150622_add_email_digest_fields` applied
- ✅ `PATCH /users/me/learner-profile` accepts `emailDigestEnabled` (opt-out toggle); exposed in `GET /users/me` and `GET /users/:id` responses; Swagger + `frontend/types/api.ts` updated
- ✅ `FRONTEND_URL` optional env var added (`config/env.ts` + `.env.example`); digest CTA defaults to `CORS_ORIGIN`
- ✅ Cron changed to hourly tick (`0 * * * *`); `runWeeklyDigestJob()` matches users whose local time is **Sunday 08:00** per `LearnerProfile.timezone` — satisfies both "Sunday 08:00" and "respect timezone" spec requirements
- ✅ Email content: streak, study time, sessions, messages, vocab reviewed, skill scores (grammar/vocab/fluency) with weekly delta from `Progress.skillSnapshot`, vocab due, active goals (truncated 80 chars), CTA button, "turn off in Settings → Profile" footer note
- ✅ HTML builder split into `src/jobs/weekly-digest.email.ts`; orchestration in `weekly-digest.job.ts`
- ✅ Fixed Resend SDK bug: SDK returns `{ data, error }` not throws — now checks `if (error) throw` so per-user `catch + failed++` actually fires on API errors
- ✅ `digestLastSentAt` stamped only on success; 6-day dedup guard prevents double-sends from DST shifts or manual reruns
- ✅ `bun run job:digest` (+ `-- --force`) dev trigger in `scripts/run-digest.ts`
- ✅ Seed: `student_yuki` has `emailDigestEnabled: false`; `student_ali` defaults to `true` — lets `--force` verify the filter
- ✅ Tests: `src/jobs/__tests__/weekly-digest.test.ts` (unit: `isLocalSundayDigestHour`, `buildDigestHtml`, `esc`); 3 new integration tests in `users.router.test.ts` (set false/true, 422 non-boolean, `GET /users/me` includes field)
- **Follow-up (pre-launch):** tokenized one-click unsubscribe link — settings toggle is sufficient for now
- **Prod note:** set `FRONTEND_URL` in Infisical `prod` env to the live frontend domain

---

## 8. User Agreement / Terms of Service Signing ✅ DONE (2026-06-17, infra) — ⚠️ placeholder text pending
Legal requirement before charging users. **Plumbing is final; only the legal copy is outstanding.**

- ✅ New `UserAgreement` model: `{ userId, version, ipAddress, acceptedAt }`, `@@unique([userId, version])` (one row per accepted version = full audit history); migration `20260617190000_add_user_agreement`
- ✅ Agreement content + version live in `src/modules/auth/agreement.content.ts` (`CURRENT_AGREEMENT`, currently v1.0). Bumping `version` forces every user to re-accept — no code/migration change. The `text` is a **project-specific v1.0 template** (real Tutelage terms: service, tiers, FIB/cash payment, AI-content disclaimer, classes, data, etc.); have legal/owner review the `[Company]`/governing-law/refund clauses, then bump version — nothing else changes.
- ✅ `GET /auth/agreement` — public; returns `{ version, effectiveDate, text }`
- ✅ `POST /auth/register` now requires `acceptAgreement: true` (422 otherwise); records acceptance with version + `req.ip` inside the create transaction. Google new-account branch (`POST /auth/google` with username) requires `acceptAgreement: true` too (400 otherwise).
- ✅ Re-accept guard on **both** `POST /auth/login` and the existing-user/merge paths of `POST /auth/google` → **403** `{ needsAgreement: true, agreementVersion }` (via new `AppError.details`) when the current version isn't accepted. Blocked user calls **`POST /auth/accept-agreement`** — `{ username, password }` (LOCAL) or `{ idToken }` (Google, no password) — re-proves identity, records acceptance, returns tokens. (Google guard added in review so version bumps truly force *everyone* to re-accept, not just password users.)
- ✅ `errorHandler` hardened: `AppError.details` is spread so it can only *add* fields, never clobber `success`/`message`/`data`.
- ✅ Seed: all 5 seed users get an acceptance row so they can log in. Existing prod users (none accepted yet) will be prompted to re-accept on first login post-deploy — intended.
- ✅ Tests: 8 new cases in `auth.router.test.ts` (GET agreement, login 403 needsAgreement, accept-agreement records + unblocks, wrong-pw 400, idToken-variant 401/503, 422 ×2, register-without-agreement 422). Auth suite **50 pass**; full suite green (heavy DB tests occasionally hit the 5s timeout on remote Neon — environmental, not logic).
- **Remaining (business):** provide final Terms text → drop into `agreement.content.ts` + bump version. Frontend (Rekar): register checkbox + login-403 `needsAgreement` re-accept modal (noted in `frontend/TASKS.md`).
- **Prod note (Task 5):** baseline `20260617190000_add_user_agreement` alongside the other catch-up migrations before `migrate deploy` (see Account/Hosting runbook in `docs/handover/`).

---

## 9. Hidden Programmer Admin ✅ DONE (2026-06-12)
A stealth monitoring account not visible as "ADMIN" to anyone — including other admins.

- ✅ Approach decided: `isInternal Boolean @default(false)` on the User model (NOT a new role — keeps every `authorize("ADMIN")` callsite and the shared `Role` enum untouched)
- ✅ `isInternal` is never serialized in any API response, never in Swagger (`frontend/types/api.ts` unchanged), and not settable via any endpoint — set only via seed (dev) or direct SQL (prod)
- ✅ Excluded from `GET /users` (incl. `?search=` and `?role=` filters); `GET /users/:id` → 404
- ✅ All 6 admin mutation routes (`PATCH /admin/users/:id`, profile, avatar, learner-profile, PUT/DELETE subscription) → 404 on internal targets (`assertTargetNotInternal` in `admin.service.ts`)
- ✅ Admin dashboard counts exclude internal users (roles, subscriptions by plan, DAU/WAU, sessions today, revenue by provider)
- ✅ Hidden from class member lists, student rosters, student detail (404), class analytics, and `memberCount` on `GET /classes` + `/classes/mine`; tutor dashboard excludes them
- ✅ Notification/email fan-outs skip internal recipients (announcements, TASK_ASSIGNED, TASK_SUBMITTED, weekly digest)
- ✅ Full access preserved: internal account passes all role guards, can join classes, list users, view dashboards
- ✅ Seed: `sys_monitor` / monitor@tutelage.com (`password123`) — stealth ADMIN with FREE ACTIVE sub + zeroed metrics
- ✅ Catch-up migration generated via `bun run db:migrate` (bundles drifted Task-system/archiving/vocab changes + `isInternal`)
- ✅ Tests: stealth describe blocks in users/admin/classes/tutor router tests; `createTestUser({ isInternal: true })` helper
- **Prod note (Task 5):** the prod DB was schema-pushed, so before `migrate deploy` it must be baselined with `prisma migrate resolve --applied <catch-up-migration>`. Create the prod internal account via SQL with a non-guessable username/email.

---

## 10. Documentation × 3 Audiences
Content task — coordinate with business owner for non-technical sections.

- ✅ **Developer doc** (complex) — DONE (2026-06-17): `docs/handover/` — `developer-guide.md`
  (architecture, onboarding, testing, CI, module map), `deployment-runbook.md` (hosting +
  the migration-baseline procedure + FIB + smoke tests + rollback), `secret-rotation.md`
  (account migration + rotating every credential). `backend/CLAUDE.md` already kept current.
- **Business owner doc** (simple): monthly costs breakdown (AI, hosting, storage, email), how subscriptions work, how to use the admin panel, who to contact for support — **blocked: needs owner's cost numbers**
- **Investor doc** (medium): product overview, market, tech stack summary, growth levers, subscription tiers — **blocked: needs owner's market/business input**

> **Prod-hardening note:** the `NODE_ENV=production` + `FIB_WEBHOOK_URL` startup guard is
> already implemented in `src/config/env.ts` (fails fast only when `FIB_CLIENT_ID` is set
> without a webhook URL). The migration-baseline procedure is documented in
> `docs/handover/deployment-runbook.md`.

---

## 11. AI Reply HTML Formatting ✅ DONE (2026-07-18)
AI chat replies were plain prose in a JSON string. Now formatted with a small safe HTML tag
set so the frontend can render bullets/paragraphs/emphasis via `v-html` instead of a wall of text.

- ✅ `prompt.ts` — system prompt now instructs the model to format `reply` using only
  `p, strong, em, ul, ol, li, br` (no markdown, no other tags/attributes); list guidance
  (2+ items → `<ul>/<ol>`, don't force a list for one point)
- ✅ `src/utils/aiReplyFormat.ts` (NEW) — `sanitizeAiReply()` allowlist-sanitizes the model's
  raw JSON output (`sanitize-html`, new dep) to the same 7 tags before it's stored or returned —
  the LLM's JSON has zero schema validation, and `reply` is now headed for `v-html` on the
  frontend, so this is the stored-XSS guard. Wired at the single choke point in
  `ai.service.ts` (`generateAIResponse` wraps the provider call and sanitizes on the way out) —
  covers both text and voice messages with one change.
- ✅ `stripHtmlForSpeech()` in the same file — voice mode feeds `aiResult.reply` straight into
  TTS (`voice-messages.service.ts`); without stripping, Azure/Edge/OpenAI TTS would read the
  tag names aloud. Block boundaries (`</p>`, `</li>`, `<br>`) become a space first so list items
  don't run together into one sentence.
- ✅ **Hardened after an 8-angle code review (2026-07-19)** — review found 10 issues, all fixed:
  - **TTS entity bug**: sanitize-html entity-encodes text (`&` → `&amp;`), so TTS would have
    spoken "Tom amp Jerry". `htmlToPlainText` now decodes entities; strip moved INSIDE
    `generateTTS` so no future caller can make the tutor read tags aloud.
  - **Word counts**: `aiWordCount` was splitting the HTML string (tags glued words together) —
    both message services now use `countAiReplyWords()` (visible words only).
  - **Evaluation fields**: prompt trains the model to emit tags, which bleeds into
    feedback/corrections — `cleanEvaluation()` in `ai.service.ts` now strips every
    model-authored evaluation text field to plain text (they render via `{{ }}` in the UI).
  - **Empty/plain replies**: a reply that sanitizes to nothing gets a friendly fallback; a
    plain-prose reply (heuristic placeholder, model regression) is auto-wrapped in `<p>`.
  - **Single source of truth**: `AI_REPLY_ALLOWED_TAGS` exported and interpolated into the
    prompt — the sanitizer allowlist and the prompt can never drift. Prompt also condensed
    (~60 % fewer added tokens/call) + "warm, specific, honest" tone line.
  - **OpenAI `max_tokens` 1500 → 2500** (matches Gemini): HTML inflates output; truncated JSON
    = unparseable = full paid retry on Gemini. Unused headroom is free.
  - **Swagger fixed** ("text reply" → sanitized-HTML description on all 3 message schemas) +
    `bun run generate:types` run; dev test pages (ai-test/voice-test/socket-test html) now
    render the reply as HTML.
- ✅ **16 new unit tests** in `src/utils/__tests__/aiReplyFormat.test.ts` (DB-free — they run
  even while `TEST_DATABASE_URL` auth is broken): XSS strip (script/onerror/javascript:),
  entity decode for TTS, prose wrapping, word counts, tag-contract lock. All pass. Typecheck clean.
- **Frontend note** in `frontend/TASKS.md` for Rekar covers all 4 render spots (MessageBubble,
  voice-lab caption + transcript, AppText `htmlContent` reuse), legacy plain-text rows, and the
  deploy-together warning.
- **Follow-ups:**
  - Re-run the DB-backed message/voice suites once `TEST_DATABASE_URL` is fixed (local `.env`
    credential is stale/rotated — TCP reaches Neon fine, auth fails).
  - Consider full Zod validation of the LLM's `AIResponse` payload (scores/CEFR enums are still
    trusted as-is; the codebase already uses Zod everywhere else) — right-depth fix, deferred.
  - Deploy backend + frontend together (or frontend first is harmless) — backend-first shows
    literal tags in bubbles until Rekar's change lands.

---

## Blocked

### FIB Payment — Waiting for Deployment
See task 6 above. Code is complete; only the live URL is missing.

### Stripe Integration — Long-Term Future
Not started. Add after FIB is live and the business wants a second payment option.

### Lessons Module — Deferred
No `Lesson` model or data source yet. `lessonsCompleted`, `readingSkill`, `writingSkill`, `listeningSkill` in `UserMetrics` are zeroed placeholders. Build when the business defines what a "lesson" is.
