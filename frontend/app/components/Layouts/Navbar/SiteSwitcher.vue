<script setup lang="ts">
import { TUTELAGE_MAIN_URL } from '~/common/data/nav-links'

// "Tutelage | Tutelage AI", as on the main site: this site is the orange one, the main
// Tutelage site is a plain link. Brand names stay untranslated.
const { t } = useLocale()
</script>

<template>
  <nav :aria-label="t('nav.sites')" class="flex items-center gap-2.5 font-poppins text-[15px] font-semibold" dir="ltr">
    <AppLink :to="TUTELAGE_MAIN_URL" class="text-neutral-50/60 transition-colors hover:text-neutral-50">Tutelage</AppLink>
    <span class="h-3.5 w-px bg-neutral-50/30" aria-hidden="true" />
    <span class="text-brand-primary" aria-current="page">Tutelage AI</span>
  </nav>
</template>
