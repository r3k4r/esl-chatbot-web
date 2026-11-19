<template>
  <section id="dashboard" class="bg-neutral-50 py-28 sm:py-36 overflow-hidden">
    <div class="container-lg layout-padding-lg">
      <LayoutsSectionHeader
        :eyebrow="t('dashboardPreview.eyebrow')"
        :title="t('dashboardPreview.title')"
        :description="t('dashboardPreview.description')"
        align="center"
        content-class="max-w-4xl"
        description-class="max-w-xl"
        wrapper-class="mb-14"
      />
      <!-- Today's dashboard, coded with demo data, at a fixed angle in a browser window.
           No fade over its foot: a flat band can't follow the angled window and shows as a box. -->
      <PagesHomeDashboardMockup />
    </div>
  </section>
</template>

<script setup lang="ts">
const { t } = useLocale()
</script>
