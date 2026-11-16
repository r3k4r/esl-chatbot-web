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
const submitLabel = computed(() => cooldown.active.value ? `Try again in ${cooldown.label.value}` : 'Create account')

const handleSubmit = async () => {
    serverError.value = ''
    const response = await authStore.signUp(formData)

    if (response.success) {
        sessionStorage.setItem('pendingEmail', formData.email)
        toast.success('Account created! Check your email for a verification code.')
        router.push('/verify-email')
    } else {
        if (response.status === 429 && response.retryAfter) cooldown.start(response.retryAfter)
        serverError.value = response.message || 'Registration failed. Please try again.'
    }
}
</script>

<template>
    <LayoutsAuthFormLayout
        title="Create your account"
        subtitle="Start practicing English with an AI tutor built for serious learners."
        footer-text="Already have an account?"
        footer-link-text="Sign in"
        footer-link-to="/signin"
    >
        <Form :schema="signUpSchema" :form-data="formData" @submit="handleSubmit" class="flex flex-col gap-5">
            <template #default="{ errors }">

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput
                        id="displayName"
                        label="Display name"
                        placeholder="e.g. Ali Hassan"
                        v-model="formData.displayName"
                        :error="errors.displayName"
                        required
                    />

                    <FormInput
                        id="username"
                        label="Username"
                        placeholder="e.g. student_ali"
                        v-model="formData.username"
                        :error="errors.username"
                        required
                    />
                </div>

                <FormInput
                    id="email"
                    has-copy
                    type="email"
                    label="Email"
                    placeholder="you@example.com"
                    v-model="formData.email"
                    :error="errors.email"
                    required
                />

                <FormInput
                    id="password"
                    type="password"
                    label="Password"
                    placeholder="At least 8 characters"
                    v-model="formData.password"
                    :error="errors.password"
                    required
                />

                <FormInput
                    id="confirmPassword"
                    type="password"
                    label="Confirm password"
                    placeholder="Repeat your password"
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
                    :disabled="cooldown.active.value"
                    class-list="w-full mt-2"
                    :aria-label="submitLabel"
                >
                    {{ submitLabel }}
                </AppButton>
            </template>
        </Form>

        <template #alt>
            <FormGoogleButton label="Sign up with Google" />
        </template>
    </LayoutsAuthFormLayout>

    <FormAgreementDialog
        :open="showTerms"
        mode="view"
        @update:open="showTerms = $event"
    />
</template>
