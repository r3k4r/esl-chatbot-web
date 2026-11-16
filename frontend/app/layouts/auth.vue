<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()

// if we ion the sign in push '/' if we in sign up push back
const goBack = () => {
    if (route.path === '/signin') {
        router.push('/')
    } else if (route.path === '/signup') {
        router.back()
    }else {
        router.push('/')
    }
}
</script>

<template>
    <div class="min-h-dvh relative flex bg-neutral-50 overflow-hidden">
        <!-- Back button (floats over the form side) -->
        <button
            type="button"
            aria-label="Go back"
            @click="goBack"
            class="absolute top-6 left-6 z-30 inline-flex items-center gap-2 rounded-full bg-white/80 backdrop-blur-sm border border-black/10 px-4 h-10 text-sm font-medium text-brand-ink shadow-soft hover:bg-white hover:border-black/20 transition-all"
        >
            <ArrowLeft class="w-4 h-4" />
            <span>Back</span>
        </button>

        <!-- Form side -->
        <main class="relative w-full lg:w-1/2 flex items-center justify-center px-6 sm:px-10 py-24 lg:py-16">
            <!-- Subtle background orbs for the form side -->
            <div class="absolute -top-24 -left-24 size-72 rounded-full bg-primary-200/30 blur-3xl pointer-events-none" />
            <div class="absolute -bottom-32 -right-20 size-80 rounded-full bg-ternary-200/20 blur-3xl pointer-events-none" />

            <div class="relative w-full max-w-md">
                <NuxtLink to="/" class="flex items-center gap-2 mb-10" aria-label="Tutelage home">
                    <AppImage src="/only-logo-black-border-yellow-bg.svg" alt="Tutelage AI Logo" class="size-9" />
                    <AppText tag="span" size="18" weight="semibold" color="brand-ink" class-list="tracking-tight">
                        Tutelage <span class="text-brand-primary">AI</span>
                    </AppText>
                </NuxtLink>

                <slot />
            </div>
        </main>

        <!-- Branded panel (hidden on mobile) -->
        <aside class="relative hidden lg:flex w-1/2 bg-linear-to-br from-brand-ink via-brand-dark to-brand-dark2 overflow-hidden">
            <div class="absolute inset-0 pointer-events-none opacity-70 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-size-[56px_56px] mask-[radial-gradient(ellipse_70%_60%_at_50%_40%,black_40%,transparent_80%)]" />
            <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-150 rounded-full bg-[radial-gradient(closest-side,rgba(245,158,11,0.22),rgba(245,158,11,0.05)_55%,transparent_70%)] blur-[20px] pointer-events-none" />
            <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-120 rounded-full pointer-events-none [box-shadow:inset_0_0_0_1px_rgba(255,255,255,0.04),0_0_120px_0_rgba(245,158,11,0.10)] [background:conic-gradient(from_210deg,transparent_0deg,rgba(245,158,11,0.08)_60deg,rgba(254,192,22,0.18)_90deg,rgba(245,158,11,0.08)_120deg,transparent_180deg)] [mask:radial-gradient(closest-side,transparent_58%,black_60%,black_62%,transparent_64%)]" />

            <div class="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
                <div class="inline-flex items-center gap-2 rounded-full bg-neutral-50/4 border border-neutral-50/10 pl-2 pr-3.5 py-1 w-fit">
                    <div class="inline-flex items-center gap-1 bg-brand-primary/15 text-brand-primary px-2 py-0.5 rounded-full text-[10.5px] font-semibold tracking-wider uppercase">
                        AI
                    </div>
                    <AppText size="12" color="white" class-list="text-neutral-50/80">Smarter English, one conversation at a time</AppText>
                </div>

                <div class="flex flex-col gap-6 max-w-lg">
                    <AppText size="40" weight="semibold" color="white" class-list="tracking-[-0.02em] leading-[1.05]">
                        Learn English the way
                        <span class="text-brand-primary">you actually speak it.</span>
                    </AppText>
                    <AppText size="16" color="white-70" class-list="leading-relaxed">
                        AI-powered conversations, voice practice, and intelligent progress tracking — all in one platform built for serious learners.
                    </AppText>

                    <div class="grid grid-cols-3 gap-4 mt-4">
                        <div class="rounded-2xl bg-neutral-50/4 border border-neutral-50/10 p-4">
                            <AppText size="24" weight="semibold" color="white">10k+</AppText>
                            <AppText size="12" color="white-60">Active learners</AppText>
                        </div>
                        <div class="rounded-2xl bg-neutral-50/4 border border-neutral-50/10 p-4">
                            <AppText size="24" weight="semibold" color="white">98%</AppText>
                            <AppText size="12" color="white-60">Satisfaction</AppText>
                        </div>
                        <div class="rounded-2xl bg-neutral-50/4 border border-neutral-50/10 p-4">
                            <AppText size="24" weight="semibold" color="white">24/7</AppText>
                            <AppText size="12" color="white-60">AI tutor</AppText>
                        </div>
                    </div>
                </div>

                <AppText size="12" color="white-50">© {{ new Date().getFullYear() }} Tutelage AI. All rights reserved.</AppText>
            </div>
        </aside>
    </div>
</template>
