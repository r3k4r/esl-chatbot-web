<script setup lang="ts">
import { featurePageBySlug } from '~/common/data/feature-pages'

// Public page for one landing-page feature card: how it works, how to use it (a tour of the
// real screen), why it helps, questions, then the other features.
const route = useRoute()
const { t } = useLocale()

const feature = computed(() => featurePageBySlug(String(route.params.slug)))
if (!feature.value) throw createError({ statusCode: 404, statusMessage: 'Feature not found', fatal: true })

const k = computed(() => `featurePages.items.${feature.value!.key}`)
useSeoMeta({
  title: () => `${t(`${k.value}.seoTitle`)} · Tutelage AI`,
  description: () => t(`${k.value}.standfirst`),
  ogImage: () => feature.value!.hero,
})
</script>

<template>
  <div v-if="feature">
    <PagesFeaturesMasthead :feature="feature" />
    <PagesFeaturesFlow :feature="feature" />
    <PagesFeaturesTour :feature="feature" />
    <PagesFeaturesWhy :feature="feature" />
    <PagesFeaturesFaq :feature="feature" />
    <PagesFeaturesMore :feature="feature" />
  </div>
</template>
