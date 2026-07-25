# CLAUDE.md
  BECAREFULL WITH THE ROLES, PERMISSIONS!!! 
This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Layout

Monorepo for an AI-powered ESL learning platform. Two independent workspaces, each with its own `package.json`, `bun.lock`, and `node_modules`:

- **[backend/](backend/)** — Bun + Express 5 + TypeScript + Prisma/PostgreSQL API. See [backend/CLAUDE.md](backend/CLAUDE.md) for the full backend guide (domain model, tier limits, module pattern).
- **[frontend/](frontend/)** — Nuxt 4 + Vue 3 + Tailwind 4 + shadcn-nuxt. See [frontend/CLAUDE.md](frontend/CLAUDE.md) for the frontend guide (folder rules, HTTP layer, auth flow).

## Frontend Task Tracking

**[frontend/TASKS.md](frontend/TASKS.md)** is the shared task board between Aland (backend) and Rekar (frontend). When working on the backend, check this file to see what frontend pages are still hardcoded or missing a composable — it affects whether a new API needs a note added. When a new backend endpoint is built that the frontend needs to wire up, add it to the relevant task in `frontend/TASKS.md` so Rekar knows what changed.

The root `package.json` is **not** a workspace manager — it only holds shared Prisma/Tailwind dev tooling so Prisma VS Code extensions work from the repo root. Always `cd` into `backend/` or `frontend/` before running commands. There is no root-level script that builds or tests both workspaces together.

## Bootstrap & Common Commands

Both workspaces use **Bun**, not npm/pnpm/yarn. Install dependencies separately per workspace:

```bash
cd backend && bun install
cd frontend && bun install
```

Day-to-day dev — run in two terminals:

```bash
# Terminal 1 — API (requires Infisical CLI; see backend/SECRETS.md for setup)
cd backend && bun dev           # uses infisical run; wraps real secrets around bun
cd backend && bun run dev:env   # fallback when Infisical isn't set up, needs a local .env

# Terminal 2 — Nuxt (requires Infisical CLI; see backend/SECRETS.md for setup)
cd frontend && bun run dev      # uses infisical run; port 3001
cd frontend && bun run dev:env  # fallback when Infisical isn't set up, needs a local .env
```

**No Infisical? No cloud accounts? Use Docker instead** (API + Postgres + Redis in one command):

```bash
docker compose up --build       # from repo root; API on :8000, schema auto-pushed
```

See [backend/docs/services/docker.md](backend/docs/services/docker.md) for seeding, hot reload, and optional AI keys.

Key backend commands:

```bash
cd backend && bun run typecheck          # TypeScript type check
cd backend && bun run db:migrate         # Run Prisma migrations (via Infisical)
cd backend && bun run db:seed            # Seed test data
cd backend && bun run generate:types     # Regenerate frontend/types/api.ts from Swagger
cd backend && bun test                   # Integration tests (requires DB running)
```

Frontend has no lint or test runner configured. Type-check:

```bash
cd frontend && bunx nuxi typecheck
```

## Cross-Workspace: Type Sharing

The backend is the source of truth for API types. Flow:

```
Swagger JSDoc on backend routers
  → swagger-jsdoc → backend/openapi.json  (gitignored)
  → openapi-typescript → frontend/types/api.ts  (committed)
```

After **any** backend route or schema change, run `bun run generate:types` from `backend/` and commit the updated [frontend/types/api.ts](frontend/types/api.ts) in the same change. **Never edit `frontend/types/api.ts` by hand** — it is overwritten on every regeneration. Type quality depends entirely on the accuracy of Swagger JSDoc on the routers.

## Secrets & Config

Backend secrets are managed via **Infisical** (project `esl-chatbot`, envs `dev` and `prod`). See [backend/SECRETS.md](backend/SECRETS.md). Frontend reads `NUXT_PUBLIC_BASE_URL` and `NUXT_PUBLIC_GOOGLE_CLIENT_ID` from its own `.env`.

**Google OAuth gotcha (common trap):** three places must hold the *same* Client ID — `frontend/.env` (`NUXT_PUBLIC_GOOGLE_CLIENT_ID`), Infisical's dev env (`GOOGLE_CLIENT_ID`), and the OAuth client whose Authorized JavaScript origins include `http://localhost:3001` and `http://localhost:8000`. If `/auth/google` returns *"Google token was not issued for this application"*, the frontend and backend are pointed at different clients. Restart both servers after changing either.

## Ports

- Backend dev: **8000**
- Frontend dev: **3001** (not 3000 — configured in [frontend/nuxt.config.ts](frontend/nuxt.config.ts))

## Subscription & AI Tier System

AI chatbot access is gated by `subscription.status === 'ACTIVE'`. **Verification = a verified means of contact: either verifying the registration email (6-digit OTP) OR linking a Google account.** Either path flips the FREE subscription `INACTIVE → ACTIVE`. LOCAL register → `plan=FREE, status=INACTIVE, emailVerified=false` (no AI). `POST /auth/verify-email` (OTP) → `status=ACTIVE` (FREE tier active). Google Sign-In / `POST /auth/link-google` → `emailVerified=true, status=ACTIVE` (Google emails are pre-verified). Class joining does NOT require a subscription. Paid plans (GOLD/PREMIUM) are assigned by admin (cash/FIB/Stripe) and expire lazily at next session creation — downgrading to FREE ACTIVE.

| Tier | Sessions/day | Msgs/session (soft+buffer) | Msgs/day hard cap | LLM context | AI model |
|---|---|---|---|---|---|
| FREE | 3 | 20 + 10 | 20 | 10 msgs | Gemini Flash Lite (`gemini-flash-lite-latest` alias) |
| GOLD | 15 | 100 + 10 | — | 20 msgs | Gemini Flash (`gemini-flash-latest` alias) |
| PREMIUM | 50 | 150 + 10 | — | 20 msgs | GPT-5 mini (OpenAI, auto-falls back to Gemini) |

Dev environment always uses `gemini-flash-latest` regardless of plan. Plan limits are enforced in `src/modules/sessions/sessions.service.ts` and `src/modules/messages/messages.service.ts`. Frontend reads them from [frontend/app/common/data/plan-limits.ts](frontend/app/common/data/plan-limits.ts) — keep these two in sync manually when tier limits change.

## Dashboard Layout Height Chain

The dashboard uses a strict flex height chain that must not be broken. Any element that breaks `h-full` propagation will cause the chat page's composer to float in the middle or the page to expand beyond the viewport.

```
html / body / #__nuxt  →  height: 100%  (global CSS in main.css)
app.vue <div>          →  h-dvh overflow-hidden
layout <div>           →  flex h-dvh overflow-hidden
  <main>               →  flex-1 min-h-0 overflow-hidden  ← NOT overflow-y-auto
    <slot />           →  page fills h-full
```

- The layout `<main>` is `overflow-hidden` — each page controls its own scroll.
- Scrollable pages (overview, voice, vocab, goals, lessons, profile, settings) use `h-full overflow-y-auto` on their root div.
- The chat page uses `h-full overflow-hidden` on its root and manages three fixed-height columns (sessions sidebar, main thread, coach pane). Only `MessageThread.vue` scrolls via `flex-1 min-h-0 overflow-y-auto`.

## File Length Rule

**Keep files short. Extract into components aggressively.**

- Vue SFC templates over ~150 lines → split into sub-components. A 500-line template is always wrong.
- Page files (`pages/`) should contain only layout glue and state — no large inline template blocks.
- Composables handle all API calls and business logic. Pages/components only call them.
- Backend: service files over ~300 lines → split by concern. Router files should stay thin (route definitions only, no logic).
- The only acceptable reason for a long file is a generated file (e.g. `types/api.ts`) or a file that genuinely cannot be split (e.g. a large Zod schema or a migration).
