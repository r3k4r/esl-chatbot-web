import { LOCALE_COOKIE } from '~/composables/useLocale'

/**
 * Applies the language the visitor picked (saved in a cookie by useLocale().setLocale)
 * BEFORE the page renders — on the server too — so a Kurdish visitor gets Kurdish text
 * AND right-to-left layout on the first paint, refreshes and shared links. (Restoring it
 * after hydration from localStorage left the server's LTR markup in place.)
 */
export default defineNuxtPlugin({
  name: 'locale-cookie',
  dependsOn: ['i18n:plugin:route-locale-detect'],
  async setup(nuxtApp) {
    const saved = useCookie<string | null>(LOCALE_COOKIE).value
    const i18n = nuxtApp.$i18n as { locale: { value: string }, locales: { value: { code: string }[] }, setLocale: (code: string) => Promise<void> }
    if (saved && saved !== i18n.locale.value && i18n.locales.value.some((l) => l.code === saved)) {
      await i18n.setLocale(saved)
    }
  },
})
