<script setup lang="ts">
import { googleUsernameSchema, type GoogleUsernameSchema } from '~/common/schemas/AuthSchema'
import { useAuthStore } from '~~/stores/auth'
import { toast } from 'vue-sonner'

definePageMeta({
    layout: 'auth',
    guestOnly: true,
})

type GoogleProfile = {
    email?: string
    displayName?: string
    avatarUrl?: string | null
}

const authStore = useAuthStore()
const router = useRouter()

const formData = reactive<GoogleUsernameSchema>({
    username: '',
    acceptAgreement: undefined as unknown as true,
})

const serverError = ref<string>('')
const idToken = ref<string>('')
const profile = ref<GoogleProfile>({})
const showTerms = ref(false)

onMounted(() => {
    const savedToken = sessionStorage.getItem('googleIdToken')
    if (!savedToken) {
        router.replace('/signin')
        return
    }
    idToken.value = savedToken

    const savedProfile = sessionStorage.getItem('googleProfile')
    if (savedProfile) {
        try { profile.value = JSON.parse(savedProfile) } catch { /* ignore */ }
    }
})

const handleSubmit = async () => {
    serverError.value = ''
    const response = await authStore.googleAuth(idToken.value, formData.username, formData.acceptAgreement === true)

    if (response.success) {
        sessionStorage.removeItem('googleIdToken')
        sessionStorage.removeItem('googleProfile')
        toast.success('Welcome!')
        router.push('/dashboard')
    } else {
        serverError.value = response.message || 'Could not complete sign-up. Please try again.'
    }
}
</script>

<template>
    <LayoutsAuthFormLayout
        title="Pick a username"
        :subtitle="profile.email
            ? `You're signing in as ${profile.email}. Choose a username to finish creating your account.`
            : 'Choose a username to finish creating your account.'"
        footer-text="Changed your mind?"
        footer-link-text="Back to sign in"
        footer-link-to="/signin"
    >
        <Form :schema="googleUsernameSchema" :form-data="formData" @submit="handleSubmit" class="flex flex-col gap-5">
            <template #default="{ errors }">
                <FormInput
                    id="username"
                    label="Username"
                    placeholder="e.g. student_ali"
                    v-model="formData.username"
                    :error="errors.username"
                    required
                />

                <div class="flex flex-col gap-1">
                    <div class="flex items-start gap-2.5">
                        <UiCheckbox
                            id="acceptAgreement"
                            :model-value="formData.acceptAgreement === true"
                            class="mt-0.5 shrink-0"
                            @update:model-value="(v: boolean | 'indeterminate') => (formData.acceptAgreement = v === true ? true : (undefined as unknown as true))"
                        />
                        <label for="acceptAgreement" class="text-sm text-brand-ink leading-snug cursor-pointer select-none">
                            I accept the
                            <button
                                type="button"
                                class="font-medium text-brand-primary hover:underline"
                                @click.prevent="showTerms = true"
                            >
                                Terms of Service
                            </button>
                        </label>
                    </div>
                    <p v-if="errors.acceptAgreement" class="text-xs text-red-500 pl-7">
                        {{ errors.acceptAgreement }}
                    </p>
                </div>

                <FormServerError :error="serverError" />

                <AppButton
                    type="submit"
                    variant="primary"
                    size="52"
                    radius="full"
                    :loading="authStore.isLoading"
                    class-list="w-full mt-2"
                    aria-label="Finish sign up"
                >
                    Finish sign up
                </AppButton>
            </template>
        </Form>
    </LayoutsAuthFormLayout>

    <FormAgreementDialog
        :open="showTerms"
        mode="accept"
        @update:open="showTerms = $event"
        @accept="formData.acceptAgreement = true; showTerms = false"
    />
</template>
