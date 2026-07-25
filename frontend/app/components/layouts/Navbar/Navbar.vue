<template>
    <header
        id="site-navbar"
        class="fixed top-0 inset-x-0 z-50 border-b transition-all duration-300"
        :class="scrolled ? 'bg-brand-ink/60 backdrop-blur-xl border-neutral-50/10' : 'bg-transparent border-transparent'"
    >
        <div class="container-lg layout-padding-lg h-16 flex items-center justify-between">
            <AppLink to="/" class="flex items-center gap-2 group" @click="handleLogoClick">
                <AppImage src="/only-logo-black-border-yellow-bg.svg" alt="Tutelage AI Logo" class="size-8" />
                <AppText size="15" weight="semibold" color="white" class-list="tracking-tight">
                    Tutelage <span class="text-brand-primary">AI</span>
                </AppText>
            </AppLink>

            <nav class="hidden md-lg:flex items-center gap-7">
                <AppLink
                    v-for="item in navLinks"
                    :key="item.link"
                    :to="item.link"
                    class="group relative text-[13px] font-medium text-neutral-50/70 transition-colors hover:text-brand-primary after:absolute after:inset-x-0 after:-bottom-1 after:h-0.5 after:origin-[left_center] rtl:after:origin-[right_center] after:scale-x-0 after:bg-brand-primary after:transition-transform after:duration-300 hover:after:scale-x-100"
                    :class="activeLink === item.link ? 'text-brand-primary after:scale-x-100' : ''"
                    @click="handleLinkClick(item.link)"
                >
                    {{ item.name }}
                </AppLink>
            </nav>

            <div class="hidden md-lg:flex items-center gap-3">
                <LayoutsNavbarLanguageSwitcher />
                <AppButton to="/signin" variant="brand" size="38" class-list="px-3.5 text-[13px] gap-1.5">
                    <span>{{ t('nav.getStarted') }}</span>
                    <Icon icon="lucide:arrow-right" width="13" class="rtl:rotate-180" />
                </AppButton>
            </div>

            <div class="md-lg:hidden flex items-center gap-2">
                <AppButton to="/#cta" variant="brand" size="38" class-list="px-3 sm:px-3.5 text-[13px] gap-1.5">
                    <span>{{ t('nav.getStarted') }}</span>
                    <Icon icon="lucide:arrow-right" width="13" class="rtl:rotate-180" />
                </AppButton>
                <LayoutsNavbarMenu :nav-items="navLinks" :active-link="activeLink" @select="handleLinkClick" />
            </div>
        </div>
    </header>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { nextTick } from 'vue'
import type { NavItemTypes } from '~/common/types/nav-links-type'

const scrolled = ref(false)
const route = useRoute()
const activeLink = ref('')
const { t } = useLocale()

let sectionObserver: IntersectionObserver | null = null

// Links are constant (used for scroll-spy); only the labels are localized.
const navLinks = computed<NavItemTypes[]>(() => [
    { name: t('nav.features'), link: '/#features' },
    { name: t('nav.howItWorks'), link: '/#how' },
    { name: t('nav.dashboard'), link: '/#dashboard' },
    { name: t('nav.pricing'), link: '/#pricing' },
])

const sectionIds = computed(() => navLinks.value.reduce<string[]>((ids, item) => {
    const sectionId = item.link.split('#')[1]
    if (sectionId) ids.push(sectionId)
    return ids
}, []))

const clearActiveLink = () => {
    activeLink.value = ''
}

const isNearTop = () => window.scrollY < 48

const isFooterInView = () => {
    const footerEl = document.querySelector('footer')
    if (!footerEl) return false

    const rect = footerEl.getBoundingClientRect()
    return rect.top <= window.innerHeight * 0.8
}

const syncInactiveZones = () => {
    if (isNearTop() || isFooterInView()) {
        clearActiveLink()
    }
}

const handleLinkClick = (link: string) => {
    activeLink.value = link
}

const handleLogoClick = (event: MouseEvent) => {
    if (route.path !== '/') return

    event.preventDefault()
    useScrollToTop()
    clearActiveLink()
}

const setupSectionObserver = async () => {
    sectionObserver?.disconnect()

    if (route.path !== '/') {
        clearActiveLink()
        return
    }

    await nextTick()

    const sections = sectionIds.value
        .map((id) => document.getElementById(id))
        .filter((el): el is HTMLElement => Boolean(el))

    if (!sections.length) {
        clearActiveLink()
        return
    }

    sectionObserver = new IntersectionObserver((entries) => {
        if (isNearTop() || isFooterInView()) {
            clearActiveLink()
            return
        }

        const visibleEntry = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]

        if (!visibleEntry) return

        activeLink.value = `/#${visibleEntry.target.id}`
    }, {
        root: null,
        rootMargin: '-45% 0px -45% 0px',
        threshold: [0, 0.2, 0.5, 0.8],
    })

    for (const section of sections) {
        sectionObserver.observe(section)
    }
}

const onScroll = () => {
    scrolled.value = window.scrollY > 20
    syncInactiveZones()
}

onMounted(() => {
    window.addEventListener('scroll', onScroll)
    setupSectionObserver()

    if (route.path === '/' && route.hash) {
        activeLink.value = `/${route.hash}`
    }

    onScroll()
})

watch(() => route.path, () => {
    setupSectionObserver()

    if (route.path !== '/') {
        clearActiveLink()
        return
    }

    if (route.hash) {
        activeLink.value = `/${route.hash}`
        return
    }

    syncInactiveZones()
})

watch(() => route.hash, (hash) => {
    if (route.path !== '/') return

    if (!hash) {
        syncInactiveZones()
        return
    }

    activeLink.value = `/${hash}`
})

onUnmounted(() => {
    sectionObserver?.disconnect()
    window.removeEventListener('scroll', onScroll)
})
</script>
