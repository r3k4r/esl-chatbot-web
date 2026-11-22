<script setup lang="ts">
defineProps<{ message?: string }>()
defineEmits<{ join: [] }>()
</script>

<template>
  <UiEmpty class="border-dashed border border-black/8 dark:border-white/8 rounded-2xl py-16">
    <UiEmptyMedia>
      <div class="w-14 h-14 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center">
        <AppIconsax name="BookSaved" color="var(--color-brand-primary)" :size="24" />
      </div>
    </UiEmptyMedia>
    <UiEmptyContent>
      <UiEmptyTitle>{{ message ?? 'No classes yet' }}</UiEmptyTitle>
      <UiEmptyDescription>
        {{ message
          ? 'Try a different search term.'
          : 'Ask your teacher for a class code, then join to access lessons, sessions, and more.' }}
      </UiEmptyDescription>
      <AppButton
        v-if="!message"
        variant="primary"
        size="40"
        radius="8"
        icon="Login"
        :icon-config="{ color: 'white' }"
        text="Join a class"
        class="mt-2"
        @click="$emit('join')"
      />
    </UiEmptyContent>
  </UiEmpty>
</template>
