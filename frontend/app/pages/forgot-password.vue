<script setup lang="ts">
import { forgotPasswordSchema, type ForgotPasswordSchema } from '~/common/schemas/AuthSchema'
import { useAuthStore } from '~~/stores/auth'
import { toast } from 'vue-sonner'

definePageMeta({
    layout: 'auth',
    guestOnly: true,
})
useSeo({ title: 'Forgot password', noindex: true })

const authStore = useAuthStore()
const router = useRouter()
const { t } = useLocale()

const formData = reactive<ForgotPasswordSchema>({
    email: '',
})

const serverError = ref<string>('')
// Too many reset requests: lock the button until the backend's Retry-After lifts.
const cooldown = useCooldown()
const submitLabel = computed(() => cooldown.active.value ? t('auth.common.tryAgainIn', { time: cooldown.label.value }) : t('auth.forgot.submit'))

const handleSubmit = async () => {
    serverError.value = ''
    const response = await authStore.forgotPassword(formData)

    if (response.success) {
        sessionStorage.setItem('resetEmail', formData.email)
        toast.success(t('auth.forgot.sent'))
        router.push('/verify-otp')
    } else {
        if (response.status === 429 && response.retryAfter) cooldown.start(response.retryAfter)
        serverError.value = response.message || t('auth.forgot.failed')
    }
}
</script>

<template>
    <LayoutsAuthFormLayout
        :title="t('auth.forgot.title')"
        :subtitle="t('auth.forgot.subtitle')"
        :footer-text="t('auth.forgot.remembered')"
        :footer-link-text="t('auth.common.signIn')"
        footer-link-to="/signin"
    >
        <!-- novalidate: our own (translated) message instead of the browser's email popup -->
        <Form :schema="forgotPasswordSchema" :form-data="formData" @submit="handleSubmit" class="flex flex-col gap-5" novalidate>
            <template #default="{ errors }">
                <FormInput
                    id="email"
                    type="email"
                    :label="t('auth.fields.email')"
                    :placeholder="t('auth.fields.emailPh')"
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
