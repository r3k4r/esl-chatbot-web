<script setup lang="ts">
import { Icon } from '@iconify/vue'

// The "How it works" heading, on the dark timeline field (shared by both timeline layouts).
const { t } = useLocale()
</script>

<template>
  <LayoutsSectionHeader :eyebrow="t('howItWorks.eyebrow')" :title="t('howItWorks.title')" align="start" wrapper-class="mb-0" title-class="text-neutral-50 dark:text-neutral-50" />
</template>
