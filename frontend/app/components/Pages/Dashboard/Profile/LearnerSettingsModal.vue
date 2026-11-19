<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'
import type { MyLearnerProfile, TutorAccent, TutorVoiceGender, UpdateLearnerProfileInput } from '~/common/types/profile-types'
import { TUTOR_ACCENTS, TUTOR_VOICES } from '~/common/data/tutor-voice'

const props = defineProps<{
  open: boolean
  learnerProfile: MyLearnerProfile | null
  saving?: boolean
}>()

const emit = defineEmits<{
  'update:open': [val: boolean]
  save: [input: UpdateLearnerProfileInput]
}>()

const CEFR = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const
const PERSONALITIES = ['FRIENDLY', 'FORMAL', 'CASUAL', 'ENCOURAGING', 'STRICT', 'PATIENT'] as const
const PERSONALITY_LABEL: Record<string, string> = {
  FRIENDLY: 'Friendly', FORMAL: 'Formal', CASUAL: 'Casual',
  ENCOURAGING: 'Encouraging', STRICT: 'Strict', PATIENT: 'Patient',
}

// All IANA timezones from the browser — no API needed
const ALL_TIMEZONES: string[] = (() => {
  try { return Intl.supportedValuesOf('timeZone') } catch { return [] }
})()

const targetLevel = ref('NONE')
const learningPurpose = ref('')
const aiPersonality = ref('NONE')
const weeklyGoalMinutes = ref(210)
const voiceSpeed = ref(1.0)
const autoSpeak = ref(false)
const timezone = ref('Asia/Baghdad')
const theme = ref<'light' | 'dark'>('light')
const emailDigestEnabled = ref(true)
const topicInput = ref('')
const topics = ref<string[]>([])
const tutorAccent = ref<TutorAccent>('US')
const tutorVoice = ref<TutorVoiceGender>('FEMALE')

const tzSearch = ref('')
const tzOpen = ref(false)
const tzSearchInput = ref<HTMLInputElement | null>(null)
const tzContainer = ref<HTMLElement | null>(null)

onClickOutside(tzContainer, () => { tzOpen.value = false })
watch(tzOpen, (v) => {
  if (v) nextTick(() => tzSearchInput.value?.focus())
  else tzSearch.value = ''
})

const filteredTimezones = computed(() => {
  const q = tzSearch.value.toLowerCase()
  if (!q) return ALL_TIMEZONES.slice(0, 80)
  return ALL_TIMEZONES.filter(tz => tz.toLowerCase().includes(q)).slice(0, 80)
})

watch(() => props.open, (v) => {
  if (!v) { tzOpen.value = false; return }
  const lp = props.learnerProfile
  targetLevel.value = lp?.targetLevel ?? 'NONE'
  learningPurpose.value = lp?.learningPurpose ?? ''
  aiPersonality.value = lp?.aiPersonality ?? 'NONE'
  weeklyGoalMinutes.value = lp?.weeklyGoalMinutes ?? 210
  voiceSpeed.value = lp?.voiceSpeed ?? 1.0
  autoSpeak.value = lp?.autoSpeak ?? false
  timezone.value = lp?.timezone ?? 'Asia/Baghdad'
  theme.value = (lp?.theme as 'light' | 'dark') ?? 'light'
  emailDigestEnabled.value = lp?.emailDigestEnabled ?? true
  topics.value = Array.isArray(lp?.topicsOfInterest) ? [...lp!.topicsOfInterest] : []
  tutorAccent.value = lp?.tutorAccent ?? 'US'
  tutorVoice.value = lp?.tutorVoice ?? 'FEMALE'
  tzSearch.value = ''
}, { immediate: true })

function selectTimezone(tz: string) {
  timezone.value = tz
  tzOpen.value = false
  tzSearch.value = ''
}

function addTopic() {
  const t = topicInput.value.trim()
  if (t && !topics.value.includes(t)) topics.value.push(t)
  topicInput.value = ''
}
function removeTopic(t: string) { topics.value = topics.value.filter(x => x !== t) }
function onTopicKeydown(e: KeyboardEvent) { if (e.key === 'Enter') { e.preventDefault(); addTopic() } }

function submit() {
  emit('save', {
    targetLevel: targetLevel.value === 'NONE' ? null : targetLevel.value,
    learningPurpose: learningPurpose.value.trim() || null,
    aiPersonality: aiPersonality.value === 'NONE' ? null : aiPersonality.value,
    weeklyGoalMinutes: weeklyGoalMinutes.value,
    voiceSpeed: voiceSpeed.value,
    autoSpeak: autoSpeak.value,
    timezone: timezone.value,
    theme: theme.value,
    emailDigestEnabled: emailDigestEnabled.value,
    topicsOfInterest: topics.value,
    tutorAccent: tutorAccent.value,
    tutorVoice: tutorVoice.value,
  })
}

const dailyGoal = computed(() => Math.round(weeklyGoalMinutes.value / 7))
const voiceSpeedLabel = computed(() => `${voiceSpeed.value.toFixed(1)}×`)
</script>

<template>
  <UiDialog :open="open" @update:open="emit('update:open', $event)">
    <UiDialogContent class="p-0 gap-0 overflow-hidden max-w-lg max-h-[90vh] flex flex-col" :style="`background:var(--surface-card)`">

      <UiDialogHeader class="p-6 pb-4 shrink-0">
        <div class="flex items-center gap-3">
          <div class="size-10 rounded-xl flex items-center justify-center shrink-0" style="background:var(--surface-raised)">
            <AppIconsax name="Setting2" color="var(--color-brand-primary)" :size="18" />
          </div>
          <div>
            <UiDialogTitle class="text-[18px] font-semibold font-poppins" :style="`color:var(--text-heading)`">
              Learning settings
            </UiDialogTitle>
            <UiDialogDescription class="text-[14px] font-poppins mt-0.5" :style="`color:var(--text-muted)`">
              AI preferences, voice, goal and more.
            </UiDialogDescription>
          </div>
        </div>
      </UiDialogHeader>

      <div class="flex-1 overflow-y-auto px-6 pb-2 space-y-5">

        <!-- Target level + AI personality -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <p class="text-[14px] font-medium font-poppins mb-1.5" :style="`color:var(--text-heading)`">Target level</p>
            <UiSelect v-model="targetLevel">
              <UiSelectTrigger class="text-[14px]"><UiSelectValue placeholder="Not set" /></UiSelectTrigger>
              <UiSelectContent>
                <UiSelectItem value="NONE">Not set</UiSelectItem>
                <UiSelectItem v-for="l in CEFR" :key="l" :value="l">{{ l }}</UiSelectItem>
              </UiSelectContent>
            </UiSelect>
          </div>
          <div>
            <p class="text-[14px] font-medium font-poppins mb-1.5" :style="`color:var(--text-heading)`">AI personality</p>
            <UiSelect v-model="aiPersonality">
              <UiSelectTrigger class="text-[14px]"><UiSelectValue placeholder="Default" /></UiSelectTrigger>
              <UiSelectContent>
                <UiSelectItem value="NONE">Default</UiSelectItem>
                <UiSelectItem v-for="p in PERSONALITIES" :key="p" :value="p">{{ PERSONALITY_LABEL[p] }}</UiSelectItem>
              </UiSelectContent>
            </UiSelect>
          </div>
        </div>

        <!-- Tutor voice: accent + gender (spoken replies, Voice Lab, and the English it writes) -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <p class="text-[14px] font-medium font-poppins mb-1.5" :style="`color:var(--text-heading)`">Tutor accent</p>
            <UiSelect v-model="tutorAccent">
              <UiSelectTrigger class="text-[14px]"><UiSelectValue /></UiSelectTrigger>
              <UiSelectContent>
                <UiSelectItem v-for="a in TUTOR_ACCENTS" :key="a.value" :value="a.value">{{ a.label }}</UiSelectItem>
              </UiSelectContent>
            </UiSelect>
          </div>
          <div>
            <p class="text-[14px] font-medium font-poppins mb-1.5" :style="`color:var(--text-heading)`">Tutor voice</p>
            <UiSelect v-model="tutorVoice">
              <UiSelectTrigger class="text-[14px]"><UiSelectValue /></UiSelectTrigger>
              <UiSelectContent>
                <UiSelectItem v-for="g in TUTOR_VOICES" :key="g.value" :value="g.value">{{ g.label }}</UiSelectItem>
              </UiSelectContent>
            </UiSelect>
          </div>
        </div>

        <!-- Weekly goal -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <p class="text-[14px] font-medium font-poppins" :style="`color:var(--text-heading)`">Weekly goal</p>
            <span class="text-[14px] font-semibold font-poppins" style="color:var(--color-brand-primary)">
              {{ weeklyGoalMinutes }} min/week · {{ dailyGoal }} min/day
            </span>
          </div>
          <input v-model.number="weeklyGoalMinutes" type="range" min="35" max="840" step="35" class="w-full accent-brand-primary" />
          <div class="flex justify-between text-[14px] font-poppins mt-1" :style="`color:var(--text-subtle)`">
            <span>5 min/day</span><span>2h/day</span>
          </div>
        </div>

        <!-- Voice speed + autoSpeak -->
        <div class="grid grid-cols-2 gap-3 items-end">
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <p class="text-[14px] font-medium font-poppins" :style="`color:var(--text-heading)`">Voice speed</p>
              <span class="text-[14px] font-semibold font-poppins" style="color:var(--color-brand-primary)">{{ voiceSpeedLabel }}</span>
            </div>
            <input v-model.number="voiceSpeed" type="range" min="0.5" max="2" step="0.1" class="w-full accent-brand-primary" />
            <div class="flex justify-between text-[14px] font-poppins mt-1" :style="`color:var(--text-subtle)`">
              <span>0.5×</span><span>2×</span>
            </div>
          </div>
          <div class="pb-1">
            <div class="flex items-center justify-between p-3.5 rounded-xl" style="background:var(--surface-raised)">
              <div>
                <p class="text-[14px] font-medium font-poppins" :style="`color:var(--text-heading)`">Auto-speak</p>
                <p class="text-[14px] font-poppins" :style="`color:var(--text-muted)`">Play AI replies</p>
              </div>
              <UiSwitch :model-value="autoSpeak" @update:model-value="autoSpeak = $event" />
            </div>
          </div>
        </div>

        <!-- Timezone searchable combobox -->
        <div ref="tzContainer" class="relative">
          <p class="text-[14px] font-medium font-poppins mb-1.5" :style="`color:var(--text-heading)`">Timezone</p>
          <button
            type="button"
            class="w-full flex items-center justify-between gap-2 px-3 h-10 rounded-lg border text-[14px] font-poppins cursor-pointer transition-colors"
            :style="`background:var(--surface-raised);border-color:var(--border-inner);color:var(--text-heading)`"
            @click="tzOpen = !tzOpen"
          >
            <div class="flex items-center gap-2 min-w-0">
              <AppIconsax name="Clock" color="var(--color-text-muted)" :size="16" />
              <span class="truncate">{{ timezone }}</span>
            </div>
            <AppIconsax name="ArrowDown2" color="var(--color-text-subtle)" :size="14" />
          </button>
          <div
            v-show="tzOpen"
            class="absolute z-50 left-0 right-0 mt-1 rounded-lg border shadow-lg overflow-hidden"
            :style="`background:var(--surface-card);border-color:var(--border-card)`"
          >
            <div class="p-2 border-b" :style="`border-color:var(--border-inner)`">
              <input
                ref="tzSearchInput"
                v-model="tzSearch"
                type="text"
                placeholder="Search timezones…"
                class="w-full px-3 h-8 rounded-lg text-[14px] font-poppins outline-none"
                :style="`background:var(--surface-raised);color:var(--text-heading)`"
              />
            </div>
            <div class="max-h-52 overflow-y-auto py-1">
              <button
                v-for="tz in filteredTimezones"
                :key="tz"
                type="button"
                class="w-full text-left px-3 py-2 text-[14px] font-poppins cursor-pointer"
                :class="tz === timezone ? 'font-semibold' : ''"
                :style="tz === timezone ? 'background:var(--surface-raised);color:var(--color-brand-primary)' : 'color:var(--text-body)'"
                @click="selectTimezone(tz)"
              >{{ tz }}</button>
              <p v-if="filteredTimezones.length === 0" class="px-3 py-4 text-[14px] text-center font-poppins" :style="`color:var(--text-muted)`">
                No timezones found
              </p>
            </div>
          </div>
        </div>

        <!-- Theme -->
        <div>
          <p class="text-[14px] font-medium font-poppins mb-2" :style="`color:var(--text-heading)`">Theme</p>
          <div class="grid grid-cols-2 gap-3">
            <button
              type="button"
              class="relative flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all"
              :style="theme === 'light'
                ? 'border-color:var(--color-brand-primary);background:var(--surface-raised)'
                : 'border-color:var(--border-inner);background:var(--surface-raised)'"
              @click="theme = 'light'"
            >
              <div class="size-8 rounded-lg flex items-center justify-center shrink-0" style="background:#F8F9FA;border:1px solid #E9ECEF">
                <AppIconsax name="Sun1" :color="theme === 'light' ? 'var(--color-brand-primary)' : 'var(--color-text-muted)'" :size="16" />
              </div>
              <div class="text-left">
                <p class="text-[14px] font-semibold font-poppins" :style="`color:var(--text-heading)`">Light</p>
                <p class="text-[13px] font-poppins" :style="`color:var(--text-muted)`">Bright UI</p>
              </div>
              <div
                v-if="theme === 'light'"
                class="absolute top-2.5 right-2.5 size-4 rounded-full flex items-center justify-center"
                style="background:var(--color-brand-primary)"
              >
                <AppIconsax name="TickCircle" color="white" :size="12" />
              </div>
            </button>
            <button
              type="button"
              class="relative flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all"
              :style="theme === 'dark'
                ? 'border-color:var(--color-brand-primary);background:var(--surface-raised)'
                : 'border-color:var(--border-inner);background:var(--surface-raised)'"
              @click="theme = 'dark'"
            >
              <div class="size-8 rounded-lg flex items-center justify-center shrink-0" style="background:#1E2329;border:1px solid #2D333B">
                <AppIconsax name="Moon" :color="theme === 'dark' ? 'var(--color-brand-primary)' : 'var(--color-text-muted)'" :size="16" />
              </div>
              <div class="text-left">
                <p class="text-[14px] font-semibold font-poppins" :style="`color:var(--text-heading)`">Dark</p>
                <p class="text-[13px] font-poppins" :style="`color:var(--text-muted)`">Easy on eyes</p>
              </div>
              <div
                v-if="theme === 'dark'"
                class="absolute top-2.5 right-2.5 size-4 rounded-full flex items-center justify-center"
                style="background:var(--color-brand-primary)"
              >
                <AppIconsax name="TickCircle" color="white" :size="12" />
              </div>
            </button>
          </div>
        </div>

        <!-- Email digest toggle -->
        <div class="flex items-center justify-between p-3.5 rounded-xl" style="background:var(--surface-raised)">
          <div>
            <p class="text-[14px] font-medium font-poppins" :style="`color:var(--text-heading)`">Weekly digest</p>
            <p class="text-[14px] font-poppins" :style="`color:var(--text-muted)`">
              {{ emailDigestEnabled ? 'Receive progress recap' : 'Disabled' }}
            </p>
          </div>
          <UiSwitch :model-value="emailDigestEnabled" @update:model-value="emailDigestEnabled = $event" />
        </div>

        <!-- Learning purpose -->
        <div>
          <p class="text-[14px] font-medium font-poppins mb-1.5" :style="`color:var(--text-heading)`">Learning purpose</p>
          <UiTextarea v-model="learningPurpose" placeholder="e.g. Prepare for IELTS, work in an English-speaking team…" class="text-[14px] resize-none" :rows="2" />
        </div>

        <!-- Topics of interest -->
        <div>
          <p class="text-[14px] font-medium font-poppins mb-1.5" :style="`color:var(--text-heading)`">Topics of interest</p>
          <div class="flex gap-2">
            <FormInput id="lp-topic" v-model="topicInput" placeholder="e.g. Technology, Travel…" class-list="flex-1" @keydown="onTopicKeydown" />
            <AppButton variant="secondary" size="40" radius="8" icon="Add" text="Add" @click="addTopic" />
          </div>
          <div v-if="topics.length" class="flex flex-wrap gap-2 mt-3">
            <span
              v-for="t in topics" :key="t"
              class="flex items-center gap-1.5 text-[14px] font-medium font-poppins px-3 py-1 rounded-lg"
              style="background:var(--surface-raised);color:var(--text-heading)"
            >
              {{ t }}
              <button type="button" class="cursor-pointer opacity-60 hover:opacity-100" @click="removeTopic(t)" aria-label="Remove">
                <AppIconsax name="CloseCircle" color="currentColor" :size="14" />
              </button>
            </span>
          </div>
        </div>

      </div>

      <UiDialogFooter class="p-6 pt-4 flex gap-2 shrink-0" style="border-top:1px solid var(--border-inner)">
        <UiDialogClose as-child>
          <AppButton variant="secondary" size="40" radius="8" text="Cancel" class="flex-1" />
        </UiDialogClose>
        <AppButton variant="primary" size="40" radius="8" icon="TickCircle" :icon-config="{ color: 'white', size: 16 }" text="Save settings" class="flex-1" :loading="saving" @click="submit" />
      </UiDialogFooter>

    </UiDialogContent>
  </UiDialog>
</template>
