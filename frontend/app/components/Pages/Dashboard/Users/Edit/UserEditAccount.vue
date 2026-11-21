<script setup lang="ts">
import type { AdminUserFormValues } from '~/common/schemas/ProfileSchema'
import type { AdminUserItem } from '~/common/types/admin-types'
import ProfileRow from '~/components/Pages/Dashboard/Profile/ProfileRow.vue'

// Account: the name and phone can be changed; username, email and sign-in are shown as they are.
const props = defineProps<{ user: AdminUserItem; errors: Record<string, string> }>()
const form = defineModel<AdminUserFormValues>('form', { required: true })

const signIn = computed(() => (props.user.authProvider === 'GOOGLE' ? 'Google' : 'Username and password'))
const joined = computed(() => new Date(props.user.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }))
</script>

<template>
  <ProfileRow label="Name" field-id="ue-name">
    <FormInput id="ue-name" v-model="form.displayName" :error="errors.displayName" class-list="max-w-md" />
  </ProfileRow>
  <ProfileRow label="Phone" field-id="ue-phone">
    <FormInput id="ue-phone" v-model="form.phoneLocal" v-model:code="form.phoneCode" type="tel" autocomplete="off" placeholder="750 123 4567" :error="errors.phoneLocal" class-list="max-w-md" />
  </ProfileRow>
  <ProfileRow label="Username" hint="Can't be changed.">@{{ user.username }}</ProfileRow>
  <ProfileRow label="Email">
    <span class="break-all">{{ user.email }}</span>
    <span v-if="user.emailVerified === false" class="ms-2 text-[14px] text-text-muted">(not verified)</span>
  </ProfileRow>
  <ProfileRow label="Signs in with">{{ signIn }}</ProfileRow>
  <ProfileRow label="Joined">{{ joined }}</ProfileRow>
</template>
