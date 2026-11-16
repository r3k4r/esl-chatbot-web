<script setup lang="ts">
import { forgotPasswordSchema, type ForgotPasswordSchema } from '~/common/schemas/AuthSchema'
import { useAuthStore } from '~~/stores/auth'
import { toast } from 'vue-sonner'

definePageMeta({
    layout: 'auth',
    guestOnly: true,
})

const authStore = useAuthStore()
const router = useRouter()

const formData = reactive<ForgotPasswordSchema>({
    email: '',
})

const serverError = ref<string>('')
// Too many reset requests: lock the button until the backend's Retry-After lifts.
const cooldown = useCooldown()
const submitLabel = computed(() => cooldown.active.value ? `Try again in ${cooldown.label.value}` : 'Send reset code')

const handleSubmit = async () => {
    serverError.value = ''
    const response = await authStore.forgotPassword(formData)

    if (response.success) {
        sessionStorage.setItem('resetEmail', formData.email)
        toast.success('If that email is registered, a reset code has been sent.')
        router.push('/verify-otp')
    } else {
        if (response.status === 429 && response.retryAfter) cooldown.start(response.retryAfter)
        serverError.value = response.message || 'Something went wrong. Please try again.'
    }
}
</script>

<template>
    <LayoutsAuthFormLayout
        title="Forgot password?"
        subtitle="Enter your email and we'll send you a 6-digit code to reset your password."
        footer-text="Remembered it?"
        footer-link-text="Sign in"
        footer-link-to="/signin"
    >
        <Form :schema="forgotPasswordSchema" :form-data="formData" @submit="handleSubmit" class="flex flex-col gap-5">
            <template #default="{ errors }">
                <FormInput
                    id="email"
                    type="email"
                    label="Email"
                    placeholder="you@example.com"
                    v-model="formData.email"
                    :error="errors.email"
                    required
                />

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
    </LayoutsAuthFormLayout>
</template>
