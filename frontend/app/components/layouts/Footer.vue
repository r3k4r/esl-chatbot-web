<template>
    <footer class="bg-brand-ink text-neutral-50/70">
        <div class="container-lg layout-padding-lg pt-20 pb-10">
            <div class="grid md:grid-cols-5 gap-10">
                <div class="md:col-span-2">
                    <AppLink to="/" class="flex items-center gap-2 w-fit">
                        <AppImage src="/only-logo-black-border-yellow-bg.svg" alt="Tutelage AI Logo" class="size-8" />
                        <AppText size="15" weight="semibold" color="white" class-list="tracking-tight">
                            Tutelage <span class="text-brand-primary">AI</span>
                        </AppText>
                    </AppLink>

                    <AppText size="13" color="white-50" class-list="mt-5 max-w-xs leading-relaxed">
                        {{ t('footer.tagline') }}
                    </AppText>

                    <div class="mt-6 flex items-center gap-2">
                        <AppLink
                            v-for="social in socials"
                            :key="social"
                            to="#"
                            class="size-9 rounded-lg border border-neutral-50/10 bg-neutral-50/3 flex items-center justify-center text-[11px] font-semibold text-neutral-50/70 transition hover:text-brand-primary hover:border-brand-primary/30"
                        >
                            {{ social }}
                        </AppLink>
                    </div>
                </div>

                <div v-for="col in cols" :key="col.heading">
                    <AppText
                        size="11"
                        weight="semibold"
                        color="white-45"
                        class-list="mb-4 uppercase tracking-[0.2em]"
                    >
                        {{ col.heading }}
                    </AppText>

                    <div class="space-y-2.5">
                        <AppLink
                            v-for="link in col.links"
                            :key="link"
                            to="#"
                            class="block text-[13px] text-neutral-50/70 transition-colors hover:text-brand-primary"
                        >
                            {{ link }}
                        </AppLink>
                    </div>
                </div>
            </div>

            <div class="mt-16 pt-6 border-t border-neutral-50/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                <AppText size="12" color="white-40">{{ t('footer.rights') }}</AppText>
                <div class="flex items-center gap-4 text-[12px] text-neutral-50/40">
                    <div class="flex items-center gap-1.5">
                        <Icon icon="lucide:globe" width="12" />
                        <AppText size="12" color="white-40">{{ nativeName }}</AppText>
                    </div>
                    <div class="flex items-center gap-1.5">
                        <span class="size-1.5 rounded-full bg-emerald-400" />
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

// Social handles are brand abbreviations — not translated.
const socials = ['X', 'in', 'gh', 'yt']

const cols = computed(() => [
    { heading: t('footer.columns.product.heading'),   links: ta('footer.columns.product.links') },
    { heading: t('footer.columns.resources.heading'), links: ta('footer.columns.resources.links') },
    { heading: t('footer.columns.company.heading'),   links: ta('footer.columns.company.links') },
])
</script>
