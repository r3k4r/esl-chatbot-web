import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import { defineVitestProject } from '@nuxt/test-utils/config'

const app = fileURLToPath(new URL('./app', import.meta.url))
const root = fileURLToPath(new URL('./', import.meta.url))

// Two projects:
//  - "unit": pure logic (schemas, helpers, data) in plain Node — fast, no Nuxt boot.
//  - "nuxt": files named *.nuxt.test.ts run inside a real Nuxt runtime (auto-imports,
//    Pinia, i18n, components) so composables, the auth store, middleware and
//    components are tested exactly as the app uses them.
export default defineConfig({
  test: {
    projects: [
      {
        resolve: { alias: { '~~': root, '~': app, '@': app } },
        test: {
          name: 'unit',
          environment: 'node',
          include: ['tests/unit/**/*.test.ts'],
          exclude: ['tests/unit/**/*.nuxt.test.ts'],
        },
      },
      await defineVitestProject({
        test: {
          name: 'nuxt',
          environment: 'nuxt',
          include: ['tests/unit/**/*.nuxt.test.ts'],
          // Booting the Nuxt runtime takes ~8s per file on this machine; the 10s default
          // made whole files flake to "skipped" whenever the PC was busy.
          hookTimeout: 30_000,
          environmentOptions: {
            nuxt: { domEnvironment: 'happy-dom' },
          },
        },
      }),
    ],
    coverage: {
      provider: 'v8',
      include: ['app/**/*.{ts,vue}', 'stores/**/*.ts'],
      exclude: ['app/components/ui/**'],
      reportsDirectory: 'tests/.coverage',
    },
  },
})
