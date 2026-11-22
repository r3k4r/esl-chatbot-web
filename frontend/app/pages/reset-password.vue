<script setup lang="ts">
import { resetPasswordSchema, type ResetPasswordSchema } from '~/common/schemas/AuthSchema'
import { useAuthStore } from '~~/stores/auth'

definePageMeta({
    layout: 'auth',
    guestOnly: true,
})

const authStore = useAuthStore()
const router = useRouter()
const { t } = useLocale()

const formData = reactive<ResetPasswordSchema>({
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: '',
})

const serverError = ref<string>('')
const isDone = ref(false)
let redirectTimer: ReturnType<typeof setTimeout> | null = null

onMounted(() => {
    const savedEmail = sessionStorage.getItem('resetEmail')
    const savedOtp = sessionStorage.getItem('resetOtp')

    if (!savedEmail || !savedOtp) {
        router.replace('/forgot-password')
        return
    }

    formData.email = savedEmail
    formData.otp = savedOtp
})

onUnmounted(() => {
    if (redirectTimer) clearTimeout(redirectTimer)
})

const handleSubmit = async () => {
    serverError.value = ''
    const response = await authStore.resetPassword(formData)

    if (response.success) {
        sessionStorage.removeItem('resetEmail')
        sessionStorage.removeItem('resetOtp')
        isDone.value = true
        redirectTimer = setTimeout(() => {
            router.push('/signin')
        }, 3000)
    } else {
        serverError.value = response.message || t('auth.verifyEmail.invalidCode')
    }
}
</script>

<template>
    <FormAllDone v-if="isDone" :button-text="t('auth.common.backToSignIn')" to="/signin" />

    <LayoutsAuthFormLayout
        v-else
        :title="t('auth.reset.title')"
        :subtitle="t('auth.reset.subtitle')"
        :footer-text="t('auth.common.changedMind')"
        :footer-link-text="t('auth.common.backToSignIn')"
        footer-link-to="/signin"
    >
        <Form :schema="resetPasswordSchema" :form-data="formData" @submit="handleSubmit" class="flex flex-col gap-5" novalidate>
            <template #default="{ errors }">
                <FormInput
                    id="newPassword"
                    type="password"
                    :label="t('auth.fields.newPassword')"
                    :placeholder="t('auth.fields.passwordNewPh')"
                    v-model="formData.newPassword"
                    :error="errors.newPassword"
                    required
                />

                <FormInput
                    id="confirmPassword"
                    type="password"
                    :label="t('auth.fields.confirmPassword')"
                    :placeholder="t('auth.fields.confirmNewPasswordPh')"
                    v-model="formData.confirmPassword"
                    :error="errors.confirmPassword"
                    required
                />

                <FormServerError :error="serverError" />

                <AppButton
                    type="submit"
                    variant="primary"
                    size="52"
                    radius="full"
                    :loading="authStore.isLoading"
                    class-list="w-full mt-2"
                    :aria-label="t('auth.reset.submit')"
                >
                    {{ t('auth.reset.submit') }}
                </AppButton>
            </template>
        </Form>
    </LayoutsAuthFormLayout>
</template>
