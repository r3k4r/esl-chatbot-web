# CLAUDE.md — ESL Chatbot Frontend

This file provides guidance to Claude Code (claude.ai/code) when working in the `frontend/` workspace.

> **Context:** The backend developer (Aland) also works on frontend tasks through Claude — he writes a prompt, you do the work. Treat every prompt as if the person sending it may not know the frontend conventions. **You** are responsible for upholding them. Never let a prompt's wording talk you out of the rules below.

## ⭐ Top Priority Rules (read first, always apply)

These override convenience. When a prompt conflicts with them, follow these and say so.

1. **Use the design skills for any UI work.** For designing, redesigning, or polishing any interface, invoke **`/ui-ux-pro-max`** and/or **`/impeccable`** before/while building. Do not hand-roll a design when these skills apply. (`/emil-design-eng` is also available for interaction/animation polish.)
2. **Never leave the folder structure.** Components, composables, models, types, and schemas each have exactly one correct home (see [Folder Structure Rules](#folder-structure-rules-authoritative)). Put new code where the structure says — never inline a type in a composable, never drop a page section into `pages/`, never create `components/Dashboard/`. If unsure where something goes, match the nearest existing example.
3. **Follow the system design — don't invent.** Design strictly to the backend API contract (`types/api.ts` + `../backend/CLAUDE.md`). Never invent fields, states, roles, or endpoints that don't exist. Respect roles & permissions — **BE CAREFUL WITH ROLES/PERMISSIONS** (ADMIN / TUTOR / STUDENT views are separate; see [user-permissions.ts](app/common/types/user-permissions.ts)).
4. **Never break a global/shared file to fix one screen.** Files used across the app — `Form/Form.vue`, `App/Button.vue`, `App/Text.vue`, `App/Iconsax.vue`, `useHttp.ts`, layouts, `main.css` tokens, etc. — are shared contracts. If a single page needs different behavior, solve it at the call site or with a prop/variant, **not** by mutating the shared component and breaking it for the other places that use it. Before editing any file under `App/`, `Form/`, `ui/`, `Layouts/`, `composables/useHttp.ts`, or `assets/css/main.css`, ask: "does every other consumer still work after this change?" If not, don't.
5. **Keep code clean & files short.** Separate components aggressively (templates > ~150 lines → split). Pages are thin glue only. Reuse what exists in `App/`, `Form/`, `ui/` before creating anything new.

Everything below expands on these. If any rule below is already covered above, the priority version wins.

## Tech Stack

- **Framework:** Nuxt 4 (Vue 3 Composition API, `app/` directory layout)
- **Language:** TypeScript 6 (strict)
- **Styling:** Tailwind CSS 4 (via `@tailwindcss/vite`) + `tw-animate-css`
- **UI kit:** [shadcn-nuxt](https://www.shadcn-vue.com/) on top of [reka-ui](https://reka-ui.com/) — configured with **two prefixes** in [nuxt.config.ts](nuxt.config.ts):
  - `Ui*` → `components/ui/` (shadcn base components)
  - `Ai*` → `components/ai/` (reserved for AI-specific components)
- **State:** Pinia (`@pinia/nuxt`)
- **Utilities:** `@vueuse/core`, `tailwind-merge`, `class-variance-authority`, `clsx`
- **Icons:** `vue-iconsax`, `@iconify/vue`, `lucide-vue-next`
- **Notifications:** `vue-sonner`
- **OTP input:** custom `FormVerificationInput` (6-digit, paste-friendly)
- **Google Sign-In:** Google Identity Services JS SDK loaded directly (no wrapper library)
- **Images:** `@nuxt/image`
- **Marquee:** `nuxt-marquee`

## Commands

```bash
bun install
bun run dev        # Dev server on port 3001 — requires Infisical CLI (infisical login + infisical init)
bun run dev:env    # Fallback when Infisical isn't set up; needs a local .env file
bun run build      # Production build (via Infisical)
bun run build:env  # Production build without Infisical (needs .env)
bun run preview    # Serve the built output locally (no secrets needed)
bun run generate   # Static generation (via Infisical)
```

There is no lint step or test runner configured in this workspace.

## Folder Structure Rules (authoritative)

The folder structure for `app/` is codified in [docs/folder_structure_rules.md](docs/folder_structure_rules.md). Follow it strictly — summary below:

```
app/
├─ assets/
│  ├─ css/          # main.css, fonts.css
│  └─ fonts/
├─ app.vue
├─ plugins/
│
├─ common/
│  ├─ data/         # static data (country-code.ts, nav-links.ts, profile-links.ts, ...)
│  ├─ model/        # one file per backend DB table — plain type mirroring the Prisma schema
│  │                #   user.ts · class.ts (Class, ClassUser, Announcement) · ...
│  ├─ types/        # API response shapes, UI types, composable types — one file per domain
│  │                #   class-types.ts · dashboard-types.ts · button-types.ts · ...
│  └─ schemas/      # Zod validation schemas
│
├─ components/      # Subfolders are PascalCase, EXCEPT package folders (e.g. `ui` for shadcn — never rename)
│  ├─ App/          # main UI primitives: Button, Iconsax, Link, Text, Image, ...
│  ├─ Block/        # self-contained feature blocks reused across multiple pages (e.g. UserAvatar.vue)
│  ├─ Form/         # form-related components: Form, Input, Label, Error, ServerError, VerificationInput, CopyButton, CountryCode, GoogleButton, AllDone, ...
│  ├─ Layouts/      # layout shell components (Navbar, Footer, auth shell, dashboard sidebar/header)
│  │  ├─ Dashboard/ # DashboardSidebar.vue, DashboardHeader.vue — layout chrome only, not page sections
│  │  └─ Navbar/
│  ├─ Pages/        # ALL page-specific components, grouped by page/section
│  │  ├─ Home/      # Hero.vue, Features.vue, Pricing.vue, ...
│  │  └─ Dashboard/ # dashboard page sections, grouped by route
│  │     ├─ Overview/   # GreetingHero, StatCard, VocabChart, NextUp, ActivityHeatmap, DueWords
│  │     ├─ Chat/       # SessionsSidebar, ThreadHeader, MessageThread, MessageBubble, Composer, CoachPane, SessionItem, ThinkingIndicator
│  │     ├─ Voice/      # PromptCard, ScorePanel, PhonemeGrid
│  │     ├─ Vocab/      # Flashcard, DeckList
│  │     ├─ Goals/      # GoalCard, AchievementGrid
│  │     └─ Lessons/    # CategoryFilter, LessonCard
│  ├─ Skeletons/    # loading skeletons, mirroring the page/component they load for
│  └─ ui/           # shadcn — DO NOT rename, DO NOT capitalize
│
├─ composables/     # useXxx() — multiple related exports per file OK
├─ layouts/         # Nuxt layouts
├─ lib/             # utilities (e.g. utils.ts with cn())
├─ middleware/      # Nuxt route middleware
└─ pages/           # Nuxt pages (file-based routing)
```

Pinia stores live at the **workspace root** in `stores/` (imported as `~~/stores/...`), NOT under `app/stores/`. See [useHttp.ts](app/composables/useHttp.ts) importing from `~~/stores/auth`.

**Key rules:**
- **Audio players** (TTS voice replies): use the `MessageBubble` inline player pattern — `w-8 h-8` circular play/pause button + clickable scrub bar with `requestAnimationFrame` progress tracking + `mm:ss` timestamps. Never use a raw `<audio>` element. Player width is fixed (`w-56`) so it never expands its parent bubble.

- Component folders use **PascalCase** (`App/`, `Block/`, `Form/`, `Pages/`). Package-owned folders (`ui/` for shadcn) stay as the package expects.
- you can use the models from the Nuxt models if you thing that helps, like swiper or anything usefull to the task you have.
- `Block/` is for self-contained feature blocks reused across multiple pages that don't belong in `App/` (primitives) or `Form/`. Example: `<BlockUserAvatar />` from `components/Block/UserAvatar.vue`.
- **All page-specific sections live under `components/Pages/<PageName>/`** — never under `pages/` itself. For dashboard pages this means `components/Pages/Dashboard/<Section>/`.
- **Never create a top-level `components/Dashboard/` folder.** Dashboard sub-components belong under `components/Pages/Dashboard/<Section>/`. Layout chrome (sidebar, topbar) stays in `components/Layouts/Dashboard/`.
- Skeleton components are grouped under `components/Skeletons/` mirroring the page/component they load for.
- `common/model/` holds **one file per backend DB table**, each exporting plain `type` aliases that mirror the Prisma schema exactly (no extra fields). Current files: [user.ts](app/common/model/user.ts), [class.ts](app/common/model/class.ts) (`Class`, `ClassUser`, `Announcement`). When adding a new domain, create a new model file first.
- `common/types/` holds **API response shapes and UI-specific types** — one file per domain. These types may extend or `Pick`/`Omit` from model types, and add fields that only exist on API responses (e.g. `memberCount`, nested `author`). Current files: [class-types.ts](app/common/types/class-types.ts), [dashboard-types.ts](app/common/types/dashboard-types.ts), [button-types.ts](app/common/types/button-types.ts), etc. **Never define domain types inline inside a composable** — put them in the relevant `common/types/` file and import from there. Generated API types live separately in [types/api.ts](types/api.ts).
- Composables are named `useXxx()` and may export multiple related functions from one file.
- **Auto-import prefix rule:** Nuxt prefixes components with their full folder path in PascalCase. Examples:
  - `components/App/Button.vue` → `<AppButton />`
  - `components/Pages/Home/Hero.vue` → `<PagesHomeHero />`
  - `components/Pages/Dashboard/Chat/Composer.vue` → `<PagesDashboardChatComposer />`
  - `components/Layouts/Dashboard/DashboardSidebar.vue` → `<LayoutsDashboardDashboardSidebar />`
- Always derive the correct tag name from the file path — never guess.
- Styling: use Tailwind utilities. Put reusable/global styles in [app/assets/css/main.css](app/assets/css/main.css) as utility classes. Use `<style scoped>` inside a component only for things Tailwind can't express (e.g. `@keyframes`).
- Always use the latest Tailwind CSS utilities — `size-*`, `gap-*`, `opacity-*` etc. all accept arbitrary integers (e.g. `size-18`). Use shorthand opacity syntax: `white/6`, `white/50` instead of `white/[0.06]`.
- On the primary brand color (orange/`brand-primary`), always use **white** text AND white icons. This applies to buttons, badges, hover states, dropdown items, and any element with a `brand-primary` background.
- **Icons on `variant="primary"` buttons must always use `color: 'white'`** in their `:icon-config`. Secondary-variant button icons use `'currentColor'` or a specific hex. Never use a dark/colored icon on a primary button.
- Always check `components/App/`, `components/ui/`, and `components/Form/` before creating a new primitive — use what exists.
- **Minimum readable text size: 14px on desktop.** Never use `text-[10px]`, `text-[11px]`, `text-[12px]`, or `text-[13px]` for body copy, action labels, button text, or any interactive element on desktop. `12px` is only acceptable for secondary metadata on mobile (`sm:` breakpoint) or truly non-critical helper text where it is intentional and visually clear. Never size action buttons or their icons so small the label or icon becomes illegible — if content looks squeezed, increase size or padding rather than shrinking text.
- **Do not touch backend files** (anything under `backend/`) unless Rekar explicitly instructs it in that message. Frontend work only.
- **Design must follow the backend — never invent fields, states, or features that don't exist in the API.** If the backend returns two vocabulary sources (`MANUAL` and `SESSION`), design for exactly those two. If a field is nullable, handle the null. If an endpoint doesn't exist, don't build UI for it. Check the backend contract first, then design.

### Color system — dashboard UI tokens

The dashboard UI colour system lives in **[app/assets/css/main.css](app/assets/css/main.css)**. All surface, border, text, and status colours are defined there as CSS custom properties and are the **single source of truth**. To change how the dashboard looks in light or dark mode, edit those values once — do not scatter raw hex/zinc/white/black utility classes across components.

**Token reference:**

| Token | Purpose |
|---|---|
| `--surface-page` | Outermost page / layout background |
| `--surface-card` | Card / panel background (`dash-card`, drawers) |
| `--surface-raised` | Slightly elevated surfaces inside a card (table header, code block bg, inner stat tile) |
| `--surface-well` | Deepest inset — icon wells, avatar fallback bg |
| `--border-card` | Card outer border |
| `--border-inner` | Dividers and inner borders inside a card |
| `--text-heading` | Primary headings and bold labels |
| `--text-body` | Normal body text |
| `--text-muted` | Secondary / helper text |
| `--text-subtle` | Tertiary / placeholder / icon tint |
| `--status-active-bg / -text` | Active/success badge background + text |
| `--status-inactive-bg / -text` | Inactive/neutral badge |
| `--status-blocked-bg / -text` | Blocked/warning badge |
| `--status-expired-bg / -text` | Expired/error badge |

Tailwind exposes them as `bg-surface-card`, `border-border-inner`, `text-text-heading`, etc. (because `@theme inline` maps them). You can also use inline `style` attributes for one-off cases: `style="background:var(--surface-raised)"`.

**Rules:**

- dont use rounded full for badges and buttons!!

- **Never use `bg-white`, `bg-zinc-*`, `border-black/*`, `border-zinc-*`, `text-zinc-*`, `text-gray-*` in dashboard components.** Use the tokens above instead.
- Status badges (Active/Inactive/Blocked/Expired) must always use the `--status-*` tokens, not hardcoded emerald/orange/red classes.
- `dash-card` already applies `var(--surface-card)` and `var(--border-card)` — do not override its background inline.
- For icon colors that track text tokens, pass `color="var(--color-text-muted)"` etc. to `<AppIconsax>`.

- dont make icon size too smal!! specially in buttons they should be 16 + !! 
- **NEVER use raw HTML elements or custom modal/overlay/drawer implementations when a shadcn or custom component exists.** Always prefer the component library. Mandatory substitutions:
  - Text/headings (`p`, `h1`–`h6`, `span` for content) → `<AppText>` with `size`, `weight`, `color`, `font-family` props. Valid sizes: `10 11 12 13 14 15 16 17 18 20 22 24 30 32 36 40 48`. Valid colors: `black neutral-600 neutral-400 brand-primary brand-ink brand-sub white error` etc. (see `common/types/text-types.ts`).
  - Buttons → `<AppButton>` with `variant` (`primary` | `secondary`), `size` (`24 28 32 36 38 48`), `radius` (`4 8 12 16`), `icon`, `text`, `loading`, `disabled`. Icon-only buttons omit `text`. Never use `<button>`. **Primary variant: always pass `color: 'white'` in `:icon-config`.**
  - Links / navigation → `<AppLink to="...">` or `<AppButton :to="...">`. Never use `<a>` or `<RouterLink>` directly.
  - Images → `<AppImage src="..." width height>`. Never use `<img>`.
  - Icons → `<AppIconsax name="..." color="..." :size="N">`. Never use raw SVG inline or other icon libraries unless the icon isn't in the Iconsax set.
  - Text inputs / textareas → `<FormInput id v-model label placeholder icon error ...>`. Never use `<input>` or `<textarea>` directly.
  - Copy-to-clipboard → `useCopyToClipboard(value)` composable (direct call, no destructuring). Never use `navigator.clipboard` directly.
  - Modals / dialogs → `<UiDialog>` + `<UiDialogContent/Header/Title/Description/Footer/Close>`. Never build a custom fixed-overlay div.
  - Side drawers / panels → `<UiSheet side="right">` + `<UiSheetContent/Header/Title>`. Never build a custom fixed side panel.
  - Empty states → `<UiEmpty>` + `<UiEmptyMedia/Content/Title/Description>`. Never write a one-off centered div with an icon and text.
  - Avatars → `<UiAvatar>` + `<UiAvatarImage>` + `<UiAvatarFallback>`. Never use a raw `<div>` as an avatar.
  - Skeletons → `<UiSkeleton>`. Never use a raw `animate-pulse` div.
  - Textareas → `<UiTextarea v-model ...>`. Never use `<textarea>` directly.
  - Selects / dropdowns → `<UiSelect>` + `<UiSelectTrigger>` + `<UiSelectValue>` + `<UiSelectContent>` + `<UiSelectItem>`. **Never pass an empty string as a `UiSelectItem` value** — Reka UI forbids it. Use a sentinel like `'ALL'` and convert back with a computed `get/set`.
  - **Card / row action menus → always use `<UiDropdownMenu>` triggered by a 3-dot `<AppButton aspect="square" icon="More">`.** Never show action buttons on hover (opacity-0 → opacity-100). Actions that are destructive (delete) must be separated with `<UiDropdownMenuSeparator>` and coloured red.
  - Delete confirmations → `<UiAlertDialog>` with Cancel + destructive Action. Never use `window.confirm()`.
- Fetch data only via the `useHttp` composable ([app/composables/useHttp.ts](app/composables/useHttp.ts)) — never call `fetch` directly.
- **Keep Vue files short.** If a template exceeds ~150 lines, extract sections into sub-components. Page files (`pages/`) hold state and layout glue only — no large inline template blocks. A 300+ line SFC template is always wrong.
- **Page files (`pages/`) must be thin — state wiring and layout glue only.** Every visual section belongs in its own component under `components/Pages/<Section>/`. A page file should contain only: `definePageMeta`, composable calls, refs for open/close state, and the template that assembles named components. No large template blocks, no inline UI, no direct API calls. Look at `pages/dashboard/chat.vue` and `pages/dashboard/index.vue` as the canonical examples — each is under 120 lines and contains zero inline UI.
- **Forms with more than 5 fields must get a dedicated page, not a dialog.** Use `UiDialog` only for forms with 1–5 fields. For 6+ fields (e.g. edit user, create class with many settings), create a proper `pages/` route with a full-page form layout. The form fields themselves should live in a reusable component under `components/Pages/<Section>/` so they can be shared between create and edit flows.

## API Types (do not edit)

[types/api.ts](types/api.ts) is **auto-generated** from the backend's Swagger spec via `openapi-typescript`. Never edit it manually — it is overwritten whenever the backend runs `bun run generate:types`. If a type is missing or wrong, fix the Swagger JSDoc on the relevant backend router, not this file.

Consume generated types with [openapi-fetch](https://openapi-ts.dev/openapi-fetch/):
```ts
import createClient from "openapi-fetch";
import type { paths } from "~/types/api";

const api = createClient<paths>({ baseUrl: "http://localhost:8000/api/v1" });
```

## HTTP Layer: `useHttp`

All API calls MUST go through [app/composables/useHttp.ts](app/composables/useHttp.ts). Do not call `fetch` directly from components or pages.

Responsibilities handled centrally:
- Base URL resolution and URL normalization
- JSON headers + `Accept-Language`
- Bearer token injection when `requireAuth: true` (reads from `useAuthStore().getAccessToken`, then `localStorage`, then cookie)
- **Automatic 401 → refresh-token retry** via `useAuthStore().refreshTokens()`, then silent retry of the original request
- Sign-out + toast when refresh fails
- Optional toast on success/failure (`showToast`)
- Uniform return shape: `{ success, message, data, status }`

Usage:
```ts
const { success, data, message } = await useHttp<User>({
  method: "GET",
  url: "/auth/me",
  baseUrl: "http://localhost:8000/api/v1",
  requireAuth: true,
  showToast: false,
});
```

## Auth Flow

- **Store:** Pinia store at [stores/auth.ts](../stores/auth.ts). Exposes state (`user`, `accessToken`, `refreshToken`, `isAuthenticated`, `isLoading`, `isCheckedUser`, `isTokenRefreshed`), getters (`getAccessToken`, `getRefreshToken`, `getUser`, `getIsAuthenticated`, `getIsLoading`), and actions (`signIn`, `signUp`, `googleAuth`, `forgotPassword`, `resetPassword`, `fetchUser`, `refreshTokens`, `signOut`).
- **Tokens:** access token in memory + `localStorage` + cookie; refresh handled silently by `useHttp` via `refreshTokens()`.
- **Route guarding:** [app/middleware/middleware.global.ts](app/middleware/middleware.global.ts) calls `fetchUser()` once per session and reads `to.meta.requiresAuth` / `to.meta.guestOnly` / `to.meta.requiresAdmin`. Unauthenticated users on protected routes → `/signin`. Authenticated users on guest-only routes → `/dashboard`. **Admin-only pages set `requiresAdmin: true` in `definePageMeta` — non-admins are bounced to `/dashboard`** (currently `dashboard/users/*`).
- **Landing:** `/` is the public marketing page. `/dashboard` is the authenticated home.

### Roles & Permissions (read before gating any UI)

The current user's **global account role** (STUDENT / TUTOR / ADMIN) comes from `useAuthStore().getUser?.role`. **Always read it through the [useRole](app/composables/useRole.ts) composable — never re-derive role checks inline:**

```ts
const { isAdmin, isTutor, isStaff } = useRole()   // isStaff = isAdmin || isTutor
```

- **`isStaff` (admin + tutor)** are teachers/operators, not learners. Personal-subscription and learner-only chrome is hidden from them: Billing nav + the FREE upgrade card (sidebar), the "New session" CTA + Billing/learner entries in the command palette (header), and the plan badge / email-digest toggle / Billing item (user avatar — staff show their role label instead of a plan). The student-only learner nav is AI Chat, Voice Lab, Vocabulary, Goals.
- **`requiresAdmin: true`** page meta is the route-level half of admin gating; the sidebar link visibility is the UI half. **Add both** when introducing an admin-only page.
- **This is the account role only.** Class-specific membership roles (`ClassUser.role`, `myRole`, `member.role`) are a *different* concept — derive those from the class, not from `useRole`. **Prefer the top-level `myRole` returned by `GET /classes/:id`** (the caller's own class role); only fall back to scanning the `members` list. Do NOT gate tutor UI solely on `members.find(me)?.role` — the members list is `isInternal`-filtered on the backend, so an internal/stealth account is absent from it and would be mis-gated (this caused the "tutor can't post" bug, fixed 2026-07-24 by adding `myRole` to the detail response). Note: ADMIN is never a class-membership role (only TUTOR/STUDENT appear in a class).
- All of this is **frontend UX**; the backend independently enforces authorization on every endpoint.

### Auth pages + layout

- Layout: [app/layouts/auth.vue](app/layouts/auth.vue) — split-screen shell (form left, branded ink panel right, hidden below `lg`) with a floating back button (`router.back()` with `/` fallback).
- Shared form shell: [app/components/Layouts/AuthFormLayout.vue](app/components/Layouts/AuthFormLayout.vue) — `title`/`subtitle` props, default slot for fields, `#alt` slot rendered under an "OR" divider (used for the Google button), optional `footer-text` + `footer-link-text` + `footer-link-to` link.
- All auth pages use `definePageMeta({ layout: 'auth', guestOnly: true })`:
  - [signin.vue](app/pages/signin.vue) — username + password + forgot-password link + Google.
  - [sign-up.vue](app/pages/signup.vue) — full register + auto sign-in on success + Google.
  - [forgot-password.vue](app/pages/forgot-password.vue) — emails a 6-digit OTP; always succeeds (backend never reveals enumeration).
  - [verify-otp.vue](app/pages/verify-otp.vue) — collects the OTP; backend has no separate verify endpoint, so this is a UX step that passes the OTP to the next page.
  - [reset-password.vue](app/pages/reset-password.vue) — submits `{ email, otp, newPassword }` to `/auth/reset-password`; on success swaps in `<FormAllDone>` inline and auto-redirects to `/signin` after 3s. **No `/all-done` route** — the all-done state is rendered in place.
  - [verify-email.vue](app/pages/verify-email.vue) — registration OTP step: submits `{ email, otp }` to `/auth/verify-email`, which returns a token pair (this is when a LOCAL account first logs in). Activates the FREE subscription (`INACTIVE→ACTIVE`).
  - [google-username.vue](app/pages/google-username.vue) — handles `needsRegistration: true` from `/auth/google`. Entry requires `sessionStorage.googleIdToken` (set by `<FormGoogleButton>`).
- Cross-page state (email + OTP between forgot → verify → reset, idToken + profile for Google sign-up) is carried via `sessionStorage` (keys: `resetEmail`, `resetOtp`, `googleIdToken`, `googleProfile`) and cleared on success.

### Validation + error surfaces

- Schemas in [app/common/schemas/AuthSchema.ts](app/common/schemas/AuthSchema.ts): `signInSchema`, `signUpSchema`, `forgotPasswordSchema`, `verifyOtpSchema`, `resetPasswordSchema`, `setPasswordSchema`, `googleUsernameSchema`. Each exports its inferred type.
- Forms use `<Form :schema :form-data @submit>` from [app/components/Form/Form.vue](app/components/Form/Form.vue); it runs the zod schema on submit and exposes field errors via the default slot (`<template #default="{ errors }">`).
- **Inline field errors:** pass `:error="errors.fieldName"` to `<FormInput>` (it renders via `<FormError>` internally) or `<FormVerificationInput>`.
- **Server-error banners:** keep a local `serverError` ref, set it from the `useHttp`/store response, and render `<FormServerError :error="serverError" />` inside the form.
- **Toasts (`vue-sonner`):** success/info only. Never use toasts for validation — those go inline.

### Google Sign-In

- Uses Google Identity Services (GIS) JS SDK directly — no `vue3-google-login` wrapper. The SDK is lazy-loaded by each component that needs it (`<script src="https://accounts.google.com/gsi/client">`). This avoids "initialize called multiple times" warnings and localhost FedCM edge cases.
- Reusable button: [app/components/Form/GoogleButton.vue](app/components/Form/GoogleButton.vue) — `<FormGoogleButton label="Continue with Google" />`. Renders as a custom pill-shaped white button visually, with Google's official `renderButton` output layered underneath at `opacity-0` to actually receive the click. This gives full control over the look while keeping Google's native flow (stable, always works). On sign-in, calls `authStore.googleAuth(idToken)`, redirects to `/dashboard` on success, or to `/google-username` when the backend returns `needsRegistration: true`.
- Client ID is read from `runtimeConfig.public.googleClientId` (set via `NUXT_PUBLIC_GOOGLE_CLIENT_ID`). It must match the `GOOGLE_CLIENT_ID` the backend verifies against, and `http://localhost:3001` must be listed as an Authorized JavaScript origin in Google Cloud Console.
- Dev-only token generator (NOT a production route): [app/pages/google-test.vue](app/pages/google-test.vue) — programmatically renders Google's sign-in button and displays the raw ID token, for pasting into Swagger. Mirrors the backend's `/api/v1/auth/google/test` page.

## Runtime Config

Defined in [nuxt.config.ts](nuxt.config.ts):
- `BASE_URL` — server-side base URL (from `NUXT_BASE_URL`).
- `public.googleClientId` — Google OAuth client ID (from `NUXT_PUBLIC_GOOGLE_CLIENT_ID`), consumed via `useRuntimeConfig().public.googleClientId`.

Add new public values under `runtimeConfig.public` and consume via `useRuntimeConfig().public.*`.

## Conventions

- **Imports:** `~/` → `app/`, `~~/` → workspace root. Prefer `~/` for anything inside `app/`.
- **Styling:** use `cn()` from [app/lib/utils.ts](app/lib/utils.ts) + `tailwind-merge` to merge classes. Use CVA (`class-variance-authority`) for variant-based components — see [app/common/types/button-types.ts](app/common/types/button-types.ts) for the pattern.
- **Icons:** prefer the `App/Iconsax.vue` wrapper; use `@iconify/vue` directly only when an icon isn't in the Iconsax set.
- **Toasts:** `vue-sonner` — `useHttp` already integrates it via `showToast: true`.
- **Naming:** components PascalCase, composables `useXxx`, types and Zod schemas go in `common/types/` and `common/schemas/` respectively (not co-located with components).

## Dashboard Layout & Structure

The authenticated dashboard uses a **fixed sidebar + scrollable body** pattern:

- **Layout:** [app/layouts/dashboard.vue](app/layouts/dashboard.vue) — `flex h-dvh overflow-hidden`. Manages `collapsed` (desktop collapse) and `mobileOpen` (mobile overlay) state and passes them to the sidebar.
- **Sidebar:** [app/components/Layouts/Dashboard/DashboardSidebar.vue](app/components/Layouts/Dashboard/DashboardSidebar.vue) — on desktop: inline collapsible (`w-58` ↔ `w-17`) via `collapsed` prop + `@toggle` emit. On mobile (`< md`): fixed full-height overlay (`z-50`, `translate-x-full` when closed) driven by `mobileOpen` prop + `@close-mobile` emit. A dark backdrop is rendered behind it. Closes automatically on route change. No Account section — profile/settings are accessed via the user avatar popup.
- **Header:** [app/components/Layouts/Dashboard/DashboardHeader.vue](app/components/Layouts/Dashboard/DashboardHeader.vue) — sticky breadcrumb + global search + notifications + CTA. On mobile shows a burger icon that emits `open-sidebar`. User avatar is `<BlockUserAvatar />`.
- **Command palette / search:** [app/components/Layouts/Dashboard/CommandPalette.vue](app/components/Layouts/Dashboard/CommandPalette.vue) — the header search bar (`⌘K`). Debounced (250ms, min 2 chars) call to `useGlobalSearch` → `GET /search`, rendering role-scoped result groups (Users/Classes/Vocabulary/Goals/Sessions) plus a static role-filtered Navigation quick-jump. Backend enforces role scoping; the palette just renders + routes (users→`/dashboard/users/:id`, classes→`/dashboard/classes/:id`, the rest→their page). `Enter` opens the first result.
- **User Avatar:** [app/components/Block/UserAvatar.vue](app/components/Block/UserAvatar.vue) — shadcn `DropdownMenu` showing user name, email, plan badge, then Profile / Settings links and a destructive Sign out item. Reads from `useAuthStore().getUser`.

### Dashboard Pages (file-based routing under `pages/dashboard/`)

All pages use `definePageMeta({ layout: 'dashboard', requiresAuth: true })`.

| Route | File | Status |
|---|---|---|
| `/dashboard` | `pages/dashboard/index.vue` | Built — **thin role switch**: ADMIN→`Dashboard/Admin/AdminDashboard`, TUTOR→`Dashboard/Tutor/TutorDashboard`, STUDENT→`Dashboard/Overview/UserDashboard` |
| `/dashboard/chat` | `pages/dashboard/chat.vue` | Built (student learner feature) |
| `/dashboard/voice` | `pages/dashboard/voice.vue` | Built — voice-call learner feature (student) |
| `/dashboard/vocab` | `pages/dashboard/vocab.vue` | Built — SRS vocabulary (student) |
| `/dashboard/goals` | `pages/dashboard/goals.vue` | Built (student) |
| `/dashboard/lessons` | `pages/dashboard/lessons.vue` | Stub — not yet linked in nav (commented out) |
| `/dashboard/profile` | `pages/dashboard/profile.vue` | Built |
| `/dashboard/billing` | `pages/dashboard/billing.vue` | Built — subscription + FIB payment panel (student-only; hidden from staff) |
| `/dashboard/users` | `pages/dashboard/users/index.vue` | Built — **ADMIN only** (`requiresAdmin: true`): user list, change role (`ChangeRoleDialog`, row 3-dot menu), active/banned toggle, assign/cancel subscription |
| `/dashboard/users/[id]` | `pages/dashboard/users/[id]/index.vue` | Built — **ADMIN only** (`requiresAdmin: true`): full user detail, tabs under `Users/Detail/` |
| `/dashboard/users/[id]/profile` | `pages/dashboard/users/[id]/profile.vue` | Built — **ADMIN only** (`requiresAdmin: true`): admin edit — avatar, basic profile, learner settings, plus **Account role** (`ChangeRoleDialog`) and Account status cards |
| `/dashboard/classes` | `pages/dashboard/classes/index.vue` | Built — **thin role switch** (like `dashboard/index.vue`): ADMIN→`Classes/Admin/AdminClassesView` (manage-all view, inline), TUTOR→`Classes/Tutor/TutorClassesView` (owned classes only), STUDENT→`Classes/Student/StudentClassesView` (enrolled + join) |
| `/dashboard/classes/create` | `pages/dashboard/classes/create.vue` | Built (tutor/admin) |
| `/dashboard/classes/[id]` | `pages/dashboard/classes/[id]/index.vue` | Built — full class detail page. **Archiving:** tutor/admin Archive/Unarchive button (PATCH `/classes/:id/archive`); when `cls.archived` the page is read-only (Edit, code Copy/Rotate, member-remove, announcement compose all hidden) and shows an archived banner with an Unarchive action. Admin & Tutor list views have an Active/Archived toggle. |
| `/dashboard/classes/[id]/edit` | `pages/dashboard/classes/[id]/edit.vue` | Built — edit class (tutor/admin) |

### Dashboard Component Folder (`components/Pages/Dashboard/`)

All dashboard page sub-components live here. **Never use `components/Dashboard/`** — that path is banned.

Beyond the learner sections shown in the tree below, these role-specific + shared folders also exist (mirroring the role-switch pages): `Dashboard/Admin/` (AdminDashboard), `Dashboard/Tutor/` (TutorDashboard, TutorActivityRow), `Dashboard/Overview/` (UserDashboard for students), `Dashboard/Users/` (admin user-management: UserTableRow, UserFilters, AssignSubscriptionModal, ChangeRoleDialog, plus `Users/Detail/` tabs), `Dashboard/Settings/` (SubscriptionPanel, FibPaymentModal), `Dashboard/Profile/`, and `Dashboard/Shared/` (DashStatCard, DashDonutChart, DashSparkbar, DashSectionCard, DashBreakdownRow — reused across all three dashboards). Notification chrome lives in `Layouts/Dashboard/` (NotificationBell, NotificationPanel).

```
components/Pages/Dashboard/
├─ Overview/
│  ├─ StatCard.vue           # Single stat tile (label / value / delta / icon)
│  ├─ GreetingHero.vue       # Welcome banner + goal ring + streak
│  ├─ VocabChart.vue         # SVG sparkline for vocabulary growth
│  ├─ NextUp.vue             # Recommended lesson + upcoming list
│  ├─ ActivityHeatmap.vue    # 12-week heatmap + recent sessions list
│  └─ DueWords.vue           # SRS due words + level progress bar
├─ Chat/
│  ├─ SessionsSidebar.vue    # Left sessions list panel
│  ├─ ThreadHeader.vue       # Chat top bar (topic, cefr, actions)
│  ├─ MessageThread.vue      # Scrollable messages area + empty state
│  ├─ MessageBubble.vue      # Single message bubble (user or AI)
│  ├─ ThinkingIndicator.vue  # Animated "Tutelage AI is thinking…" row
│  ├─ Composer.vue           # Fixed bottom input bar
│  ├─ SessionItem.vue        # Single row in the sessions list
│  └─ CoachPane.vue          # Right live-coaching panel
├─ Classes/
│  ├─ ClassCard.vue          # Card for a single class in the list
│  ├─ ClassForm.vue          # Shared create/edit class form
│  ├─ ClassMembersTab.vue    # Members list; owns remove/leave + set-role state, maps rows
│  ├─ ClassMemberRow.vue     # One member row: avatar/name/badge + 3-dot menu (Make tutor/student, Remove/Leave)
│  ├─ ClassStudentsTab.vue   # Student progress list + detail sheet (sheet has "Assign word" → AssignVocabularyModal)
│  ├─ AssignVocabularyModal.vue # Tutor/admin assigns a vocab word to a student (POST /vocabulary { assignedToUserId })
│  ├─ ClassAnalyticsTab.vue  # Class-wide skill averages + grammar errors
│  ├─ AnnouncementsFeed.vue  # Paginated announcement feed + compose box (tutor/admin)
│  ├─ ClassesEmptyState.vue  # Empty state for the classes list
│  ├─ JoinClassModal.vue     # Dialog to join a class by code
│  ├─ Tasks/                 # Tasks tab — visible to all members, write access tutor/admin only
│  │  ├─ ClassTasksTab.vue   # Tab root: list + pagination + create/edit/delete/toggle actions → <PagesDashboardClassesTasksClassTasksTab />
│  │  ├─ TaskCard.vue        # Task row with status badge, deadline chip, submission-state chip, 3-dot menu
│  │  ├─ TaskFormDialog.vue  # Create + edit task dialog (title / description / deadline)
│  │  ├─ TaskDetailSheet.vue # Right sheet: tutor sees all submissions + feedback; student submits / views own feedback
│  │  └─ SubmissionRow.vue   # Per-submission row with write/edit feedback (tutor only)
│  ├─ Admin/                 # ADMIN role view (rendered by classes/index.vue)
│  │  ├─ AdminClassesView.vue # Manage-all-classes UI: stats, filters, grid/table, delete → <PagesDashboardClassesAdminClassesView />
│  │  ├─ ClassGridCard.vue   # Grid card for admin manage view
│  │  └─ ClassTableRow.vue   # Table row for admin manage view
│  ├─ Tutor/                 # TUTOR role view — owned classes only; Active/Archived toggle
│  │  └─ TutorClassesView.vue # → <PagesDashboardClassesTutorClassesView />
│  └─ Student/               # STUDENT role view — enrolled classes + join
│     └─ StudentClassesView.vue # → <PagesDashboardClassesStudentClassesView />
├─ Voice/
│  ├─ PromptCard.vue
│  ├─ ScorePanel.vue
│  └─ PhonemeGrid.vue
├─ Vocab/
│  ├─ Flashcard.vue
│  └─ DeckList.vue
├─ Goals/
│  ├─ GoalCard.vue
│  └─ AchievementGrid.vue
└─ Lessons/
   ├─ CategoryFilter.vue
   └─ LessonCard.vue
```

Auto-import prefix: `<PagesDashboard{Section}{Component} />`. Examples:
- `<PagesDashboardOverviewStatCard />`
- `<PagesDashboardChatComposer />`
- `<PagesDashboardVoiceScorePanel />`

### Dashboard Types

Types are split by domain — never define them inline in a composable:

**`common/model/`** — one file per backend DB table, exact shape (no extra fields). Current: [user.ts](app/common/model/user.ts), [class.ts](app/common/model/class.ts) (`Class`, `ClassUser`, `Announcement`), [subscription.ts](app/common/model/subscription.ts) (`Subscription`, `FibSubscription`), [goal.ts](app/common/model/goal.ts), [notification.ts](app/common/model/notification.ts), [vocabulary.ts](app/common/model/vocabulary.ts), [task.ts](app/common/model/task.ts) (`Task`, `TaskSubmission`). Add a new model file before building UI for a new domain.

**`common/types/`** — API response shapes + UI types, one file per domain. Current: [admin-types.ts](app/common/types/admin-types.ts), [button-types.ts](app/common/types/button-types.ts), [chat-types.ts](app/common/types/chat-types.ts), [class-types.ts](app/common/types/class-types.ts), [dashboard-overview-types.ts](app/common/types/dashboard-overview-types.ts), [dashboard-types.ts](app/common/types/dashboard-types.ts), [iconsax-types.ts](app/common/types/iconsax-types.ts), [nav-links-type.ts](app/common/types/nav-links-type.ts), [notification-types.ts](app/common/types/notification-types.ts), [profile-links-type.ts](app/common/types/profile-links-type.ts), [profile-types.ts](app/common/types/profile-types.ts), [subscription-types.ts](app/common/types/subscription-types.ts), [task-types.ts](app/common/types/task-types.ts), [text-types.ts](app/common/types/text-types.ts), [tutor-types.ts](app/common/types/tutor-types.ts), [user-permissions.ts](app/common/types/user-permissions.ts), [vocabulary-types.ts](app/common/types/vocabulary-types.ts), [voice-types.ts](app/common/types/voice-types.ts).

**Rule:** model files (`common/model/`) = exact DB table shape. Type files (`common/types/`) = API response shapes that may extend/pick from model types. **Never define a domain type inline in a composable or component** — add it to the right `common/types/` file and import it. Import from `~/common/model/...` or `~/common/types/...` as appropriate. (Generated backend types live separately in [types/api.ts](types/api.ts) — never edited by hand.)

## Composables Reference

| Composable | File | Exports |
|---|---|---|
| `useHttp` | [useHttp.ts](app/composables/useHttp.ts) | Single `useHttp(options)` function — **all API calls must go through this** |
| `useRole` | [useRole.ts](app/composables/useRole.ts) | `isAdmin`, `isTutor`, `isStaff` — current user's **global account role**. Use for all role-gated UI (see [Roles & Permissions](#roles--permissions-read-before-gating-any-ui)) |
| `useGlobalSearch` | [useGlobalSearch.ts](app/composables/useGlobalSearch.ts) | `search(q)` → `GET /search?q=` — role-aware global search (users/classes/vocab/goals/sessions). Backend scopes by role; powers the header command palette ([CommandPalette.vue](app/components/Layouts/Dashboard/CommandPalette.vue)) |
| `useClasses` | [useClasses.ts](app/composables/useClasses.ts) | `listMyClasses` / `listAllClasses` (both accept `{ archived?: boolean }`), `getClass`, `joinClass`, `createClass`, `updateClass`, `refreshCode`, `updateCodeSettings`, `toggleBlock`, `archiveClass`, `getClassStudents`, `getClassStudentDetail`, `getClassAnalytics`, `removeMember`, `setMemberRole`, `listAnnouncements`, `createAnnouncement` |
| `useAdmin` / `useAdminDashboard` | [useAdmin.ts](app/composables/useAdmin.ts) | Admin user/class management + admin dashboard data |
| `useTutorDashboard` | [useTutorDashboard.ts](app/composables/useTutorDashboard.ts) | Tutor dashboard data |
| `useDashboardOverview` | [useDashboardOverview.ts](app/composables/useDashboardOverview.ts) | Student overview page data |
| `useSubscription` | [useSubscription.ts](app/composables/useSubscription.ts) | `getMySubscription`, `initiateFib`, `getFibStatus`, `cancelFib` |
| `useChatPage` / `useSessions` | [useChatPage.ts](app/composables/useChatPage.ts) | Chat page state/actions; `useSessions` is the raw session API layer it builds on |
| `useVoiceChat` / `useVoiceLab` | [useVoiceChat.ts](app/composables/useVoiceChat.ts) | Voice pipeline state + Voice Lab |
| `useVocabPage` / `useVocabulary` | [useVocabPage.ts](app/composables/useVocabPage.ts) | Vocab page state; `useVocabulary` is the raw vocab API layer |
| `useTasks` | [useTasks.ts](app/composables/useTasks.ts) | `listClassTasks`, `getTask`, `createTask`, `updateTask`, `deleteTask`, `submitTask`, `listSubmissions`, `giveFeedback` |
| `useGoals` | [useGoals.ts](app/composables/useGoals.ts) | Goals page data |
| `useProfile` | [useProfile.ts](app/composables/useProfile.ts) | Profile page data |
| `useNotifications` | [useNotifications.ts](app/composables/useNotifications.ts) | `fetchNotifications`, `markAllRead`, `markOneRead(id)`, `connectSocket`, `disconnectSocket` |
| `useSeo` / `useEnv` / `useScrollToTop` / `useSelectDropdown` | — | Small shared utilities |
| `useCopyToClipboard` | [useCpyToClipboard.ts](app/composables/useCpyToClipboard.ts) | `useCopyToClipboard(value)` — direct call, no destructuring |

**Page-level composables follow a consistent pattern:** a `useXxxPage`/`useXxx` composable owns all state and actions for a page, calling a thinner raw-API composable (e.g. `useSessions`, `useVocabulary`) which calls `useHttp`. Pages just call the page composable. When adding a new page, follow this layering — never put API calls or business logic in the page or component.

## Related Docs

- [docs/folder_structure_rules.md](docs/folder_structure_rules.md) — authoritative folder layout
- [../backend/CLAUDE.md](../backend/CLAUDE.md) — backend API contract, auth endpoints, tier limits
- [../CLAUDE.md](../CLAUDE.md) — monorepo overview + type-sharing flow
