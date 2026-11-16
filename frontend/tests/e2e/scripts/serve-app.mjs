// Serves the production Nuxt bundle for Playwright, pointed at the mock API.
// Rebuilds only when a source file is newer than the last e2e build, so repeat
// runs skip the (CPU-heavy) build. Force one with E2E_BUILD=1.
import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

// Windows: a lower-case drive letter (VS Code terminals) makes Nuxt/Vite resolve
// the same file twice and the build fails. Normalise before doing anything.
const fixDrive = (p) => p.replace(/^[a-z]:/, (d) => d.toUpperCase())
const root = fixDrive(fileURLToPath(new URL('../../../', import.meta.url)))
const entry = join(root, '.output-e2e', 'server', 'index.mjs')

function newestMtime(path) {
  const s = statSync(path)
  if (!s.isDirectory()) return s.mtimeMs
  return readdirSync(path).reduce((max, f) => Math.max(max, newestMtime(join(path, f))), s.mtimeMs)
}

const sources = ['app', 'stores', 'server', 'i18n', 'public', 'nuxt.config.ts', 'package.json'].map((p) => join(root, p))
const stale = !existsSync(entry) || Math.max(...sources.filter(existsSync).map(newestMtime)) > statSync(entry).mtimeMs

if (process.env.E2E_BUILD === '1' || stale) {
  console.log('[e2e] building app (sources changed)…')
  const nuxi = join(root, 'node_modules', '@nuxt', 'cli', 'bin', 'nuxi.mjs')
  const result = spawnSync(process.execPath, [nuxi, 'build', '--envName', 'e2e'], { cwd: root, stdio: 'inherit' })
  if (result.status !== 0) process.exit(result.status ?? 1)
} else {
  console.log('[e2e] reusing existing build')
}

// Nitro's node entry starts listening on import; running it in this process means
// Playwright's shutdown of this script leaves nothing behind.
process.chdir(root)
await import(pathToFileURL(entry).href)
