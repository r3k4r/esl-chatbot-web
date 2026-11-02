<template>
    <div class="relative min-h-dvh flex bg-neutral-50 overflow-hidden">
        <!-- Floating back button -->
        <button
            type="button"
            class="cursor-pointer absolute top-6 left-6 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-50/80 backdrop-blur border border-neutral-200/80 text-brand-ink text-xs font-medium hover:bg-neutral-50 hover:border-neutral-300 transition shadow-soft"
            aria-label="Go back"
            @click="handleBack"
        >
            <Icon icon="lucide:arrow-left" width="14" class="rtl:rotate-180" />
            <span>Back</span>
        </button>

        <!-- Form side -->
        <main class="relative w-full lg:w-1/2 flex items-center justify-center px-6 sm:px-10 py-24 lg:py-16">
            <!-- Subtle background orbs for the form side -->
            <div class="absolute -top-24 -left-24 size-72 rounded-full bg-red-100/30 blur-3xl pointer-events-none" />
            <div class="absolute -bottom-32 -right-20 size-80 rounded-full bg-blue-100/20 blur-3xl pointer-events-none" />

            <div class="relative w-full max-w-md">
                <NuxtLink to="/" class="flex items-center gap-2 mb-10" aria-label="LEO Institute home">
                    <AppBrandLogo size="lg" theme="light" />
                </NuxtLink>

                <slot />
            </div>
        </main>

        <!-- Branded panel (hidden on mobile) -->
        <aside class="relative hidden lg:flex w-1/2 bg-linear-to-br from-[#0F172A] via-[#1B365D] to-[#0B132B] overflow-hidden">
            <div class="absolute inset-0 pointer-events-none opacity-70 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-size-[56px_56px] mask-[radial-gradient(ellipse_70%_60%_at_50%_40%,black_40%,transparent_80%)]" />
            <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-150 rounded-full bg-[radial-gradient(closest-side,rgba(185,28,28,0.25),rgba(27,54,93,0.15)_55%,transparent_70%)] blur-[20px] pointer-events-none" />

            <div class="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
                <div class="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 pl-2 pr-3.5 py-1 w-fit">
                    <div class="inline-flex items-center gap-1 bg-[#B91C1C] text-white px-2 py-0.5 rounded-full text-[10.5px] font-bold tracking-wider uppercase">
                        LEO AI
                    </div>
                    <AppText size="12" color="white" class-list="text-neutral-50/80">Sulaymaniyah — Opposite Azadi Park</AppText>
                </div>

                <div class="flex flex-col gap-6 max-w-lg">
                    <AppText size="40" weight="semibold" color="white" class-list="tracking-[-0.02em] leading-[1.08] text-3xl xl:text-4xl font-extrabold">
                        Master English with
                        <span class="text-[#F87171]">guaranteed fluency.</span>
                    </AppText>
                    <AppText size="16" color="white-70" class-list="leading-relaxed text-slate-300 text-sm xl:text-base">
                        کۆرسەکانمان بەشێوەی ئۆنڵاین و ڕووبەڕوو بە گەرەنتی فێربوون بەردەستە! Dedicated in-person classes and Kurdistan's first 24/7 AI Speaking Coach.
                    </AppText>

                    <div class="grid grid-cols-3 gap-3.5 mt-2">
                        <div class="rounded-2xl bg-white/5 border border-white/10 p-4">
                            <AppText size="24" weight="semibold" color="white" class-list="font-bold">1,500+</AppText>
                            <AppText size="12" color="white-60" class-list="text-xs text-slate-300">Annual Students</AppText>
                        </div>
                        <div class="rounded-2xl bg-white/5 border border-white/10 p-4">
                            <AppText size="24" weight="semibold" color="white" class-list="font-bold">100%</AppText>
                            <AppText size="12" color="white-60" class-list="text-xs text-slate-300">Guaranteed</AppText>
                        </div>
                        <div class="rounded-2xl bg-white/5 border border-white/10 p-4">
                            <AppText size="24" weight="semibold" color="white" class-list="font-bold">24/7</AppText>
                            <AppText size="12" color="white-60" class-list="text-xs text-slate-300">LEO AI Coach</AppText>
                        </div>
                    </div>
                </div>

                <AppText size="12" color="white-50">© {{ new Date().getFullYear() }} LEO Institute (پەیمانگای لیۆ). All rights reserved.</AppText>
            </div>
        </aside>
    </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'

const router = useRouter()

const handleBack = () => {
    if (window.history.length > 1) {
        router.back()
    } else {
        router.push('/')
    }
}
</script>
