<script setup lang="ts">
// The 47s product demo (demo-video/ in the repo, rendered with HyperFrames), opened by the
// landing page's "Watch a demo" buttons. WebM (VP9 + Opus) first, MP4 (H.264 + AAC) for
// Safari/iOS. The <video> only exists while the dialog is open, so it starts from the top
// each time and stops (sound included) the moment the dialog closes.
const open = defineModel<boolean>('open', { default: false })
const { t } = useLocale()
</script>

<template>
  <UiDialog v-model:open="open">
    <UiDialogContent
      :show-close-button="false"
      class="max-w-[calc(100%-1.5rem)] sm:max-w-5xl gap-0 overflow-hidden rounded-xl border-neutral-50/10 bg-brand-ink p-0"
    >
      <UiDialogTitle class="sr-only">{{ t('hero.demoTitle') }}</UiDialogTitle>
      <UiDialogDescription class="sr-only">{{ t('hero.demoDescription') }}</UiDialogDescription>

      <div class="relative aspect-video w-full bg-black">
        <video
          v-if="open"
          class="size-full"
          controls
          autoplay
          playsinline
          preload="auto"
          poster="/videos/tutelage-demo-poster.jpg"
        >
          <source src="/videos/tutelage-demo.webm" type="video/webm">
          <source src="/videos/tutelage-demo.mp4" type="video/mp4">
        </video>

        <UiDialogClose as-child>
          <AppButton
            variant="dark-ghost" size="36" radius="8" aspect="square" icon="CloseCircle"
            :icon-config="{ color: 'white', size: 20 }"
            class-list="absolute end-3 top-3 z-10 bg-black/50 backdrop-blur-sm"
            :aria-label="t('hero.demoClose')"
          />
        </UiDialogClose>
      </div>
    </UiDialogContent>
  </UiDialog>
</template>
