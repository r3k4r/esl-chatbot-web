<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
      <ClientOnly>
        <Toaster />
      </ClientOnly>
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
import 'vue-sonner/style.css'
import { Toaster } from '@/components/ui/sonner'

useHead({
  title: 'LEO Institute | AI English Tutor & Student Portal (پەیمانگای لیۆ)',
  htmlAttrs: {
    lang: 'en',
  },
  link: [
    { rel: 'icon', type: 'image/jpeg', href: '/leo-logo.jpg' },
  ],
})

useSeo()
</script>
