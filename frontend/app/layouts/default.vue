<script setup lang="ts">
// Locale direction is scoped to the PUBLIC layout only — the dashboard and
// auth layouts never bind these, so they stay LTR regardless of the chosen
// language. `dir="rtl"` here flips text flow + Tailwind's `rtl:` variants
// for the whole marketing site at once.
//
// @nuxtjs/i18n sets the <html lang> automatically; we only need `dir` on
// the layout wrapper so Tailwind RTL utilities apply correctly.
const { locale, locales } = useI18n()

const dir = computed(() => {
  const found = locales.value.find((l: { code: string; dir?: string }) => l.code === locale.value)
  return (found as { dir?: string } | undefined)?.dir ?? 'ltr'
})

const htmlLang = computed(() => {
  const found = locales.value.find((l: { code: string; language?: string }) => l.code === locale.value)
  return (found as { language?: string } | undefined)?.language ?? locale.value
})

useHead({
  htmlAttrs: {
    lang: htmlLang,
    dir: dir as ComputedRef<'ltr' | 'rtl'>,
  },
  bodyAttrs: {
    class: 'overflow-x-hidden',
  },
})
</script>

<template>
  <div :dir="dir" :lang="htmlLang" class="min-h-dvh bg-neutral-50">
    <LayoutsNavbar />
    <main class="w-full">
      <slot />
    </main>
    <LayoutsFooter />
    <AppScrollToTopButton />
  </div>
</template>
