# Frontend Tasks

This file is the source of truth for pending frontend work.
Backend is maintained by **Aland**. Frontend is maintained by **Rekar**.

When a task is done, move it to the **Done** section with the commit hash.
When Aland adds a new backend API, he notes it here so Rekar knows what to wire up.

---

### ✅ Voice Lab — two prod bugs FIXED (2026-07-24, Aland via Claude)
**Files:** `app/composables/useVoiceChat.ts`, `app/composables/useVoiceLab.ts`, `app/lib/utils.ts`.
Backend was confirmed clean (half-duplex, one turn per `voice:end`) — both were client-side.

1. **Infinite listening on the 2nd turn — FIXED.** Real cause was NOT the VAD/analyser (the mic meter
   runs continuously and re-checks `phase==='listening'` every frame). It was the recorder gate:
   `useVoiceChat.startRecording` bailed unless `voiceState === 'ready'`, but a completed turn ends at
   `'idle'` (the `message:response` handler set it there). So turn 2's `startRecording` returned
   immediately → recorder never started → `endTurn`'s `!== 'recording'` guard also bailed → stuck
   `listening`, `voice:end` never emitted. **Fix:** (a) `startRecording` now gates on the stream +
   "not already mid-turn" instead of an exact state (the stream stays open across turns); (b)
   `message:response` now sets `voiceState` back to `'ready'` when the stream is still open (only
   `'idle'` once released). Turn 2…N now record and end normally.

2. **Raw HTML tags in caption/transcript — FIXED.** AI replies are sanitized HTML; the caption
   (`CallStage`) and transcript (`TurnRow`) are plain-text surfaces, so tags leaked on screen. Added a
   shared SSR-safe `stripHtml()` in `lib/utils.ts` and strip the reply **once** at the source in
   `useVoiceLab.handleResult` (`turn.reply`), so both surfaces render clean text. Spoken audio was
   already fine (backend strips before TTS). Chat bubbles keep their `v-html` formatting — unchanged.

Verified: `bunx nuxi typecheck` (no new errors) + full production `nuxt build`.

---

### ✅ Dark mode is not working — FIXED (2026-07-24, Aland via Claude)
**Root cause (exactly the first suspect):** the theme picker in `LearnerSettingsModal.vue` saved
`theme: 'dark'` to the backend learner profile, but **no code anywhere applied it to the DOM**.
The CSS activates via a `.dark` class on `<html>` (`@custom-variant dark` in `main.css`) and nothing
ever set that class — so saving "Dark" succeeded and changed nothing visually.

**Fix:**
- NEW `app/composables/useTheme.ts` — single owner of the `.dark` class on `<html>` +
  `localStorage.theme` persistence. Exposes `applyTheme` / `syncFromProfile` (ignores non-light/dark
  values, so staff accounts without a learner profile are a no-op).
- `useProfile.ts` — `fetchProfile` and `updateLearnerProfile` now call `syncFromProfile`, so saving
  the settings modal applies the theme instantly and the profile page load re-syncs it.
- `Block/UserAvatar.vue` — its existing on-mount `/users/me` fetch also syncs theme → any dashboard
  page applies your saved theme on any device.
- `nuxt.config.ts` — inline head script applies `localStorage.theme` before first paint (no light flash).

**Note for Rekar:** the admin edit page (`users/[id]/profile.vue`) goes through `useAdmin` and is
deliberately NOT synced — an admin changing a student's theme must not flip the admin's own UI.

---

### ✅ FIXED (2026-07-24): Tutors can't post announcements/tasks — real cause was BACKEND, not the stale build
**The earlier "just redeploy the frontend" conclusion was WRONG.** After deploying the current
frontend, a TUTOR still couldn't post. Re-diagnosed properly:

**Root cause (backend + data):** `GET /classes/:id` returns `members[]` filtered by
`user.isInternal = false`, and the frontend derived the caller's class role by finding *itself* in
that list (`members.find(me)?.role`). But `getClassById`'s own membership/404 check is NOT
internal-filtered — so an account flagged `isInternal = true` can open its class (no 404) yet is
absent from `members`, leaving `myClassRole` undefined → every tutor control hidden. Admins were
unaffected because they gate on the global `isAdmin`, not membership. Aland's tutor test account is
almost certainly `isInternal = true` in prod (created via raw SQL) — the only state that yields
"page loads + 0 members + can't post" at once.

**Backend fix (shipped):** `GET /classes/:id` (and create/update/archive) now return `myRole` — the
caller's own class role from a direct membership lookup (no internal filter). The frontend already
falls back to `cls.myRole`, so the tutor button now appears. Backend-only; no FE code change.
Files: `classes.service.ts` (readClassDetail takes myRole; findMyClassRole helper),
`classes.types.ts`, `classes.router.ts` (Swagger), regenerated `types/api.ts`, +2 regression tests
(incl. the internal-tutor case). Deploy: merged to `main` → Render.

**Also recommended (data):** if that test account was flagged internal by accident, unset it so it
behaves as a normal tutor (shows in the roster, correct member counts):
`UPDATE users SET "isInternal" = false WHERE username = '<tutor>';` (run in Neon).
**Symptom (Aland, live prod):** as a class TUTOR (verified `class_users.role='TUTOR'` in Neon AND global
`users.role='TUTOR'`), no compose/create button on announcements or tasks. As ADMIN it worked everywhere.

**Confirmed root cause — it is a FRONTEND-VERSION issue, not backend, not auth:**
1. Backend `GET /classes/:id` (`ClassDetail`) returns a `members[]` list but **no top-level `myRole`**.
   (`myRole` only exists on `GET /classes/mine`.) This is intended; the detail page derives role from `members`.
2. The **current** frontend handles this correctly: `classes/[id]/index.vue` computes
   `myClassRole = members.find(me)?.role ?? cls.myRole`, then `isTutorOrAdmin = myClassRole==='TUTOR' || isAdmin`.
   Rekar added that members-list fallback on **2026-06-06 (commit c1fbdf35)** — comment: "myRole isn't always
   present on the getClass response."
3. The **deployed** build predates c1fbdf35. It gates the tutor button on `cls.myRole==='TUTOR'` alone → that
   field is always undefined on the detail endpoint → **tutors never see the button. Admins do**, because
   admins are detected via global `isAdmin` (useRole), not `myRole`. Exact match for the symptom.

**FIX: just deploy the up-to-date frontend** — the code is already correct on `main`. No frontend code change needed.

**Optional backend shortcut (Aland's call, unblocks WITHOUT a frontend deploy):** add `myRole` to the
`GET /classes/:id` response. Because the old build reads `cls.myRole`, sending it would make the button appear
after a backend-only deploy. Also a sensible consistency fix (field is on `/mine` but not `/:id`). — status: proposed, not built.

---

### ✅ Class-tutor assignment UI — DONE (2026-07-24, Aland via Claude)
Wires `PATCH /classes/:id/members/:userId/role { role }` (deployed) into the class Members tab, so an
admin or class-tutor can promote/demote members without raw SQL (joining by code always enters as STUDENT).

**What was built:**
- `useClasses.ts` — new `setMemberRole(classId, userId, role)`.
- NEW `ClassMemberRow.vue` — one member row (avatar/name/role badge) with a **3-dot `UiDropdownMenu`**
  (replaces the old hover-opacity buttons, per the design rules). Items are correctly gated:
  - Make tutor (student rows) / Make student (tutor rows) — shown to any class-tutor or admin, never on
    your own row; "Make student" is hidden for the **last tutor** (a class must keep one).
  - Remove from class — tutors/admins can remove students; only an admin can remove another tutor (never
    the last). Leave class — your own row.
- `ClassMembersTab.vue` — owns the state + API calls, maps rows, emits `roleChanged`; surfaces backend
  409s inline via toast ("Cannot demote/remove the last tutor").
- `classes/[id]/index.vue` — passes `is-admin` (both role props respect the archived read-only rule) and
  applies role changes to local `cls.members`.

Verified: `nuxi typecheck` (no new errors) + production `nuxt build`. The compose/create gating still
keys off the per-class role (`myRole==='TUTOR' || isAdmin`), unchanged.

---

### ✅ Admin user role management UI — BUILT + verified on prod (2026-07-24, Aland via Claude) — commit `fd9282c`
The 2026-07-23 note on this task was **wrong**: it assumed the frontend "already exposes role/status
toggles". Only the **status** toggle existed. `useAdmin().patchUser` was never once called with
`{ role }` — the role was static text in both the users list (`UserTableRow.vue`) and the admin edit
page (`users/[id]/profile.vue`). The endpoint worked all along; there was simply no control to send it.
**Lesson: when an admin capability "doesn't work on the live UI", check whether the frontend ever calls
the endpoint before suspecting auth.** (Second time this pattern bit us — see the tutor-can't-post entry.)

**Built:** `components/Pages/Dashboard/Users/ChangeRoleDialog.vue` — `UiDialog` with three selectable
role cards (Student / Tutor / Admin), descriptions, a "Current" chip, and Save disabled when unchanged.
Wired into (a) the users list row 3-dot menu (`@change-role`) and (b) a new "Account role" card on
`users/[id]/profile.vue`, above "Account status".

**Backend guards are live and mirrored in the UI** (they shipped in `0c680dd`, already on `origin/main`):
self-change is disabled client-side with an explanation (only admins reach this screen, so "self" always
means demoting out of ADMIN → 409), and promote-to-admin / demote-admin each show a warning notice. On a
server rejection the dialog **stays open** and the backend's 409 message surfaces via the `useHttp` toast,
so it's never a silent failure. On success the row updates in place — or refetches when a role filter is
active, since the row may no longer match the filter.

Backend untouched → no `generate:types` needed. Verified: `nuxi typecheck` clean + Aland tested the full
flow on prod.

---

### 7. Voice Lab — connect to real Socket.io pipeline ✅ DONE
**File:** `app/pages/dashboard/voice.vue`
**Status:** Wired to the real `/chat` voice pipeline via a new `useVoiceLab.ts` composable
(built on the existing `useVoiceChat.ts`).

What was built — a hands-free live **CALL**, not a chat:
- The page is a full-screen voice-call experience (per Rekar: "it should be like a call, no
  text mid-conversation — a live call"). You tap Start, then talk hands-free: the mic stays
  open, **client-side silence detection (VAD)** auto-ends your turn after a ~1.4s pause, the AI
  reply auto-plays, and the mic auto-resumes listening. Tap End to hang up.
- The backend voice pipeline is half-duplex (processes a turn only on `voice:end`), so the
  continuous-call feel is built entirely on the client in `useVoiceLab.ts` (a call state machine:
  connecting → listening → thinking → speaking → listening). **No backend changes.**
- New components under `components/Pages/Dashboard/Voice/`: `CallIntro` (pre-call screen),
  `CallStage` (orb + live caption + timer + mute/end/log controls), `CallOrb` (reactive avatar
  that breathes with the AI and reacts to your mic level), `TranscriptLog` (a `UiSheet` record of
  the conversation, reusing `TurnRow`), rebuilt `ScorePanel`, new `PronunciationCard`.
- The transcript is kept as a quiet record (toggle the log button), never the main surface.
- **Pronunciation gating:** Azure pronunciation assessment is GOLD/PREMIUM-only, so FREE users
  get the full voice conversation + grammar/vocab/fluency scores, and the pronunciation card
  shows a locked upsell (with a `UiPopover` hover hint) instead of fake numbers. The *feature*
  is gated, not the page.
- New types in `common/types/voice-types.ts`; removed the dead `PhonemeScore` type and the
  obsolete `PromptCard.vue` / `PhonemeGrid.vue`.
- Fixed a latent bug in `useVoiceChat.ts` (`recorder.onerror` called `onError()` with no args).

---

### 8. Notification items — make clickable with redirect ✅ DONE (2026-06-12)

**Files changed:**
- `backend/prisma/schema.prisma` — added `data Json?` to Notification model (db:pushed)
- `backend/src/modules/notifications/notifications.service.ts` — `createNotification` accepts optional 4th `data` arg; `NOTIFICATION_SELECT` includes `data`
- `backend/src/modules/notifications/notifications.types.ts` — `NotificationItem.data: Prisma.JsonValue | null`
- `backend/src/modules/notifications/notifications.router.ts` — Swagger updated: all 7 types in enum, `data` field documented
- `backend/src/modules/tasks/tasks.service.ts` — TASK_ASSIGNED passes `{ classId, taskId }`, TASK_SUBMITTED passes `{ classId: task.classId, taskId }`
- `backend/src/modules/announcements/announcements.service.ts` — CLASS_ANNOUNCEMENT passes `{ classId }`
- `backend/src/modules/goals/goals.service.ts` — GOAL_ASSIGNED passes `{ goalId }`, GOAL_COMPLETED passes `{ goalId }`
- `backend/src/modules/vocabulary/vocabulary.service.ts` — **security fix:** added TUTOR class-membership guard (mirrors goals); **bug fix:** now fires VOCABULARY_ASSIGNED notification with `{ vocabularyId }` (was documented but never implemented)
- `app/common/model/notification.ts` — added `NotificationData` interface, `data?: NotificationData | null` on `Notification`
- `app/common/data/notification-routes.ts` — new `notificationRoute(n)` function mapping all 7 types to routes
- `app/composables/useNotifications.ts` — added `markOneRead(id)` (optimistic + fire-and-forget PATCH)
- `app/components/Layouts/Dashboard/NotificationPanel.vue` — rows are now clickable (cursor-pointer, hover surface, `select` emit)
- `app/components/Layouts/Dashboard/NotificationBell.vue` — `onSelect` closes dropdown, calls `markOneRead`, navigates via `notificationRoute`
- `app/pages/dashboard/classes/[id]/index.vue` — `?tab=` query param deep-link support; `route.params.id` watcher so class-to-class navigation reloads; post-load tab validation

**Routes:**
- `STREAK_MILESTONE` → `/dashboard`
- `GOAL_COMPLETED` / `GOAL_ASSIGNED` → `/dashboard/goals`
- `VOCABULARY_ASSIGNED` → `/dashboard/vocab`
- `TASK_ASSIGNED` / `TASK_SUBMITTED` → `/dashboard/classes/{classId}?tab=tasks`
- `CLASS_ANNOUNCEMENT` → `/dashboard/classes/{classId}?tab=announcements`
- Old notifications with `data=null` fall back to the generic list page gracefully.

---

### 9. Settings — Weekly digest email toggle ✅ DONE (2026-06-13)

**Files changed:**
- `app/common/types/profile-types.ts` — added `emailDigestEnabled: boolean` to `MyLearnerProfile` and `UpdateLearnerProfileInput`
- `app/pages/dashboard/profile.vue` — added Email digests card with toggle switch + helper text; shows status when disabled; toast on save
- `app/components/Pages/Dashboard/Profile/LearnerSettingsModal.vue` — added email digest toggle in settings modal; synced state on open/save
- `app/components/Block/UserAvatar.vue` — added quick Email digests toggle at top of dropdown menu (before Profile/Billing); fetches profile on mount; toast on toggle
- `app/composables/useNotifications.ts` — added toast notifications when new notifications arrive via Socket.io with type-specific emojis

**Implementation:**
- Two UI locations: Profile page card + Avatar dropdown menu toggle
- Both call `PATCH /users/me/learner-profile { emailDigestEnabled }` 
- Profile card: saves via settings modal with toast feedback
- Avatar dropdown: direct toggle with immediate toast + independent state sync
- Notification toasts: show when Socket.io receives `notification:new` event with emoji matching type (🔥🎉🎯📚📢✅📝)
- Status helper text shows when digest is disabled

---

## Backend Notes for Frontend

### AI chat replies now contain lightweight HTML — needs `v-html` in 4 places ✅ DONE (2026-07-20, wired + pushed by Rekar; backend merged to main in PR #16)

The AI tutor's reply (ASSISTANT `Message.content` from `POST /sessions/:sessionId/messages`,
the voice endpoints, and the Socket.io `message:response` payload) is no longer plain prose —
the model now formats it with a **small fixed tag set**: `p, strong, em, ul, ol, li, br` only.
No headings, links, images, classes, or any attributes. The Swagger descriptions +
`types/api.ts` doc comments now say this too.

**Why:** better-looking chat replies (bullet lists for multi-item tips, `<strong>` on
corrections) instead of a wall of plain text.

**Backend-side safety (already done, verified by unit tests):**
- `reply` is allowlist-sanitized (`sanitize-html`, exactly those 7 tags, zero attributes) at
  the single choke point in `ai.service.ts` before it's ever stored or returned — text,
  voice, and socket paths all covered. `<script>`, `onerror=`, `javascript:` etc. are stripped.
- Evaluation fields (`feedback`, `corrections[]`, `grammarErrors[]`, `newWords[]`) are
  stripped to **plain text** server-side — keep rendering those with normal `{{ }}`, no change.
- TTS strips tags + decodes entities internally, so voice audio is unaffected.
- A plain-prose reply (e.g. the no-API-key placeholder) is auto-wrapped in `<p>` server-side.

**Frontend work — all 4 spots that render the AI reply need the HTML treatment:**
1. `Chat/MessageBubble.vue:97` — `{{ message.text }}` → `v-html` (AI branch only).
2. Voice-lab live caption — `CallStage.vue` renders `{{ caption }}` (fed from
   `useVoiceLab.ts` ← `assistantMessage.content`). Either `v-html` it or strip tags for the
   caption (a one-line `.replace(/<[^>]+>/g, ' ')` is fine there).
3. Voice-lab transcript log — `TurnRow.vue` renders `{{ turn.reply }}` → `v-html`.
4. Reuse what exists: `AppText` already has an `htmlContent` prop with matching
   `.html-content` styles in `main.css` — prefer that over a raw `v-html` div, and extend
   `.html-content` CSS to style `ul/ol/li` margins inside bubbles if it doesn't yet.

**Two gotchas:**
- **Legacy messages:** rows stored before this change are plain text. Simple rule: if
  `content` doesn't start with `<`, render it as plain text (or wrap in one `<p>`); otherwise
  `v-html`. Applies to session history pages too.
- **Only AI messages.** User messages stay `{{ }}` — never `v-html` user-authored content.
  Optional defense-in-depth: DOMPurify client-side before the bind (backend already
  sanitizes, so this is belt-and-braces).

**Deploy note:** until this frontend change ships, AI bubbles will show literal
`<p>...</p>` tags — deploy the frontend change together with (or right after) the backend.

### Terms of Service / agreement signing ✅ DONE (2026-06-19)

**Files changed:**
- `app/common/schemas/AuthSchema.ts` — added `acceptAgreement: z.literal(true)` to `signUpSchema` and `googleUsernameSchema`; added `AcceptAgreementInput` discriminated union type
- `app/composables/useAgreement.ts` (NEW) — module-level cached composable for `GET /auth/agreement`
- `app/components/Form/AgreementDialog.vue` (NEW) — shared dialog in `view` and `accept` modes; HTML-escaped before markdown render (XSS-safe)
- `app/composables/useHttp.ts` — error paths now surface the parsed JSON body in `response.data` (was `null`); lets callers read `needsAgreement` / error details from 4xx responses
- `stores/auth.ts` — new `acceptAgreement(creds)` action; `signUp` sends `acceptAgreement: true`; `googleAuth` accepts optional 3rd `acceptAgreement` param
- `app/pages/signup.vue` — ToS checkbox with client-side Zod validation; "Terms of Service" link opens `AgreementDialog(view)`
- `app/pages/google-username.vue` — same checkbox added to Google new-account username screen
- `app/pages/signin.vue` — detects 403 `{ needsAgreement: true }` before the unverified-email 403; shows `AgreementDialog(accept)` for re-accept; cancel-while-in-flight race guarded with `reacceptCancelled` flag
- `app/components/Form/GoogleButton.vue` — same 403 `needsAgreement` detection for Google login; re-accept modal with idToken re-use; cancel race guarded

**How it works:**
- Register with unchecked box → blocked client-side by Zod (no request sent)
- "Terms of Service" link → opens dialog showing live terms from `GET /auth/agreement`
- Login/Google after version bump → 403 `{ needsAgreement: true }` → re-accept modal → `POST /auth/accept-agreement` → tokens persisted → `/dashboard`
- When backend bumps `CURRENT_AGREEMENT.version`: no frontend change needed; next login prompts re-accept automatically

### Internal (stealth) admin accounts — FYI only, nothing to wire (2026-06-12)
The backend now supports hidden internal admin accounts (`isInternal` flag, never serialized in any API response — `types/api.ts` is unchanged). They are automatically excluded from `GET /users`, admin dashboard counts, class member lists / rosters / analytics, `memberCount`, and notifications. **No frontend changes needed** — just be aware that an internal account logged into the dashboard sees everything normally, while other users (including admins) never see it anywhere.

### Email verification is now MANDATORY before login (2026-06-06) — ⚠️ flow changed
Security fix: registering no longer logs the user in. The account is created but **unverified and unusable** until the email is verified — `POST /auth/login` returns **403** for unverified accounts. This closes the hole where you could register with someone else's email and log straight in. `AuthUser` (login / register / `GET /auth/me` / Google / verify-email) carries **`emailVerified: boolean`**.

Current wired-up flow (done — see `signup.vue`, `verify-email.vue`, `signin.vue`, `stores/auth.ts`):
1. **`POST /auth/register`** — body `{ username, email, password, displayName }`. Returns the created `AuthUser` (201) — **NO tokens**. The store's `signUp()` persists nothing. `signup.vue` stashes only the email in `sessionStorage.pendingEmail` and routes to `/verify-email`.
2. **`POST /auth/verify-email`** — body `{ email, otp }`. Returns a **`LoginResponse` (`{ user, accessToken, refreshToken }`)** — verifying logs the user in. The store's `verifyEmail()` persists those tokens, then the page goes to `/dashboard`.
   - `400` = invalid/expired/used code; **`409` = already verified (sign in normally)** — no longer idempotent; `422` = bad format; `429` = rate limited (10 / 15 min).
3. **`POST /auth/resend-verification`** — body `{ email }`. Always 200 (anti-enumeration). `verify-email.vue` has a 60s resend cooldown.
4. **Login 403 handling**: `signin.vue` detects the "verify your email" 403 and redirects to `/verify-email`. Because login uses *username* (not email), the verify page asks the user to type their email when none was carried over.
5. **Google** (`POST /auth/google` / `/auth/link-google`) is still the instant alternative — Google emails are pre-verified, so it sets `emailVerified=true` + `status=ACTIVE` and returns tokens directly.

Codes expire in 24h. Types are in `frontend/types/api.ts` (`paths['/auth/verify-email']`, `paths['/auth/resend-verification']`).

### Dashboard overview types — use the generated `api.ts` (2026-05-30)
Heads up Rekar: `GET /dashboard/overview` was missing from `frontend/types/api.ts` because `bun run generate:types` wasn't run after the backend route was added. I've regenerated it — the route + full response shape now live in the canonical `types/api.ts` (the `paths["/dashboard/overview"]` entry).

The hand-written `app/common/types/dashboard-overview-types.ts` duplicates those types manually, which the project convention specifically warns against (types must flow from Swagger → `api.ts`, never maintained by hand). When you get a chance, retire that file and point `useDashboardOverview.ts` at the generated types instead, e.g.:

```ts
import type { components } from '~/types/api'
type DashboardOverviewData = NonNullable<
  components['schemas'] // or pull from paths['/dashboard/overview']['get']['responses'][200]...['data']
>
```

Not urgent (the duplicate currently mirrors the backend correctly), but it will silently drift the next time the backend shape changes. **Reminder for future endpoints:** after any backend route lands, run `bun run generate:types` from `backend/` and commit `frontend/types/api.ts` — no hand-written mirror files.

### Teacher Task System ✅ DONE (2026-06-12)
UI fully implemented. Tasks tab added to `/dashboard/classes/[id]` alongside Members/Students/Analytics/Announcements.

**What was built:**
- `app/common/model/task.ts` — `Task` + `TaskSubmission` plain models
- `app/common/types/task-types.ts` — `TaskItem`, `TaskSubmissionItem`, `TaskAuthor` API shapes
- `app/common/schemas/TaskSchema.ts` — Zod schemas for task form, submission form, feedback
- `app/composables/useTasks.ts` — raw API layer (8 functions)
- `app/components/Pages/Dashboard/Classes/Tasks/TaskCard.vue` — task row with status/deadline/submission-state chips + 3-dot menu for tutor/admin
- `app/components/Pages/Dashboard/Classes/Tasks/ClassTasksTab.vue` — tab root with pagination, load-more, create/edit/delete/toggle-closed, delete confirmation dialog
- `app/components/Pages/Dashboard/Classes/Tasks/TaskFormDialog.vue` — create + edit dialog (3 fields)
- `app/components/Pages/Dashboard/Classes/Tasks/TaskDetailSheet.vue` — right-side sheet: tutor sees all submissions; student sees submit form / own feedback
- `app/components/Pages/Dashboard/Classes/Tasks/SubmissionRow.vue` — per-submission row with write/edit feedback form
- `app/common/model/notification.ts` + `NotificationPanel.vue` — extended with `TASK_ASSIGNED`, `TASK_SUBMITTED`, `VOCABULARY_ASSIGNED` icon/color mappings

### Rate limiting (2026-05-29)
Rate limiting is now live in production on all auth and AI endpoints. The backend returns **HTTP 429** with `{ success: false, message: "Too many requests. Please wait and try again.", data: null }`.

Response headers include `RateLimit-Limit`, `RateLimit-Remaining`, and `RateLimit-Reset` (seconds until window resets) — these can be used to show a countdown.

**Action needed:** Auth forms (login, register, forgot-password) should display a user-friendly message when the API returns 429, e.g. _"Too many attempts. Please wait a few minutes and try again."_ The existing `useHttp` error handling should catch 429 like any other error — just make sure the UI surfaces the message rather than showing a generic error.

** meeting **
# add Ku-lang to landing page + fix the color a bit  ✅ DONE (commit 440cfcb — Kurdish/Sorani + RTL on public pages)
# get the agreement text from the business owner and let user sign it.
#   → Backend signing flow DONE (2026-06-17) — see "Terms of Service / agreement signing" note above for the UI to wire.
#   → Still pending from the business owner: the actual legal Terms text (backend drops it in + bumps version, no FE change).