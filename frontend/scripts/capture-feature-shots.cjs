// Retakes the screenshots used by the public feature pages (/features/[slug]).
//
//   cd frontend && node scripts/capture-feature-shots.cjs
//
// Needs the dev app on :3001 and the API on :8000 with seed data (signs in as the seed
// student, localhost only). Headless Chromium at 3x pixel density:
//   - desktop: 1568x777 CSS px (cropped to 1552 to drop the scrollbar), light theme
// Each shot is written to public/features/<name>.webp (1x), @2x and @3x. The browser always
// closes. Afterwards check the tour boxes in app/common/data/feature-pages.ts still line up.
const path = require('path')
const fs = require('fs')
const os = require('os')
const { chromium } = require('playwright-core')
const sharp = require('sharp')

const BASE = 'http://localhost:3001'
const OUT = path.resolve(__dirname, '../public/features')
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'feature-shots-'))
const STUDENT = { username: 'student_ali', password: 'password123' } // seed account (prisma/seed.ts)
const DESKTOP = { width: 1552, height: 777 }

const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const ENCODE = { quality: 94, smartSubsample: true, effort: 6 }

/** Saves a page's screenshot as <name>@3x / @2x / 1x webp. */
async function shoot(page, name, size, theme) {
  await page.evaluate((dark) => document.documentElement.classList.toggle('dark', dark), theme === 'dark')
  await wait(500)
  const file = path.join(TMP, `${name}.png`)
  await page.screenshot({ path: file, clip: { x: 0, y: 0, ...size } })
  await sharp(file).webp(ENCODE).toFile(path.join(OUT, `${name}@3x.webp`))
  await sharp(file).resize({ width: size.width * 2, kernel: 'lanczos3' }).webp(ENCODE).toFile(path.join(OUT, `${name}@2x.webp`))
  await sharp(file).resize({ width: size.width, kernel: 'lanczos3' }).webp(ENCODE).toFile(path.join(OUT, `${name}.webp`))
  console.log('saved', name)
}

// The shots show the seeded demo account only. Chats and tasks left behind by development
// testing are filtered out, and seeded goal dates that have passed are hidden (no "125d
// overdue"). Responses are edited in this browser only; nothing is written.
const undated = (g) => (g?.targetDate && new Date(g.targetDate) < new Date() ? { ...g, targetDate: null } : g)
async function tidy(ctx) {
  await ctx.route(/\/api\/v1\/(sessions|goals|dashboard\/overview)(\?.*)?$/, async (route) => {
    if (route.request().method() !== 'GET') return route.continue()
    const res = await route.fetch()
    const json = await res.json().catch(() => null)
    const d = json?.data
    if (Array.isArray(d)) {
      // /sessions: the seeded chats are the ones with a summary; /goals: every goal, dates fixed
      json.data = d.filter((x) => !('summary' in x) || !!x.summary).map(undated)
    } else if (d?.recentChats) {
      d.recentChats = d.recentChats.filter((c) => c.title && c.score !== 0) // untitled or 0-score test chats
      d.tasks = d.tasks.filter((t) => t.title.trim().toLowerCase() !== 'test')
      d.goals = (d.goals ?? []).map(undated)
    }
    await route.fulfill({ response: res, json })
  })
}

async function settle(page, ms = 1500) {
  await page.waitForLoadState('networkidle').catch(() => {})
  await page.addStyleTag({ content: '#nuxt-devtools-container,[id^=nuxt-devtools],nuxt-devtools-frame{display:none!important}' })
  await wait(ms)
}

;(async () => {
  const browser = await chromium.launch({ headless: true })
  try {
    // ── Desktop, light ───────────────────────────────────────────────────────
    const desktop = await browser.newContext({ viewport: { width: 1568, height: 777 }, deviceScaleFactor: 3, colorScheme: 'light' })
    await desktop.addInitScript(() => { try { localStorage.setItem('theme', 'light') } catch {} })
    await tidy(desktop)
    const page = await desktop.newPage()

    await page.goto(`${BASE}/signin`)
    await page.waitForLoadState('networkidle')
    await wait(1500) // let Nuxt hydrate, or the typed values are wiped
    await page.getByPlaceholder('Enter your username').fill(STUDENT.username)
    await page.getByPlaceholder('Enter your password').fill(STUDENT.password)
    await page.getByPlaceholder('Enter your password').press('Enter')
    await page.waitForURL((u) => u.pathname.startsWith('/dashboard'), { timeout: 20000 })

    await page.goto(`${BASE}/dashboard`); await settle(page, 2500); await shoot(page, 'dashboard-home', DESKTOP)
    await page.evaluate(() => document.querySelector('main .overflow-y-auto')?.scrollTo(0, 395)); await wait(800); await shoot(page, 'dashboard-progress', DESKTOP)
    await page.goto(`${BASE}/dashboard/chat`); await settle(page); await shoot(page, 'chat-new', DESKTOP)
    await page.getByText('Travel planning conversation').first().click(); await settle(page, 2500); await shoot(page, 'chat-session', DESKTOP)
    await page.goto(`${BASE}/dashboard/voice`); await settle(page); await shoot(page, 'voice-lab', DESKTOP)
    await page.goto(`${BASE}/dashboard/vocab`); await settle(page); await shoot(page, 'vocab-card', DESKTOP)
    await page.getByText('Tap to reveal meaning').first().click(); await wait(900); await shoot(page, 'vocab-review', DESKTOP) // flips only, never rates
    await page.goto(`${BASE}/dashboard/goals`); await settle(page); await shoot(page, 'goals', DESKTOP)

  } finally {
    await browser.close()
    fs.rmSync(TMP, { recursive: true, force: true })
  }
})().catch((e) => { console.error(e); process.exit(1) })
