import { defineConfig, devices } from '@playwright/test'

const APP_PORT = Number(process.env.E2E_APP_PORT ?? 3100)
const API_BASE = `http://localhost:${process.env.E2E_API_PORT ?? 4010}/api/v1`

/**
 * E2E against the real production build + a deterministic mock API.
 *
 *   *.spec.ts              functional flows — desktop only (fast)
 *   *.responsive.spec.ts   layout checks    — desktop, tablet and phone
 *
 * Workers are capped at 2 so a local run does not saturate the machine.
 */
export default defineConfig({
  testDir: 'tests/e2e/specs',
  outputDir: 'tests/.playwright-results',
  fullyParallel: true,
  workers: Number(process.env.E2E_WORKERS ?? 2),
  retries: process.env.CI ? 1 : 0,
  forbidOnly: Boolean(process.env.CI),
  timeout: 30_000,
  expect: { timeout: 7_000 },
  reporter: [['list'], ['html', { outputFolder: 'tests/.playwright-report', open: 'never' }]],
  globalSetup: './tests/e2e/global-setup.ts',
  use: {
    baseURL: `http://localhost:${APP_PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'en-US',
    timezoneId: 'Asia/Baghdad',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'tablet',
      testMatch: /.*\.responsive\.spec\.ts/,
      use: { ...devices['iPad Mini'], browserName: 'chromium' },
    },
    {
      name: 'mobile',
      testMatch: /.*\.responsive\.spec\.ts/,
      use: { ...devices['Pixel 7'] },
    },
  ],
  webServer: {
    command: 'node tests/e2e/scripts/serve-app.mjs',
    url: `http://localhost:${APP_PORT}/robots.txt`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    stdout: 'ignore',
    stderr: 'pipe',
    env: {
      PORT: String(APP_PORT),
      NITRO_PORT: String(APP_PORT),
      NUXT_BASE_URL: API_BASE,
      NUXT_PUBLIC_BASE_URL: API_BASE,
    },
  },
})
