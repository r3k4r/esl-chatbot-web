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
const { t } = useLocale()

const formData = reactive<GoogleUsernameSchema>({
    username: '',
    acceptAgreement: undefined as unknown as true,
})

const serverError = ref<string>('')
const idToken = ref<string>('')
const profile = ref<GoogleProfile>({})
const showTerms = ref(false)

// Live username check (ISS-009), same as sign-up.
const { status: usernameStatus } = useUsernameAvailability(toRef(formData, 'username'))
const usernameTaken = computed(() => usernameStatus.value === 'taken' ? 'auth.signup.usernameTaken' : undefined)

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
    if (usernameStatus.value === 'taken') return
    const response = await authStore.googleAuth(idToken.value, formData.username, formData.acceptAgreement === true)

    if (response.success) {
        sessionStorage.removeItem('googleIdToken')
        sessionStorage.removeItem('googleProfile')
        toast.success(t('auth.googleUsername.welcome'))
        router.push('/dashboard')
    } else {
        serverError.value = response.message || t('auth.googleUsername.failed')
    }
}
</script>

<template>
    <LayoutsAuthFormLayout
        :title="t('auth.googleUsername.title')"
        :subtitle="profile.email ? t('auth.googleUsername.subtitle', { email: profile.email }) : t('auth.googleUsername.subtitleNoEmail')"
        :footer-text="t('auth.common.changedMind')"
        :footer-link-text="t('auth.common.backToSignIn')"
        footer-link-to="/signin"
    >
        <Form :schema="googleUsernameSchema" :form-data="formData" @submit="handleSubmit" class="flex flex-col gap-5" novalidate>
            <template #default="{ errors }">
                <FormInput
                    id="username"
                    :label="t('auth.fields.username')"
                    :placeholder="t('auth.fields.usernameExamplePh')"
                    v-model="formData.username"
                    :error="errors.username || usernameTaken"
                    :icon="usernameStatus === 'available' && !errors.username ? 'TickCircle' : undefined"
                    icon-position="end"
                    :icon-config="{ color: '#16a34a', size: 20, type: 'bold' }"
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
                            {{ t('auth.terms.accept') }}
                            <button
                                type="button"
                                class="font-medium text-brand-primary hover:underline"
                                @click.prevent="showTerms = true"
                            >
                                {{ t('auth.terms.link') }}
                            </button>
                        </label>
                    </div>
                    <FormError :error="errors.acceptAgreement" class="ps-7" />
                </div>

                <FormServerError :error="serverError" />

                <AppButton
                    type="submit"
                    variant="primary"
                    size="52"
                    radius="full"
                    :loading="authStore.isLoading"
                    class-list="w-full mt-2"
                    :aria-label="t('auth.googleUsername.submit')"
                >
                    {{ t('auth.googleUsername.submit') }}
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
