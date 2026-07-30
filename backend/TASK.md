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

## 4. Account Migration — All Services → Business IT Email — 🟡 MOSTLY DONE
Business identity is **`tutelage.it.team@gmail.com`** (dedicated business Gmail, not Aland's
personal); every credential lives in Bitwarden. Prod infra was **provisioned fresh under the
business account** rather than transferred, so most of this task completed as part of Task 5.

**Migrated / provisioned under the business account:**
- ✅ Neon Postgres — new `tutelage-prod` project + `test` branch (Frankfurt, direct/unpooled URL)
- ✅ Upstash Redis (`REDIS_URL`) — `tutelage-prod`, Frankfurt, `rediss://` TLS
- ✅ Cloudflare R2 (`R2_*`, bucket `tutelage-uploads`) — public R2.dev URL, scoped token
- ✅ Resend (`RESEND_API_KEY`, `EMAIL_FROM`) — off `onboarding@resend.dev`; domain `tutelage.krd`
      verified, sending as `Tutelage <noreply@tutelage.krd>`
- ✅ Google OAuth (`GOOGLE_CLIENT_ID` / `NUXT_PUBLIC_GOOGLE_CLIENT_ID`) — single business-account
      client, prod JS origins added, verified live with real user signups
- ✅ Azure Speech + ✅ OpenAI + ✅ Deepgram — all on the business account (2026-07-23)
- ✅ Render + GitHub org `tutelage-ESL` (`Alandkf` added as 2nd org owner after the July suspension
      incident — single-point-of-failure fix)

**Still outstanding:**
- 🔴 **Gemini (`GEMINI_API_KEY`) — still on Aland's PERSONAL key.** The business account is denied
      Gemini API access account-wide, and billing can't be added (no Iraq option). This is the one
      genuine handover blocker left. Needs a Google support ticket, or the Payoneer billing route,
      or Vertex AI (needs GCP billing → same wall). Mitigated in code by the OpenAI fallback.
- 🔴 **Vercel** — business signup is impossible for now (hard-requires SMS verification, Iraq +964
      unsupported), so Rekar hosts the frontend on his **personal** Vercel account.
- 🟡 **Infisical project `esl-chatbot`** — ownership/billing not yet moved.
- 🟡 **Namecheap / `tutelage.krd` domain** — registered on Aland's personal Namecheap account.
- [ ] **Rotate every secret** — old dev values were shared in chat and are compromised. Procedure in
      `docs/handover/secret-rotation.md`.
- [ ] Aland is **fronting hosting cost on his personal card** until the owner's card is ready.

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
- ✅ Azure Speech (`AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION=germanywestcentral`) — **LIVE on prod
  2026-07-23**, voice TTS+STT tested E2E from the frontend Voice Lab. Resource created on the
  BUSINESS account (F0 free tier); the earlier "signup blocked" wall was a **WiFi-network block on
  Microsoft signup**, not the email — creating it over mobile-data hotspot worked. ⚠️ GOTCHA: once
  `AZURE_SPEECH_KEY` is set there is NO Edge-TTS fallback for FREE/GOLD (`ai.service.ts` ~L215), so a
  wrong region string silently breaks voice — the short lowercase region code must be exact.
- ✅ OpenAI (`OPENAI_API_KEY`, PREMIUM tier) — **LIVE on prod 2026-07-23**; business card added +
  $5 credit. Also serves as the FREE/GOLD fallback when Gemini geo-blocks (see below).
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
- ✅ Populate remaining Render env vars: `AZURE_SPEECH_KEY`/`REGION` + `OPENAI_API_KEY` — **DONE
      2026-07-23**, voice fully working E2E on prod. (The 2026-07-20 keyless Edge-TTS fallback in
      `generateTTS` is therefore no longer the prod path for FREE/GOLD; it remains as a safety net
      only when no paid TTS key is set at all.)
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

## 6. FIB Production Submission — 🟢 NOW FULLY UNBLOCKED (as of 2026-07-23)
**Every prerequisite is met — this is the top actionable item on the board.** Code has been 100%
complete and sandbox-verified E2E since 2026-05-31 (real DRAFT → paid → ACTIVE transaction).

Prerequisites, all now satisfied:
- ✅ App hosted with a public URL — frontend `ai.tutelage.krd`, backend `api.ai.tutelage.krd`
- ✅ Business owner has filled in his parts of FIB's Integration Request Form (document in hand)
- ✅ Backend custom domain — was the last blocker; resolved 2026-07-23. Rekar had already attached
      `api.ai.tutelage.krd` to the Render service (note: `api.ai.`, **not** `api.tutelage.krd`)

Remaining steps to actually ship it:
- [ ] Finish business fields in `docs/payment/fib-preproduction-checklist.md` (business name, IBAN,
      contacts, logo 500×500 PNG)
- [ ] Submit the checklist to FIB → they issue live credentials
- [ ] On receipt, set `FIB_ENV=prod` + real `FIB_CLIENT_ID`/`FIB_CLIENT_SECRET` +
      `FIB_WEBHOOK_URL=https://api.ai.tutelage.krd/api/v1/subscriptions/webhook/fib` on Render.
      **No code change needed** — the base URL switches off `FIB_ENV`.
- [ ] Smoke-test one real low-value subscription end-to-end
- [ ] Confirm the IQD prices in `PLAN_AMOUNTS_IQD` (`subscriptions.service.ts`) with the owner —
      they are still placeholders, and FIB charges **1% commission per transaction**

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

## 12. FIB Payment Recovery — QR no longer lost / no longer blocks ✅ DONE (2026-07-25)
Found in the first live stage test on prod. Two defects, one dead end:
clicking **Open FIB App** navigated the SPA to the 404 page (the deep link was bound to
`:to`, so vue-router tried to resolve it as an in-app route), which destroyed the payment
dialog **and** the QR with it. Retrying then hit *"You already have a pending FIB
subscription"* — the DRAFT blocked new attempts and its QR existed nowhere, so the user was
locked out of paying until the DRAFT expired (36h).

- ✅ **Root cause of the vanishing QR:** `createSubscription`'s `qrCode` / `readableCode` /
  `appLink` were never persisted, and FIB's `GET /subscriptions/:id` does **not** return them —
  once the dialog closed, the payment was unrecoverable by design.
- ✅ `FibSubscription` gains `qrCode` / `readableCode` / `appLink` (all nullable) + migration
  `20260725000000_add_fib_payment_artifacts` (idempotent `ADD COLUMN IF NOT EXISTS`, same
  pattern as the notification-data catch-up migration)
- ✅ `initiateFibSubscription` no longer dead-ends on a pending DRAFT:
  - expired DRAFTs are swept (`validUntil <= now` → CANCELLED) — they are dead at FIB anyway
  - same plan + interval → **returns the existing payment** (`resumed: true`), so the endpoint
    is idempotent and a repeat click re-opens the same QR instead of erroring
  - different plan/interval → still 409 (a second payable subscription risks a double charge),
    but the body now carries `pendingFib { fibSubscriptionId, plan, intervalMonths, amountIQD,
    validUntil }` so the UI can offer resume-or-cancel
  - a DRAFT with no stored QR (pre-migration row) is discarded rather than blocking forever —
    **this is what unblocks the stuck DRAFT already sitting in the prod DB**
- ✅ ACTIVE/TRIAL FIB records still hard-block (backstop for the window where FIB has activated
  but the `Subscription` row hasn't synced)
- ✅ NEW `GET /subscriptions/fib/pending` — returns the pending payment (QR, manual code, app
  link, plan, amount) or `null`; sweeps expired DRAFTs on read; never leaks another user's payment
- ✅ `InitiateFibResult` now echoes `plan` / `intervalMonths` / `amountIQD` so a resumed payment
  renders with its own price rather than whatever the client currently has selected
- ✅ Swagger updated on both routes + `bun run generate:types`
- ✅ Tests: 4 new initiate cases (different-plan 409 + `pendingFib`, same-plan resume with no 2nd
  FIB call, expired sweep, legacy-row discard) and a new 5-case `GET /fib/pending` block
  (found, null, expired-swept, cross-user isolation, 401)
- **Frontend fixes** (see `frontend/TASKS.md`): deep link opens via `window.open` in a new tab
  instead of router navigation, "Payment waiting" recovery card on the billing page, modal now
  shows the resumed payment's own plan/price.
- ⚠️ **Deploy note:** run `prisma migrate deploy` on prod (or the three `ALTER TABLE` statements
  in the migration) **before** the new code serves traffic — `initiate-fib` selects the new
  columns and will 500 against an un-migrated DB.
- ⚠️ **`FIB_ENV=stage` is currently live on prod** — the Billing page's payment flow is a FIB
  **sandbox** transaction. Fine for testing, but no beta user should be told it's a real
  purchase until Task 6 lands prod credentials.

---

## 13. Payment integrity fixes + cancellation policy ✅ DONE (2026-07-26)

Found while live-testing FIB on prod. Two of these took real money without granting a plan.

- ✅ **Activation died when the user had no `Subscription` row.** `applyFibStatusChange` used
  `prisma.subscription.update`, which throws P2025 on a missing row — and since it runs inside
  `$transaction`, the rollback also reverted the `FibSubscription` update. FIB kept the money, the
  record stayed DRAFT, and the reconcile cron re-failed identically every 15 min forever. A
  `Subscription` row is only created at registration, so any gap loses a payment. Now `upsert`.
- ✅ **Cancelling a DRAFT discarded payments won by a race.** Pay → hit Cancel before FIB's callback
  lands → the DRAFT branch marked it CANCELLED locally *without asking FIB*, and the reconcile job
  then skipped it forever (it only scans DRAFTs). Cancel now re-verifies with FIB: ACTIVE/TRIAL
  activates the plan and returns 409 explaining it; still-DRAFT discards as before; FIB unreachable
  → 503 rather than risk discarding a payment.
- ✅ **Both were invisible** (webhook controller swallows errors after its 202; frontend poll ignores
  failures). Activation failures now hit **Sentry** from the webhook and the reconcile job.
- ✅ **Cancellation policy decided (2026-07-26): keep access to period end, NO refunds.** Rationale:
  FIB's 1% commission is non-refundable, FIB's API has no refund endpoint (every refund would be a
  manual bank transfer), AI usage is a real marginal cost so prorated refunds invite
  subscribe-binge-refund, and it matches universal SaaS practice. Discretionary refunds stay a
  manual admin decision. Implemented via `Subscription.cancelAtPeriodEnd` (migration
  `20260726000000_add_cancel_at_period_end`): cancelling stops the FIB renewal and keeps
  plan/status/`currentPeriodEnd` intact; the existing expiry paths (cron + lazy check in
  `createSession`) do the downgrade and reset the flag. Falls back to an immediate downgrade when
  there's no paid time left, else a null `currentPeriodEnd` would keep the plan alive forever.
  Exposed as `cancelAtPeriodEnd` on `GET /users/me/subscription`; the UI shows
  "Cancelled — active until <date>" instead of the Cancel button.
  - This also **fixed a live mismatch**: the UI promised "you'll keep access until <date>" while the
    backend set `plan=FREE, currentPeriodEnd=now` on the spot, taking away days already paid for.
- ✅ 6 new tests (missing-row activation, paid-during-cancel, unpaid-cancel verification,
  FIB-unreachable refusal, cancel-keeps-period, cancel-with-no-time-left).

---

## 14. Recurring FIB payments were never re-synced ✅ DONE (2026-07-26)
Found while designing Task 15; it would have bitten the first real multi-month subscriber.

FIB subscriptions are **recurring** (`interval: P1M/P3M/...`), so FIB charges again automatically
each period. But `applyFibStatusChange` early-returns when the status is unchanged
(`if (record.fibStatus === incomingStatus) return`), and the reconcile cron **only scans DRAFT**
rows. So when FIB takes month 2's payment, `activeUntil` advances at FIB while our
`currentPeriodEnd` never moves — and the subscription-expiry cron then downgrades a **paying**
customer to FREE.

Fix shipped — deliberately built so it works **whether or not** FIB posts a callback on each
recurring charge (the cron polls regardless; still worth confirming with FIB):
- ✅ `applyFibStatusChange`: an unchanged status no longer early-returns. `extendPaidPeriodIfRenewed`
  refreshes `currentPeriodEnd` from `details.activeUntil` when a live sub's paid period has moved
  forward. Only ever extends — never pulls the date backwards off a stale read — and skips subs
  with `cancelAtPeriodEnd` so a cancellation can't be resurrected.
- ✅ `fib-reconcile.job.ts` now also scans ACTIVE/TRIAL rows, scoped to those whose
  `currentPeriodEnd` is within 2 days (or past) and not cancelling — so renewals are caught even
  with no webhook, while the query stays a handful of rows per run instead of every subscriber.
- ✅ 3 tests: renewal extends the period, a cancelled sub is not extended, a stale earlier
  `activeUntil` does not shorten it.
- **Still worth verifying on FIB stage:** whether a recurring charge fires a status callback at
  all, and that `activeUntil` advances as expected on the second period.

---

## 14b. Cancellation policy unified across all three cancel paths ✅ DONE (2026-07-26)
Found in review of Task 13/14. The policy lived **only** in `cancelFibSubscription`, so a
cancellation arriving from FIB's side still ran the old immediate downgrade:

> User pays for GOLD on 1 Aug (period ends 1 Sep). On 5 Aug they cancel **in the FIB app**
> instead of the billing page → FIB posts CANCELLED → `plan=FREE, currentPeriodEnd=now`.
> 27 paid days gone, no refund. Cancelling via our UI the same day kept them until 1 Sep.

There was also a race on our own endpoint: if FIB's callback landed between
`cancelSubscription()` returning and our transaction committing, the webhook took the old
downgrade branch and then our write applied `cancelAtPeriodEnd` to an already-FREE row.

- ✅ `buildCancellationData(currentPeriodEnd, now)` is now the single source of truth, shared by
  `cancelFibSubscription` and the `isCancelling` branch of `applyFibStatusChange`. All three entry
  points (our endpoint, FIB-side cancellation, REJECTED recurring charge) behave identically.
- ✅ The cancel transaction now `upsert`s too — same class of bug as the activation P2025.
- ✅ Renewal sync no longer reverts an admin takeover: if the subscription is no longer FIB-owned
  (different plan or provider), `extendPaidPeriodIfRenewed` logs and skips instead of forcing
  plan/provider back to the FIB values.
- ✅ Reconcile job now matches `currentPeriodEnd IS NULL` explicitly — `lt` never matches NULL in
  SQL, so a live sub with no known end date was invisible to the one job that could heal it.
- ✅ 4 tests: FIB-side cancel with paid time left, FIB-side cancel with none, admin-takeover not
  reverted, plus the pre-existing downgrade test renamed to say which branch it covers.

---

## 15. Upgrades, renewal & downgrades ✅ DONE (2026-07-27)
Shipped with **one simplification vs the original design, and no migration**: instead of
scheduling downgrades via a `pendingPlan` column (which would have needed FIB to support a
delayed first charge — unverified), a single carry-over formula covers every case.

**`carryOverDays(currentPlan, currentPeriodEnd, newPlan, now)`** converts unused value on the
current plan into days on the new one, at the new plan's daily rate:
- **renewal** GOLD→GOLD — same rate, remaining days carry 1:1
- **upgrade** GOLD→PREMIUM — 15 GOLD days ≈ 12,500 IQD ≈ **8** PREMIUM days
- **downgrade** PREMIUM→GOLD — 15 PREMIUM days ≈ 22,500 IQD ≈ **27** GOLD days

Nobody loses paid time, the new plan starts immediately, and there is no scheduling state to
maintain. A downgrade simply buys GOLD now with a long carry-over instead of waiting.

- ✅ Guards relaxed: FIB→FIB is allowed (upgrade/downgrade/re-subscribe). The only refusal is
  buying the plan you already have on a live auto-renewing sub (409 "renews automatically on X").
  CASH/STRIPE still blocked — settled off-platform.
- ✅ Carry-over is applied at **activation**, computed from the Subscription row before it is
  overwritten — so no new columns were needed. Includes `paymentProvider === null`, which is the
  state a cancelled-but-still-paid subscription is in (that's the re-subscribe case).
- ✅ Activation clears `cancelAtPeriodEnd`, else the expiry sweep would drop a just-bought plan.
- ✅ `retireSupersededFibSubscriptions()` cancels the old recurring subscription at FIB **after**
  the new one is paid — never before, so an abandoned payment can't strip a live plan. Failure
  is Sentry-reported (possible double charge) but never rolls back the activation.
- ✅ `initiate-fib` + `/fib/pending` now return `changeType` (NEW/RENEWAL/UPGRADE/DOWNGRADE) and
  `carryOverDays` so the UI can explain the deal before payment.
- ✅ Frontend: the plan section is no longer hidden from paid users. Title/CTA adapt
  (Upgrade/Switch/Renew), a notice previews the carried days, and buying your current plan is
  disabled with "renews automatically on X".
- ✅ 7 new tests (blocked same-plan, upgrade preview, downgrade preview, re-subscribe after
  cancel, CASH still blocked, NEW case, and end-to-end activation applying carry-over +
  retiring the old sub).

**Still worth confirming with FIB** (does not block the feature):
- Whether cancelling subscription A while B is live has any settlement lag that could allow one
  extra charge on A. The ordering (cancel only after B is paid) bounds the exposure to at most
  one old-plan charge, which the carry-over would then under-compensate slightly.

---

## 16. Renewal reminder email ✅ DONE (2026-07-29) — **no migration needed**
Built with **structural dedup instead of the planned `renewalReminderSentAt` column**, so it
deployed without waiting on a prod SQL statement.

- ✅ `src/jobs/renewal-reminder.job.ts` — daily at **09:00 UTC**. Selects the 24-hour slice of
  subscriptions whose `currentPeriodEnd` falls exactly 3 days out, so each subscription enters
  that window on exactly one daily run. Filters: `status=ACTIVE`, `plan != FREE`,
  `paymentProvider=FIB` (only FIB auto-charges), `cancelAtPeriodEnd=false` (a cancelled user
  must never be told they're about to be charged). Skips deactivated and `isInternal` accounts.
- ✅ `src/jobs/renewal-reminder.email.ts` — plan, exact charge date (**rendered in UTC** so the
  day never shifts by timezone), amount, and a "Manage your subscription" link to
  `/dashboard/billing`. Checks Resend's `{ error }` return (the SDK returns rather than throws —
  the bug that once made the digest count failed sends as successes).
- ✅ `bun run job:renewal-reminder` for manual runs; 5 DB-free unit tests.
- ⚠️ **The schedule must stay DAILY.** Dedup is the 24h window, so a more frequent cron would
  email the same cohort repeatedly. Also assumes ONE instance runs the cron (Render Starter = 1);
  if the service is ever scaled out, add the column and dedup on it.
- ⚠️ Trade-off accepted: if the job misses a whole day (container down at 09:00), that cohort is
  skipped rather than caught up. A missed reminder is a soft failure; a double reminder is what
  users complain about.

---

## 16b. Original plan (superseded — kept for context)
FIB subscriptions recur. A user who buys 1 month and forgets is charged again with **no
warning**, which is the single most likely source of a chargeback/complaint. Auto-renewal is
now disclosed *before* payment (Task 15c) and can be turned off, but there is still no
advance notice of an upcoming charge.

Plan:
- `Subscription.renewalReminderSentAt DateTime?` (needs a migration + prod SQL) for dedup,
  mirroring `digestLastSentAt` on LearnerProfile.
- Cron: daily, find `paymentProvider=FIB, cancelAtPeriodEnd=false, currentPeriodEnd` in ~3 days,
  not already reminded for this period → send.
- Email: plan, amount, exact charge date, one-click link to the billing page to turn renewal off.
- Reuse the Resend setup + `weekly-digest.email.ts` HTML builder pattern.

---

## 19. Late-settlement safety ✅ DONE (2026-07-30) — **no migration**
FIB answered the confirmation-lag question: settlement can take **one to two days**, and even
their developers can't predict it. That invalidated a core assumption and exposed a live
money-loss path.

**The bug:** `expiresIn` is `P1DT12H` (36h), and `validUntil` was used as the cutoff for *every*
recovery path — the stale-DRAFT sweep AND the reconcile cron (`validUntil > now`). So a payment
confirmed at hour 40 hit a dead zone: swept to CANCELLED, no longer scanned, recoverable only if
a webhook happened to land. Almost certainly the mechanism behind the payments lost in testing.

- ✅ **Recovery window decoupled from `validUntil`.** `PAYMENT_RECOVERY_WINDOW_DAYS = 7` (exported
  from `subscriptions.service.ts` so the job and the UI wording share one source of truth). The
  reconcile job now selects never-activated records by **`createdAt` within 7 days**, covering
  DRAFT *and* locally-CANCELLED rows. REJECTED is excluded — that is FIB's definitive "failed".
- ✅ **Two-tier polling** so the wider net doesn't multiply FIB calls: records younger than 2h are
  checked every run (15 min — the window that matters for UX); older ones only on the hourly
  sweep. Cost throttling only; correctness never depends on it.
- ✅ **Stale-payment alert.** A payment still unconfirmed at 24h fires one Sentry warning. Deduped
  structurally by a 1-hour band on the hourly sweep, so each stuck payment alerts exactly once.
- ✅ **Late recoveries are logged explicitly** (`hoursAfterCreation`, `wasLocallyCancelled`) — the
  audit trail for "your payment did eventually go through".
- ✅ **`awaitingConfirmation` on `GET /fib/payments`.** "Not activated" is not "not paid": while a
  record is still being polled, Payment history shows **"Checking with FIB"** with do-not-pay-again
  guidance instead of the old, wrong **"Not paid"**.
- ✅ Copy corrected everywhere from "a few minutes" to "up to a day or two" (payment dialog +
  pending card), matching what FIB actually does.
- ✅ 4 new tests, including the exact hour-40 loss scenario.

**Deliberately NOT changed — needs FIB's answer first:** raising `expiresIn` from 36h to ~3 days.
If FIB rejects the larger value, `createSubscription` throws and **every purchase breaks**, so it
must not be changed blind. It is a one-line edit in `subscriptions.service.ts` once FIB confirms
their maximum (question 2 in §17). Note the recovery fix above already protects the money
regardless — extending `expiresIn` only helps the customer who scans the QR late.

---

## 17. Open questions for FIB (blocking nothing, but each affects money)
- ✅ **ANSWERED 2026-07-29 — how long until a payment reports ACTIVE?** One to two days is
  possible; even FIB's developers aren't certain. Drove all of Task 19.
- Does a **recurring charge** fire a status callback, or only status transitions? (Task 14's
  fix polls regardless, so this only tells us which path is load-bearing.)
- Cancelling subscription A while B is live — any settlement lag that could allow one extra
  charge on A? Ordering bounds it to at most one old-plan charge.
- Is `trialPeriod` on create usable to delay the first charge? If yes, true "downgrade at
  period end" becomes possible (see 15b).
- **Is a payment still honoured if it arrives after `expiresIn` has passed?** Now the most
  important open one — it decides whether raising `expiresIn` actually protects a customer who
  scans late.
- **What is the maximum allowed `expiresIn`?** We send `P1DT12H`; can we send `P7D`?
- **Do you retry the status callback, and for how long?** Decides whether webhooks can be
  trusted at all or polling is the only real path.
- **Any "payment received, settlement pending" state?** Today `GET /subscriptions/:id` only
  shows DRAFT or ACTIVE, so we cannot distinguish "not paid" from "paid, still processing" —
  the ambiguity that makes people pay twice.
- **Does `activeUntil` count from the payment date or the creation date** when settlement is
  delayed? A 2-day drift compounds across a year of renewals.
- **Is there a transactions/report endpoint** we could reconcile against for anything both the
  callback and our polling missed?

---

## 15c. Live-testing fixes ✅ DONE (2026-07-27)
Found by Aland testing real payments on prod. Two lost money.

- ✅ **A DRAFT cancelled before FIB caught up was gone forever.** The pre-cancel check asks FIB,
  but FIB lags, so it still answers DRAFT → we discard the record → nothing ever revisits a
  CANCELLED row. The reconcile job now also watches cancelled-but-never-activated drafts inside
  their validity window, so a late confirmation still activates the plan.
- ✅ **`activeUntil` is not always returned by FIB**, and the null fallback was quietly
  corrosive: carry-over never applied (full price, no credit — this is why an upgrade "didn't
  consider" the existing GOLD), the expiry sweep never downgraded anyone, and cancelling read as
  "no paid time left" and cut access instantly. Now derived from the purchased interval.
- ✅ **Same-plan purchase un-blocked** — with auto-renew off there is no other way to top up.
- ✅ **Cancel no longer needs an id from the client** (`DELETE /subscriptions/fib`). A stale
  `externalSubscriptionId` previously left users unable to cancel at all.
- ✅ **Payment history** (`GET /subscriptions/fib/payments` + card) — users can finally see what
  they were charged and whether a payment actually went through.
- ✅ **Auto-renewal disclosed before payment**; pending-payment card warns against cancelling a
  payment that may already be in flight.

---

## 15d. Second round of live-testing fixes ✅ DONE (2026-07-28)
Aland's retest surfaced the deepest bug so far, plus three more. Root principle applied
everywhere: **FIB's status feed lags the actual payment by minutes, so no decision may be
made from a local DRAFT without asking FIB first** (`syncDraftWithFib`).

- ✅ **"Cancel payment" on the pending card was cancelling the LIVE plan.** The card called the
  new no-id cancel, which prefers ACTIVE/TRIAL over DRAFT — so it cancelled the user's active
  subscription, reported success, and left the draft intact, resurrecting the card on every
  refresh (the exact reported symptom). The card now cancels its own `fibSubscriptionId`; the
  no-id route remains only for "cancel my current plan".
- ✅ **`GET /fib/pending` live-verifies before answering.** A paid-but-lagging draft activates
  during the check and returns `data: null` + "Payment confirmed — your plan is now active"
  (message prefix is a frontend contract → toast + plan refresh). The card can no longer show
  "Payment waiting" for money already sent.
- ✅ **`initiate-fib` live-verifies the draft before deciding.** A paid GOLD draft used to block
  buying PREMIUM ("pending payment" 409) and the carry-over math never saw the GOLD — the
  "bought premium but gold was the same" report. Now: paid draft activates, same-plan request →
  informative 409 ("just confirmed"), different plan → proceeds as UPGRADE with carry-over.
  Plan-change math moved AFTER the sync so it sees the post-activation row.
- ✅ **A dying DRAFT no longer mutates the user's plan** (found in review): webhook/reconcile
  reporting CANCELLED for a never-live draft (abandoned upgrade QR expiring) used to run the
  cancellation policy against the LIVE subscription — flagging `cancelAtPeriodEnd` on a plan the
  user never asked to cancel. Plan mutation now requires the record to have been locally
  ACTIVE/TRIAL; the record itself still gets closed + `cancelledAt` stamped.
- ✅ The payment dialog now shows the carry-over ("Includes +N bonus days…") so the upgrade math
  is visible before scanning, not an act of faith.
- ✅ 4 new tests (paid-pending activates via GET, paid same-plan initiate 409s without a second
  payment, paid GOLD → PREMIUM upgrade end-to-end with carryOverDays=17, abandoned-draft
  cancellation leaves the live plan untouched).

---

## 15b. Original upgrade design (superseded — kept for context)
Today an ACTIVE subscriber is **blocked from buying anything** — we turn away paying customers.
Agreed design:

- **Early renewal (same plan):** allowed; the new period **stacks onto `currentPeriodEnd`** rather
  than starting now, so no paid days are lost. (Mostly matters for CASH plans and for re-subscribing
  after a cancel — live FIB subs auto-renew, see Task 14.)
- **Upgrade GOLD → PREMIUM:** allowed; cancel the old FIB subscription, start the new one, and
  convert unused value into bonus days — `remainingDays × oldDailyRate ÷ newDailyRate`
  (e.g. 15 days of GOLD ≈ 12,500 IQD → ~8 free days of PREMIUM). No refund needed, nothing lost.
- **Downgrade PREMIUM → GOLD:** don't charge now — schedule it for period end. Needs a
  `pendingPlan Plan?` column applied by the expiry paths.
- Relax the `initiate-fib` guards accordingly (they currently 409 on any ACTIVE provider) and add
  the proration helper next to `PLAN_AMOUNTS_IQD`.
- ~~**Do Task 14 first**~~ — done 2026-07-26, so `currentPeriodEnd` is now trustworthy and the
  stacking logic can safely build on it. `cancelAtPeriodEnd` (Task 13) is also already in place.
- Remaining unknown to settle before building: whether an upgrade should cancel the old FIB
  recurring subscription immediately (simplest, chosen design) or let it lapse — confirm no
  double-charge window exists on FIB's side.

---

## 18. Billing review — findings from the 2026-07-29 full re-read
Backend logic traced end-to-end against the money paths. **No new correctness bugs found** in
carry-over, activation, cancellation or retire — including the cases most likely to corrupt
state: double activation (idempotent — the unchanged-status branch only ever extends), a failed
`retireSupersededFibSubscriptions` (the old record is skipped by the plan/provider guard in
`extendPaidPeriodIfRenewed` rather than clobbering the new plan), and a retired record being
re-read by the reconcile cron (excluded — it has `activatedAt`).

One **UI defect found and fixed**: the payment dialog stopped polling after 5 minutes but kept
the animated "Waiting for payment…" running forever, so it looked like it was still checking.
That is the one state where a user might conclude their payment failed and **pay twice**. It now
switches to "Still not confirmed" with explicit "if you already paid, don't pay again" guidance,
and the animation stops.

Known-and-accepted (not bugs):
- After cancelling, the "Provider" row reads "—" because the policy nulls `paymentProvider`
  while keeping the plan. Cosmetic; the "Cancelled — active until …" banner carries the meaning.
- An unpaid draft for plan A still blocks starting plan B with a 409 + the pending card. That is
  the deliberate double-charge guard, and the card can now cancel itself correctly.

---

## Blocked

### Stripe Integration — Long-Term Future
Not started. Add after FIB is live and the business wants a second payment option.

### Lessons Module — Deferred
No `Lesson` model or data source yet. `lessonsCompleted`, `readingSkill`, `writingSkill`, `listeningSkill` in `UserMetrics` are zeroed placeholders. Build when the business defines what a "lesson" is.
