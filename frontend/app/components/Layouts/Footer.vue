<template>
    <footer class="bg-brand-ink text-neutral-50/70">
        <div class="container-lg layout-padding-lg pt-20 pb-10">
            <div class="grid md:grid-cols-5 gap-10">
                <div class="md:col-span-2">
                    <AppLink to="/" class="flex items-center gap-2 w-fit" dir="ltr">
                        <AppImage src="/only-logo-black-border-yellow-bg.svg" alt="Tutelage AI Logo" class="size-8" />
                        <AppText size="15" weight="semibold" color="white" class-list="tracking-tight">
                            Tutelage <span class="text-brand-primary">AI</span>
                        </AppText>
                    </AppLink>

                    <AppText size="13" color="white-50" class-list="mt-5 max-w-xs leading-relaxed">
                        {{ t('footer.tagline') }}
                    </AppText>
                </div>

                <!-- Every link goes to a real page or section of this app -->
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
                            :key="link.to"
                            :to="link.to"
                            class="block text-[13px] text-neutral-50/70 transition-colors hover:text-brand-primary"
                        >
                            {{ link.label }}
                        </AppLink>
                    </div>
                </div>
            </div>

            <div class="mt-16 pt-6 border-t border-neutral-50/10 flex flex-col sm:flex-row items-center justify-between gap-3 max-sm:text-center">
                <AppText size="12" color="white-40">{{ t('footer.rights', { year }) }}</AppText>
                <div class="flex items-center gap-4 text-[12px] text-neutral-50/40">
                    <div class="flex items-center gap-1.5">
                        <Icon icon="lucide:globe" width="12" />
                        <AppText size="12" color="white-40">{{ nativeName }}</AppText>
                    </div>
                    <!-- Like the other Tutelage sites: the product, then who makes it -->
                    <AppText size="12" color="white-40">
                        {{ t('footer.poweredBy') }}
                        <AppLink :to="TUTELAGE_MAIN_URL" target="_blank" rel="noopener"
                            class="font-semibold text-neutral-50/70 transition-colors hover:text-brand-primary" dir="ltr">Tutelage</AppLink>
                    </AppText>
                </div>
            </div>
        </div>
    </footer>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { FEATURE_PAGES } from '~/common/data/feature-pages'
import { TUTELAGE_MAIN_URL } from '~/common/data/nav-links'

const { t, nativeName } = useLocale()
// Rendered on the server; a hard-coded year would go stale.
const year = new Date().getFullYear()

const cols = computed(() => [
    {
        heading: t('footer.columns.product'),
        links: [
            { label: t('nav.features'), to: '/#features' },
            { label: t('nav.howItWorks'), to: '/#how' },
            { label: t('nav.dashboard'), to: '/#dashboard' },
            { label: t('nav.pricing'), to: '/#pricing' },
        ],
    },
    {
        heading: t('footer.columns.learn'),
        links: FEATURE_PAGES.map((p) => ({ label: t(`features.items.${p.key}.title`), to: `/features/${p.slug}` })),
    },
    {
        heading: t('footer.columns.account'),
        links: [
            { label: t('auth.common.signIn'), to: '/signin' },
            { label: t('auth.signup.submit'), to: '/signup' },
            { label: t('footer.resetPassword'), to: '/forgot-password' },
        ],
    },
])
</script>
