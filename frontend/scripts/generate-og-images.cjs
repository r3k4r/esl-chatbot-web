// Draws the social share images (Open Graph / Twitter cards), 1200x630, in the feature-page look:
// ink field, two-line headline, the real screen rising from the bottom.
//
//   cd frontend && node scripts/generate-og-images.cjs
//
// Writes public/og/default.jpg (site-wide, used by useSeo) and public/og/<slug>.jpg for each
// feature page. Words come from i18n/locales/en.json, screens from public/features/ (retake those
// with capture-feature-shots.cjs first). No dev server needed. Rerun when either changes.
const path = require('path')
const fs = require('fs')
const { chromium } = require('playwright-core')
const sharp = require('sharp')

const ROOT = path.resolve(__dirname, '..')
const OUT = path.join(ROOT, 'public/og')
const en = require(path.join(ROOT, 'i18n/locales/en.json'))

// shortcut: slugs/screens duplicated from app/common/data/feature-pages.ts (a .ts file node can't require); keep in sync.
const FEATURES = [
  { key: 'conversation', slug: 'ai-conversation', shot: 'chat-session' },
  { key: 'voice', slug: 'voice-practice', shot: 'voice-lab' },
  { key: 'vocab', slug: 'vocabulary', shot: 'vocab-card' },
  { key: 'pronunciation', slug: 'pronunciation', shot: 'dashboard-progress' },
  { key: 'goals', slug: 'goals', shot: 'goals' },
  { key: 'analytics', slug: 'progress', shot: 'dashboard-home' },
]

const dataUri = (file, type) => `data:${type};base64,${fs.readFileSync(file).toString('base64')}`
const font = (weight, file) => `@font-face{font-family:M;font-weight:${weight};src:url(${dataUri(path.join(ROOT, 'app/assets/fonts', file), 'font/ttf')})}`
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')

const LOGO = dataUri(path.join(ROOT, 'public/only-logo-black-border-yellow-bg.svg'), 'image/svg+xml')

const html = ({ line1, line2, label, shot }) => `<!doctype html><html><head><style>
${font(500, 'Montserrat-Medium.ttf')}${font(600, 'Montserrat-SemiBold.ttf')}
*{margin:0;box-sizing:border-box}
body{width:1200px;height:630px;overflow:hidden;background:#111;color:#fafafa;font-family:M,sans-serif;position:relative}
.top{position:absolute;left:64px;right:64px;top:52px;display:flex;align-items:center;justify-content:space-between}
.brand{display:flex;align-items:center;gap:14px}
.brand img{height:44px}.brand span{font-size:28px;font-weight:600;letter-spacing:-0.02em}.brand b{color:#f59e0b;font-weight:600}
.label{font-size:24px;font-weight:500;color:#f59e0b}
h1{position:absolute;left:60px;top:132px;font-size:76px;font-weight:600;line-height:1;letter-spacing:-0.04em}
h1 span{display:block}h1 .accent{color:#f59e0b}
.shot{position:absolute;left:64px;right:64px;top:338px;height:340px;overflow:hidden;border-radius:18px 18px 0 0;background:#fafafa;box-shadow:0 0 0 1px rgba(250,250,250,.12),0 -30px 80px -30px rgba(0,0,0,.6)}
.shot img{width:100%;display:block}
</style></head><body>
<div class="top">
  <div class="brand"><img src="${LOGO}"><span>Tutelage <b>AI</b></span></div>
  ${label ? `<div class="label">${esc(label)}</div>` : ''}
</div>
<h1><span>${esc(line1)}</span><span class="accent">${esc(line2)}</span></h1>
<div class="shot"><img src="${dataUri(path.join(ROOT, `public/features/${shot}@2x.webp`), 'image/webp')}"></div>
</body></html>`

const CARDS = [
  { name: 'default', line1: 'Learn English', line2: 'smarter with AI.', shot: 'dashboard-home' },
  ...FEATURES.map((f) => {
    const it = en.featurePages.items[f.key]
    return { name: f.slug, line1: it.line1, line2: it.line2, label: it.seoTitle, shot: f.shot }
  }),
]

;(async () => {
  fs.mkdirSync(OUT, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  try {
    // Drawn at 2x, then scaled down: crisper type than a 1x render.
    const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 2 })
    for (const card of CARDS) {
      await page.setContent(html(card), { waitUntil: 'load' })
      await page.evaluate(() => document.fonts.ready)
      const png = await page.screenshot({ type: 'png' })
      await sharp(png).resize({ width: 1200, kernel: 'lanczos3' }).jpeg({ quality: 88, mozjpeg: true }).toFile(path.join(OUT, `${card.name}.jpg`))
      console.log('saved', `og/${card.name}.jpg`)
    }
  } finally {
    await browser.close()
  }
})()
