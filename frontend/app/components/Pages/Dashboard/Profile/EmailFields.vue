<script setup lang="ts">
import type { ProfileFormValues } from '~/common/schemas/ProfileSchema'
import type { MyLearnerProfile } from '~/common/types/profile-types'

// The weekly progress email: on or off (saved with the rest of the profile).
defineProps<{ learner: MyLearnerProfile | null; editing: boolean }>()
const form = defineModel<ProfileFormValues>('form', { required: true })
</script>

<template>
  <div class="flex h-full items-center justify-between gap-4 py-3">
    <label for="pf-digest" class="font-poppins text-[15px] text-text-heading">
      {{ editing ? (form.emailDigestEnabled ? 'On' : 'Off') : ((learner?.emailDigestEnabled ?? true) ? 'On' : 'Off') }}
    </label>
    <UiSwitch v-if="editing" id="pf-digest" v-model="form.emailDigestEnabled" />
  </div>
</template>
