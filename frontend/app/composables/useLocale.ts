/**
 * Thin wrapper around @nuxtjs/i18n that preserves the existing `useLocale()`
 * API surface used by all public marketing components.
 *
 * Backed by @nuxtjs/i18n. The chosen language is remembered in a cookie (i18n's
 * own browser detection is off: `detectBrowserLanguage: false`) and applied before
 * render by plugins/locale.ts — so the server renders the right language and `dir`.
 *
 * Usage in components is unchanged:
 *   const { t, dir, isRtl, locale, locales, setLocale, config } = useLocale()
 *   // template: {{ t('hero.titleLead') }}
 */
export const LOCALE_COOKIE = 'locale'

export function useLocale() {
  const { locale, locales, setLocale: i18nSetLocale, t, tm, rt } = useI18n()
  // A year; read on the server by plugins/locale.ts.
  const localeCookie = useCookie<string | null>(LOCALE_COOKIE, { maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' })

  const config = computed(() => {
    return locales.value.find((l) => l.code === locale.value) ?? locales.value[0]
  })

  const dir = computed(() => (config.value as { dir?: string } | undefined)?.dir ?? 'ltr')
  const isRtl = computed(() => dir.value === 'rtl')
  const htmlLang = computed(() => (config.value as { language?: string } | undefined)?.language ?? locale.value)
  const nativeName = computed(() => (config.value as { name?: string } | undefined)?.name ?? locale.value)

  function setLocale(next: string) {
    // Cast to any because the i18n locale type is narrower than string but we
    // validate via the locale registry before calling.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    i18nSetLocale(next as any)
    localeCookie.value = next
  }

  /**
   * Resolves a locale array key to plain strings.
   * `tm()` returns compiled message objects in v10; `rt()` converts each to string.
   */
  function ta(key: string): string[] {
    const raw = tm(key)
    if (!Array.isArray(raw)) return []
    return raw.map((item) => rt(item))
  }

  return {
    locale,
    locales,
    config,
    dir,
    isRtl,
    htmlLang,
    nativeName,
    t,
    tm,
    ta,
    setLocale,
  }
}
