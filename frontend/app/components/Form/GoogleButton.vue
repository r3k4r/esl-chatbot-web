<script setup lang="ts">
import { useAuthStore } from '~~/stores/auth'
import { toast } from 'vue-sonner'

withDefaults(defineProps<{
    label?: string
}>(), {
    label: 'Continue with Google',
})

const authStore = useAuthStore()
const router = useRouter()
const isLoading = ref(false)
const isSdkReady = ref(false)
const hiddenContainer = ref<HTMLDivElement | null>(null)
const wrapperWidth = ref(400)

// Re-accept state: holds the idToken to reuse if the user sees a needsAgreement 403.
const pendingIdToken = ref<string>('')
const reacceptOpen = ref(false)
let reacceptCancelled = false

const loadGoogleSdk = () => new Promise<void>((resolve, reject) => {
    if ((window as any).google?.accounts?.id) {
        resolve()
        return
    }
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://accounts.google.com/gsi/client"]')
    if (existing) {
        existing.addEventListener('load', () => resolve(), { once: true })
        existing.addEventListener('error', () => reject(new Error('Failed to load Google SDK')), { once: true })
        return
    }
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google SDK'))
    document.head.appendChild(script)
})

const handleCredential = async (idToken: string) => {
    isLoading.value = true
    const response = await authStore.googleAuth(idToken)

    if (!response.success) {
        // Existing-user path: Terms changed since last sign-in.
        if (response.status === 403 && response.data?.needsAgreement) {
            pendingIdToken.value = idToken
            reacceptCancelled = false
            reacceptOpen.value = true
            isLoading.value = false
            return
        }
        toast.error(response.message || 'Google sign-in failed.')
        isLoading.value = false
        return
    }

    if (response.data?.data?.needsRegistration) {
        sessionStorage.setItem('googleIdToken', idToken)
        sessionStorage.setItem('googleProfile', JSON.stringify(response.data.data.profile || {}))
        router.push('/google-username')
        return
    }

    toast.success('Welcome!')
    router.push('/dashboard')
}

const handleReaccept = async () => {
    reacceptCancelled = false
    const response = await authStore.acceptAgreement({ idToken: pendingIdToken.value })

    if (reacceptCancelled) return

    if (response.success) {
        reacceptOpen.value = false
        pendingIdToken.value = ''
        router.push('/dashboard')
        return
    }

    toast.error(response.message || 'Could not accept the Terms. Please try again.')
}

const handleReacceptClose = () => {
    reacceptCancelled = true
    reacceptOpen.value = false
    pendingIdToken.value = ''
    isLoading.value = false
}

onMounted(async () => {
    const clientId = useRuntimeConfig().public.googleClientId as string
    if (!clientId) return

    try {
        await loadGoogleSdk()
    } catch {
        toast.error('Could not load Google Sign-In. Check your connection.')
        return
    }

    const google = (window as any).google
    if (!google?.accounts?.id || !hiddenContainer.value) return

    if (hiddenContainer.value.parentElement) {
        wrapperWidth.value = hiddenContainer.value.parentElement.offsetWidth || 400
    }

    google.accounts.id.initialize({
        client_id: clientId,
        callback: (response: { credential?: string }) => {
            if (response?.credential) {
                handleCredential(response.credential)
            } else {
                toast.error('Google sign-in failed. Please try again.')
            }
        },
        use_fedcm_for_prompt: false,
    })

    google.accounts.id.renderButton(hiddenContainer.value, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'pill',
        logo_alignment: 'center',
        width: wrapperWidth.value,
    })

    isSdkReady.value = true
})
</script>

<template>
    <div class="relative w-full">
        <!--
            Visible custom-styled button. It's a visual layer only — pointer-events-none
            ensures clicks fall through to Google's real button underneath.
        -->
        <div
            class="w-full h-13 rounded-full border border-black/15 bg-white flex items-center justify-center gap-3 font-medium text-brand-ink transition-colors"
            :class="{
                'pointer-events-none': true,
                'opacity-60': isLoading,
                'hover:bg-neutral-100': !isLoading,
            }"
            :aria-label="label"
            aria-hidden="true"
        >
            <svg class="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z"/>
            </svg>
            <span>{{ isLoading ? $t('auth.common.pleaseWait') : label }}</span>
        </div>

        <!--
            Google's real button, rendered by google.accounts.id.renderButton.
            Stretched over the visible button via absolute inset-0 with opacity-0,
            so the user clicks "through" the pretty button and actually triggers Google.
        -->
        <div
            ref="hiddenContainer"
            class="absolute inset-0 w-full opacity-0"
            :class="{ 'pointer-events-none': isLoading || !isSdkReady }"
        />
    </div>

    <!-- Re-accept modal: shown when backend returns 403 { needsAgreement: true } for existing Google users -->
    <FormAgreementDialog
        :open="reacceptOpen"
        mode="accept"
        :loading="authStore.isLoading"
        @update:open="(v) => { if (!v) handleReacceptClose() }"
        @accept="handleReaccept"
    />
</template>
