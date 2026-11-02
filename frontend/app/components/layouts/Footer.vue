<template>
    <footer class="bg-[#0B132B] text-neutral-50/70 border-t border-white/10">
        <div class="container-lg layout-padding-lg pt-16 sm:pt-20 pb-10">
            <!-- Top Grid -->
            <div class="grid md:grid-cols-12 gap-10">
                <!-- Brand & Address column -->
                <div class="md:col-span-5 space-y-5">
                    <AppLink to="/" class="flex items-center gap-2 w-fit">
                        <AppBrandLogo size="md" theme="dark" />
                    </AppLink>

                    <AppText size="13" color="white-60" class-list="max-w-md leading-relaxed">
                        {{ t('footer.tagline') }}
                    </AppText>

                    <!-- Campus Location Box -->
                    <div class="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2 max-w-md">
                        <div class="flex items-start gap-2.5 text-xs text-slate-200">
                            <Icon icon="lucide:map-pin" width="16" class="text-[#B91C1C] shrink-0 mt-0.5" />
                            <div>
                                <div class="font-semibold text-white">Sulaymaniyah Campus (کەمپەسی سەرەکی)</div>
                                <div class="text-slate-400 mt-0.5 leading-snug">
                                    Mamostayan Neighborhood, Directly Opposite Azadi Park<br />
                                    <span class="text-slate-300 font-medium">سلێمانی - گەڕەکی مامۆستایان - بەرامبەر پارکی ئازادی</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Direct Action Buttons -->
                    <div class="flex flex-wrap items-center gap-2.5 pt-1">
                        <a
                            href="https://t.me/+9647707362000"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#229ED9]/15 border border-[#229ED9]/30 text-xs font-semibold text-white hover:bg-[#229ED9]/25 transition"
                        >
                            <Icon icon="lucide:send" width="14" class="text-[#229ED9]" />
                            <span>Telegram: 0770 736 2000</span>
                        </a>

                        <a
                            href="tel:07508862786"
                            class="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#7360F2]/15 border border-[#7360F2]/30 text-xs font-semibold text-white hover:bg-[#7360F2]/25 transition"
                        >
                            <Icon icon="lucide:phone-call" width="14" class="text-[#A294F9]" />
                            <span>Viber: 0750 886 2786</span>
                        </a>

                        <a
                            href="mailto:leo.institute@yahoo.com"
                            class="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-medium text-slate-300 hover:text-white transition"
                        >
                            <Icon icon="lucide:mail" width="14" />
                            <span>leo.institute@yahoo.com</span>
                        </a>
                    </div>

                    <!-- Social Channels -->
                    <div class="flex items-center gap-3 pt-2">
                        <a
                            href="https://www.facebook.com/leo.kurdish.ins"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="size-9 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-slate-300 transition hover:text-white hover:border-[#B91C1C] hover:bg-[#B91C1C]/20"
                            title="Leo Institute Kurdish Facebook"
                        >
                            <Icon icon="lucide:facebook" width="16" />
                        </a>
                        <a
                            href="https://www.facebook.com/learnenglishonlinewithus"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="size-9 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-slate-300 transition hover:text-white hover:border-[#B91C1C] hover:bg-[#B91C1C]/20"
                            title="Learn English Online Facebook"
                        >
                            <Icon icon="lucide:globe" width="16" />
                        </a>
                        <a
                            href="https://www.youtube.com/results?search_query=%23leoinstitute"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="size-9 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-slate-300 transition hover:text-white hover:border-[#B91C1C] hover:bg-[#B91C1C]/20"
                            title="Leo Institute YouTube"
                        >
                            <Icon icon="lucide:video" width="16" />
                        </a>
                    </div>
                </div>

                <!-- Nav Columns -->
                <div class="md:col-span-7 grid sm:grid-cols-3 gap-8">
                    <div v-for="col in cols" :key="col.heading">
                        <AppText
                            size="11"
                            weight="semibold"
                            color="white-45"
                            class-list="mb-4 uppercase tracking-[0.2em] text-[#F59E0B]"
                        >
                            {{ col.heading }}
                        </AppText>

                        <div class="space-y-2.5">
                            <AppLink
                                v-for="link in col.links"
                                :key="link"
                                to="/#programs"
                                class="block text-[13px] text-neutral-50/70 transition-colors hover:text-white hover:translate-x-0.5"
                            >
                                {{ link }}
                            </AppLink>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Bottom Bar -->
            <div class="mt-14 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                <AppText size="12" color="white-40">{{ t('footer.rights') }}</AppText>
                <div class="flex items-center gap-5 text-[12px] text-neutral-50/40">
                    <div class="flex items-center gap-1.5">
                        <Icon icon="lucide:globe" width="12" />
                        <AppText size="12" color="white-40">{{ nativeName }}</AppText>
                    </div>
                    <div class="flex items-center gap-1.5">
                        <span class="size-2 rounded-full bg-emerald-400 animate-pulse" />
                        <AppText size="12" color="white-40">{{ t('footer.status') }}</AppText>
                    </div>
                </div>
            </div>
        </div>
    </footer>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'

const { t, ta, nativeName } = useLocale()

const cols = computed(() => [
    { heading: t('footer.columns.product.heading'),   links: ta('footer.columns.product.links') },
    { heading: t('footer.columns.resources.heading'), links: ta('footer.columns.resources.links') },
    { heading: t('footer.columns.company.heading'),   links: ta('footer.columns.company.links') },
])
</script>
