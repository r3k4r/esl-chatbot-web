<script setup lang="ts">
import { signInSchema, type SignInSchema } from '~/common/schemas/AuthSchema'
import { useAuthStore } from '~~/stores/auth'
import { toast } from 'vue-sonner'

definePageMeta({
    layout: 'auth',
    guestOnly: true,
})

const authStore = useAuthStore()
const router = useRouter()

const formData = reactive<SignInSchema>({
    username: '',
    password: '',
})

const serverError = ref<string>('')
// Too many sign-in attempts: lock the button until the backend's Retry-After lifts.
const cooldown = useCooldown()
const submitLabel = computed(() => cooldown.active.value ? `Try again in ${cooldown.label.value}` : 'Sign in')
const reacceptOpen = ref(false)
let reacceptCancelled = false

const handleSubmit = async () => {
    serverError.value = ''
    const response = await authStore.signIn(formData)

    if (response.success) {
        router.push('/dashboard')
        return
    }

    // 403 with needsAgreement: Terms changed since last login — show re-accept modal.
    if (response.status === 403 && response.data?.needsAgreement) {
        reacceptCancelled = false
        reacceptOpen.value = true
        return
    }

    // 403 without needsAgreement: unverified email — send to verify step.
    if (response.status === 403 && /verify your email/i.test(response.message ?? '')) {
        toast.info('Please verify your email to continue.')
        if (formData.username.includes('@')) {
            sessionStorage.setItem('pendingEmail', formData.username)
        }
        router.push('/verify-email')
        return
    }

    if (response.status === 429 && response.retryAfter) cooldown.start(response.retryAfter)
    serverError.value = response.message || 'Invalid username or password'
}

const handleReaccept = async () => {
    reacceptCancelled = false
    const response = await authStore.acceptAgreement({
        username: formData.username,
        password: formData.password,
    })

    if (reacceptCancelled) return

    if (response.success) {
        reacceptOpen.value = false
        router.push('/dashboard')
        return
    }

    toast.error(response.message || 'Could not accept the Terms. Please try again.')
}

const handleReacceptClose = () => {
    reacceptCancelled = true
    reacceptOpen.value = false
    serverError.value = 'You must accept the updated Terms of Service to continue.'
}
</script>

<template>
    <LayoutsAuthFormLayout
        title="Welcome back"
        subtitle="Sign in to continue your English learning journey."
        footer-text="Don't have an account?"
        footer-link-text="Create one"
        footer-link-to="/signup"
    >
        <Form :schema="signInSchema" :form-data="formData" @submit="handleSubmit" class="flex flex-col gap-5">
            <template #default="{ errors }">
                <FormInput
                    id="username"
                    label="Username"
                    placeholder="Enter your username"
                    v-model="formData.username"
                    :error="errors.username"
                    required
                />

                <FormInput
                    id="password"
                    type="password"
                    label="Password"
                    placeholder="Enter your password"
                    v-model="formData.password"
                    :error="errors.password"
                    required
                />

                <div class="flex justify-end -mt-1">
                    <NuxtLink to="/forgot-password" class="text-sm font-medium text-brand-ink hover:text-brand-primary transition-colors">
                        Forgot password?
                    </NuxtLink>
                </div>

                <FormServerError :error="serverError" />

                <AppButton
                    type="submit"
                    variant="primary"
                    size="52"
                    radius="full"
                    :loading="authStore.isLoading"
                    :disabled="cooldown.active.value"
                    class-list="w-full mt-2"
                    :aria-label="submitLabel"
                >
                    {{ submitLabel }}
                </AppButton>
            </template>
        </Form>

        <template #alt>
            <FormGoogleButton label="Continue with Google" />
        </template>
    </LayoutsAuthFormLayout>

    <!-- Re-accept modal: shown when backend returns 403 { needsAgreement: true } -->
    <FormAgreementDialog
        :open="reacceptOpen"
        mode="accept"
        :loading="authStore.isLoading"
        @update:open="(v) => { if (!v) handleReacceptClose() }"
        @accept="handleReaccept"
    />
</template>
