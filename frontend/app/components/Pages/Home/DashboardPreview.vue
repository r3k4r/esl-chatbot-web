<template>
  <section id="dashboard" class="bg-neutral-50 py-28 sm:py-36 overflow-hidden">
    <div class="container-lg layout-padding-lg">
      <LayoutsSectionHeader
        :eyebrow="t('dashboardPreview.eyebrow')"
        :title="t('dashboardPreview.title')"
        :description="t('dashboardPreview.description')"
        align="center"
        wrapper-class="mb-14"
      />
      <div class="relative">
        <PagesHomeDashboardMockup />
        <div class="absolute inset-x-0 -bottom-10 h-32 bg-linear-to-t from-neutral-50 via-neutral-50/80 to-transparent pointer-events-none" />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const { t } = useLocale()
</script>
