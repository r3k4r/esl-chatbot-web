<script setup lang="ts">
import { signUpSchema, type SignUpSchema } from '~/common/schemas/AuthSchema'
import { useAuthStore } from '~~/stores/auth'
import { toast } from 'vue-sonner'

definePageMeta({
    layout: 'auth',
    guestOnly: true,
})

const authStore = useAuthStore()
const router = useRouter()
const { t } = useLocale()

const formData = reactive<SignUpSchema>({
    username: '',
    email: '',
    displayName: '',
    password: '',
    confirmPassword: '',
    acceptAgreement: undefined as unknown as true,
})

const serverError = ref<string>('')
const showTerms = ref(false)
// Too many sign-ups from this network: lock the button until Retry-After lifts.
const cooldown = useCooldown()
const submitLabel = computed(() => cooldown.active.value ? t('auth.common.tryAgainIn', { time: cooldown.label.value }) : t('auth.signup.submit'))

// Live username check (ISS-009): a taken name shows under the field before submitting,
// a free one gets a green tick inside the field.
const { status: usernameStatus } = useUsernameAvailability(toRef(formData, 'username'))
const usernameTaken = computed(() => usernameStatus.value === 'taken' ? 'auth.signup.usernameTaken' : undefined)

const handleSubmit = async () => {
    serverError.value = ''
    if (usernameStatus.value === 'taken') return
    const response = await authStore.signUp(formData)

    if (response.success) {
        sessionStorage.setItem('pendingEmail', formData.email)
        toast.success(t('auth.signup.created'))
        router.push('/verify-email')
    } else {
        if (response.status === 429 && response.retryAfter) cooldown.start(response.retryAfter)
        serverError.value = response.message || t('auth.signup.failed')
    }
}
</script>

<template>
    <LayoutsAuthFormLayout
        :title="t('auth.signup.title')"
        :subtitle="t('auth.signup.subtitle')"
        :footer-text="t('auth.signup.haveAccount')"
        :footer-link-text="t('auth.common.signIn')"
        footer-link-to="/signin"
    >
        <Form :schema="signUpSchema" :form-data="formData" @submit="handleSubmit" class="flex flex-col gap-5" novalidate>
            <template #default="{ errors }">

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput
                        id="displayName"
                        :label="t('auth.fields.displayName')"
                        :placeholder="t('auth.fields.displayNamePh')"
                        v-model="formData.displayName"
                        :error="errors.displayName"
                        required
                    />

                    <FormInput
                        id="username"
                        :label="t('auth.fields.username')"
                        :placeholder="t('auth.fields.usernameExamplePh')"
                        v-model="formData.username"
                        :error="errors.username || usernameTaken"
                        :icon="usernameStatus === 'available' && !errors.username ? 'TickCircle' : undefined"
                        icon-position="end"
                        :icon-config="{ color: '#16a34a', size: 20, type: 'bold' }"
                        :aria-describedby="usernameStatus === 'available' ? 'username-ok' : undefined"
                        required
                    />
                </div>
                <span v-if="usernameStatus === 'available'" id="username-ok" class="sr-only">{{ t('auth.signup.usernameAvailable') }}</span>

                <FormInput
                    id="email"
                    has-copy
                    type="email"
                    :label="t('auth.fields.email')"
                    :placeholder="t('auth.fields.emailPh')"
                    v-model="formData.email"
                    :error="errors.email"
                    required
                />

                <FormInput
                    id="password"
                    type="password"
                    :label="t('auth.fields.password')"
                    :placeholder="t('auth.fields.passwordNewPh')"
                    v-model="formData.password"
                    :error="errors.password"
                    required
                />

                <FormInput
                    id="confirmPassword"
                    type="password"
                    :label="t('auth.fields.confirmPassword')"
                    :placeholder="t('auth.fields.confirmPasswordPh')"
                    v-model="formData.confirmPassword"
                    :error="errors.confirmPassword"
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
                    :disabled="cooldown.active.value"
                    class-list="w-full mt-2"
                    :aria-label="submitLabel"
                >
                    {{ submitLabel }}
                </AppButton>
            </template>
        </Form>

        <template #alt>
            <FormGoogleButton :label="t('auth.signup.google')" />
        </template>
    </LayoutsAuthFormLayout>

    <FormAgreementDialog
        :open="showTerms"
        mode="view"
        @update:open="showTerms = $event"
    />
</template>
