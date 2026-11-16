# Frontend tests

```
tests/
├─ unit/               Vitest
│  ├─ **/*.test.ts         pure logic in Node (schemas, helpers, plan data, i18n parity)
│  ├─ **/*.nuxt.test.ts    inside a real Nuxt runtime (composables, auth store,
│  │                       route guard, components via mountSuspended)
│  └─ helpers/fetch-mock.ts  mockFetch({ 'POST /auth/login': ok(...) }) — records calls
├─ e2e/                Playwright, against the production build + a mock API
│  ├─ specs/*.spec.ts                functional flows (desktop)
│  ├─ specs/*.responsive.spec.ts     layout checks on desktop, tablet and phone
│  ├─ support/fixtures.ts   test, loginAs(persona), mockApi(), auto "no page errors"
│  ├─ support/layout.ts     expectNoHorizontalOverflow(), isPhone(), …
│  ├─ mock-api/             deterministic backend stand-in (routes.ts = one line per endpoint)
│  └─ scripts/serve-app.mjs builds (only when sources changed) and serves the app
└─ fixtures/           API payloads shared by unit + e2e, typed against app types
```

## Commands

```bash
bun run test              # all unit tests (~5s)
bun run test:watch
bun run test:coverage     # report in tests/.coverage
bun run test:e2e          # all e2e: desktop + tablet + phone (~2 min, 2 workers)
bun run test:e2e -- --project=desktop          # just desktop
bun run test:e2e -- learner -g "AI chat"       # one file / one group
bun run test:e2e:ui       # Playwright UI mode
bun run test:e2e:report   # open the last HTML report
```

First run only: `npx playwright install chromium`.

## How e2e works

- `nuxi build --envName e2e` writes to `.nuxt-e2e/` + `.output-e2e/`, so it never
  touches your dev server. Rebuilds happen only when `app/`, `stores/`, `server/`,
  `i18n/`, `public/` or the config changed (`E2E_BUILD=1` forces one).
- The app runs on **:3100** and talks to the mock API on **:4010**, for both SSR and
  browser requests. No database, no real backend, no AI calls.
- The mock API runs inside the Playwright process and the app server is stopped by
  Playwright, so nothing keeps running after a test run.
- Accounts (password `password123`): `student_ali` (PREMIUM), `student_yuki` (FREE),
  `tutor_sarah`, `admin_main`. In a test, `await loginAs('tutor')` skips the form.
- Per-test API changes: `await mockApi('GET', '/dashboard/overview', { status: 500 })`.
- Debug the API traffic: `E2E_LOG_API=1 bun run test:e2e -- <file>` prints every call,
  labelled `ssr` or `browser`.
- Every test automatically fails on an uncaught browser error.

## Adding a test

- **New endpoint?** Add its route to `e2e/mock-api/routes.ts` (copy the real backend
  status codes and messages) and its payload to `fixtures/api.ts`.
- **New page?** Add it to `PAGES` in `e2e/specs/dashboard-roles.spec.ts` and to
  `APP_PAGES` in `e2e/specs/layout.responsive.spec.ts`. That alone checks it renders
  for the right roles without crashing and fits on a phone.
- Prefer `getByRole` / `getByLabel` / visible text over CSS classes.

## Known bugs pinned by tests

When a test finds a bug that isn't fixed yet, mark it `test.fail` / `it.fails` with a
`KNOWN BUG` comment: it passes while the bug exists and **turns red once it is fixed**,
then you remove the marker. None are open right now. The five found by the first run
(SSR refresh sign-out, masked 429 messages, goal delete, language lost on reload,
`AppButton` `disabled`) were fixed on 2026-11-16 and their tests are now normal tests.

## Windows note

VS Code terminals often open in `c:\…` (lower-case drive letter), which makes Vitest
and the Nuxt build load modules twice. `tests/run-vitest.mjs` and
`e2e/scripts/serve-app.mjs` normalise the path, so always use the `bun run` scripts.
