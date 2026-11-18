// Retakes the screenshots used by the public feature pages (/features/[slug]).
//
//   cd frontend && node scripts/capture-feature-shots.cjs
//
// Needs the dev app on :3001 and the API on :8000 with seed data (signs in as the seed
// student, localhost only). Runs a headless Chromium at 1568×777 CSS px, 3× pixel density,
// light theme, and writes public/features/<name>.webp (1×), @2x and @3x. The browser always
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

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

;(async () => {
  const browser = await chromium.launch({ headless: true })
  try {
    const context = await browser.newContext({ viewport: { width: 1568, height: 777 }, deviceScaleFactor: 3, colorScheme: 'light' })
    await context.addInitScript(() => { try { localStorage.setItem('theme', 'light') } catch {} })
    const page = await context.newPage()

    const settle = async (ms = 1500) => {
      await page.waitForLoadState('networkidle').catch(() => {})
      await page.addStyleTag({ content: '#nuxt-devtools-container,[id^=nuxt-devtools],nuxt-devtools-frame{display:none!important}' })
      await wait(ms)
    }
    const shoot = async (name) => {
      // The profile's saved theme may be dark; the shots are always light (nothing is saved)
      await page.evaluate(() => document.documentElement.classList.remove('dark'))
      await wait(400)
      const file = path.join(TMP, `${name}.png`)
      await page.screenshot({ path: file, clip: { x: 0, y: 0, width: 1552, height: 777 } }) // drops the scrollbar
      const enc = { quality: 92, smartSubsample: true, effort: 6 }
      await sharp(file).webp(enc).toFile(path.join(OUT, `${name}@3x.webp`))
      await sharp(file).resize({ width: 3104, kernel: 'lanczos3' }).webp(enc).toFile(path.join(OUT, `${name}@2x.webp`))
      await sharp(file).resize({ width: 1552, kernel: 'lanczos3' }).webp(enc).toFile(path.join(OUT, `${name}.webp`))
      console.log('saved', name)
    }

    await page.goto(`${BASE}/signin`)
    await page.waitForLoadState('networkidle')
    await wait(1500) // let Nuxt hydrate, or the typed values are wiped
    await page.getByPlaceholder('Enter your username').fill(STUDENT.username)
    await page.getByPlaceholder('Enter your password').fill(STUDENT.password)
    await page.getByPlaceholder('Enter your password').press('Enter')
    await page.waitForURL((u) => u.pathname.startsWith('/dashboard'), { timeout: 20000 })

    await page.goto(`${BASE}/dashboard`); await settle(2000); await shoot('dashboard-home')
    await page.evaluate(() => document.querySelector('main .overflow-y-auto')?.scrollTo(0, 395)); await wait(800); await shoot('dashboard-progress')
    await page.goto(`${BASE}/dashboard/chat`); await settle(); await shoot('chat-new')
    await page.getByText('Travel planning conversation').first().click(); await settle(); await shoot('chat-session')
    await page.goto(`${BASE}/dashboard/voice`); await settle(); await shoot('voice-lab')
    await page.goto(`${BASE}/dashboard/vocab`); await settle(); await shoot('vocab-card')
    await page.getByText('Tap to reveal meaning').first().click(); await wait(900); await shoot('vocab-review') // flips only, never rates
    await page.goto(`${BASE}/dashboard/goals`); await settle(); await shoot('goals')
  } finally {
    await browser.close()
    fs.rmSync(TMP, { recursive: true, force: true })
  }
})().catch((e) => { console.error(e); process.exit(1) })
