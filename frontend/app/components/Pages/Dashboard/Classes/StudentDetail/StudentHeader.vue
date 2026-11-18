<script setup lang="ts">
import type { ClassStudentDetail } from '~/common/types/class-types'

const props = defineProps<{ student: ClassStudentDetail; className: string; backTo: string }>()
const emit = defineEmits<{ assignWord: []; assignGoal: [] }>()

const name = computed(() => props.student.displayName || props.student.username)
const initials = computed(() => name.value.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase())
const joined = computed(() => new Date(props.student.joinedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }))
const levels = computed(() => [
  { label: 'AI estimate', value: props.student.metrics?.estimatedLevel, hint: 'From the AI tutor\'s scoring of their messages' },
  { label: 'Says they are', value: props.student.learnerProfile?.currentLevel, hint: 'Level the student picked' },
  { label: 'Aiming for', value: props.student.learnerProfile?.targetLevel, hint: 'Target level the student picked' },
].filter(l => l.value))
</script>

<template>
  <header class="space-y-4">
    <AppLink :to="backTo" class="inline-flex items-center gap-1.5 rounded-md text-[14px] font-medium text-text-muted transition-colors hover:text-text-heading">
      <AppIconsax name="ArrowLeft" color="currentColor" :size="16" />
      {{ className || 'Back to class' }}
    </AppLink>

    <div class="flex flex-wrap items-center gap-x-6 gap-y-4">
      <div class="flex min-w-0 flex-1 items-center gap-4">
        <UiAvatar class="size-14 shrink-0">
          <UiAvatarImage v-if="student.avatarUrl" :src="student.avatarUrl" :alt="name" />
          <UiAvatarFallback class="bg-surface-well text-[17px] font-semibold text-text-muted">{{ initials }}</UiAvatarFallback>
        </UiAvatar>
        <div class="min-w-0">
          <AppText role="heading" aria-level="1" size="24" weight="semibold" class-list="truncate leading-tight">{{ name }}</AppText>
          <AppText size="14" color="neutral-400" class-list="mt-0.5">@{{ student.username }} · joined {{ joined }}</AppText>
        </div>
      </div>

      <dl v-if="levels.length" class="flex gap-6">
        <div v-for="l in levels" :key="l.label" :title="l.hint">
          <dt><AppText size="13" color="neutral-400">{{ l.label }}</AppText></dt>
          <dd><AppText size="20" weight="semibold">{{ l.value }}</AppText></dd>
        </div>
      </dl>

      <div class="flex gap-2">
        <AppButton variant="secondary" size="36" radius="8" icon="Book1" text="Assign word"
          :icon-config="{ color: 'currentColor', size: 16 }" class-list="text-[14px]" @click="emit('assignWord')" />
        <AppButton variant="secondary" size="36" radius="8" icon="Flag" text="Assign goal"
          :icon-config="{ color: 'currentColor', size: 16 }" class-list="text-[14px]" @click="emit('assignGoal')" />
      </div>
    </div>
  </header>
</template>
