// Launches Vitest from a path whose Windows drive letter is upper-case.
// VS Code terminals often start in `c:\...`; Vitest then loads two copies of itself
// (`c:/` vs `C:/`) and every test fails with "failed to find the current suite".
// On macOS/Linux/CI this is a plain pass-through.
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const fixDrive = (p) => p.replace(/^[a-z]:/, (d) => d.toUpperCase())
const root = fixDrive(fileURLToPath(new URL('..', import.meta.url)))
const bin = fixDrive(fileURLToPath(new URL('../node_modules/vitest/vitest.mjs', import.meta.url)))

const result = spawnSync(process.execPath, [bin, ...process.argv.slice(2)], { cwd: root, stdio: 'inherit' })
process.exit(result.status ?? 1)
