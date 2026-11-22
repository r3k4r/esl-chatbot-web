<script setup lang="ts">
withDefaults(defineProps<{
    title: string
    subtitle?: string
    footerText?: string
    footerLinkText?: string
    footerLinkTo?: string
}>(), {})
</script>

<template>
    <div class="w-full flex flex-col gap-8">
        <header class="flex flex-col gap-2">
            <AppText tag="h1" size="32" weight="semibold" color="brand-ink" class-list="tracking-[-0.02em] leading-[1.1]">
                {{ title }}
            </AppText>
            <AppText v-if="subtitle" tag="p" size="15" color="brand-sub" class-list="leading-relaxed">
                {{ subtitle }}
            </AppText>
        </header>

        <div class="flex flex-col gap-5">
            <slot />
        </div>

        <div v-if="$slots.divider || $slots.alt" class="flex flex-col gap-5">
            <div class="flex items-center gap-4">
                <span class="h-px flex-1 bg-black/10" />
                <AppText size="12" color="brand-sub" class-list="uppercase tracking-wider">
                    <slot name="divider">{{ $t('auth.or') }}</slot>
                </AppText>
                <span class="h-px flex-1 bg-black/10" />
            </div>
            <slot name="alt" />
        </div>

        <p v-if="footerText && footerLinkText && footerLinkTo" class="text-sm text-brand-sub text-center">
            {{ footerText }}
            <NuxtLink :to="footerLinkTo" class="font-semibold text-brand-ink hover:text-brand-primary transition-colors">
                {{ footerLinkText }}
            </NuxtLink>
        </p>
    </div>
</template>
