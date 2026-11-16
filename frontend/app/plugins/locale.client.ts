import { LOCALE_STORAGE_KEY } from '~/composables/useLocale'

/**
 * Restores the language the visitor picked (saved by useLocale().setLocale).
 * Runs after hydration: the server can't read localStorage, so switching before
 * the app mounts would make the client markup disagree with the server's.
 */
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('app:mounted', () => {
    let saved: string | null = null
    try { saved = localStorage.getItem(LOCALE_STORAGE_KEY) } catch { /* storage unavailable */ }
    const i18n = nuxtApp.$i18n as { locale: { value: string }, locales: { value: { code: string }[] }, setLocale: (code: string) => Promise<void> }
    if (saved && saved !== i18n.locale.value && i18n.locales.value.some((l) => l.code === saved)) {
      i18n.setLocale(saved)
    }
  })
})
