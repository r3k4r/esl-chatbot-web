<script setup lang="ts">
import type { ProfileFormValues } from '~/common/schemas/ProfileSchema'
import type { MyProfileData } from '~/common/types/profile-types'
import ProfileRow from './ProfileRow.vue'

// Account: who you are and how you sign in. Only the name and phone can be changed here.
defineProps<{ profile: MyProfileData; editing: boolean; memberSince: string; errors: Record<string, string> }>()
const form = defineModel<ProfileFormValues>('form', { required: true })
</script>

<template>
  <ProfileRow label="Name" field-id="pf-name">
    <FormInput v-if="editing" id="pf-name" v-model="form.displayName" :error="errors.displayName" class-list="max-w-md" />
    <template v-else>{{ profile.displayName || profile.username }}</template>
  </ProfileRow>
  <ProfileRow label="Username" :hint="editing ? 'Your username can\'t be changed.' : undefined">@{{ profile.username }}</ProfileRow>
  <ProfileRow label="Email" :hint="editing ? 'Your email can\'t be changed here.' : undefined">
    <span class="break-all">{{ profile.email }}</span>
  </ProfileRow>
  <ProfileRow label="Phone" field-id="pf-phone">
    <FormInput v-if="editing" id="pf-phone" v-model="form.phoneLocal" v-model:code="form.phoneCode" type="tel" autocomplete="tel-national" placeholder="750 123 4567" :error="errors.phoneLocal" class-list="max-w-md" />
    <template v-else-if="profile.phoneNumber">{{ profile.phoneNumber }}</template>
    <span v-else class="text-text-muted">Not added</span>
  </ProfileRow>
  <ProfileRow label="Member since">{{ memberSince }}</ProfileRow>
</template>
