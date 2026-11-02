<template>
    <header
        id="site-navbar"
        class="fixed top-0 inset-x-0 z-50 border-b transition-all duration-300"
        :class="scrolled ? 'bg-brand-ink/90 backdrop-blur-xl border-white/10 shadow-lg' : 'bg-transparent border-transparent'"
    >
        <div class="container-lg layout-padding-lg h-16 sm:h-20 flex items-center justify-between">
            <AppLink to="/" class="flex items-center gap-2 group" @click="handleLogoClick">
                <AppBrandLogo size="md" theme="dark" />
            </AppLink>

            <nav class="hidden md-lg:flex items-center gap-7">
                <AppLink
                    v-for="item in navLinks"
                    :key="item.link"
                    :to="item.link"
                    class="group relative text-[13px] font-medium text-neutral-50/80 transition-colors hover:text-white after:absolute after:inset-x-0 after:-bottom-1 after:h-0.5 after:origin-[left_center] rtl:after:origin-[right_center] after:scale-x-0 after:bg-[#B91C1C] after:transition-transform after:duration-300 hover:after:scale-x-100"
                    :class="activeLink === item.link ? 'text-white after:scale-x-100' : ''"
                    @click="handleLinkClick(item.link)"
                >
                    {{ item.name }}
                </AppLink>
            </nav>

            <div class="hidden md-lg:flex items-center gap-3">
                <LayoutsNavbarLanguageSwitcher />
                <AppButton to="/dashboard/chat" variant="brand" size="38" class-list="px-4 text-[13px] gap-2 shadow-md">
                    <Icon icon="lucide:sparkles" width="14" class="text-amber-300" />
                    <span>{{ t('nav.getStarted') }}</span>
                    <Icon icon="lucide:arrow-right" width="13" class="rtl:rotate-180" />
                </AppButton>
            </div>

            <div class="md-lg:hidden flex items-center gap-2">
                <LayoutsNavbarLanguageSwitcher />
                <AppButton to="/dashboard/chat" variant="brand" size="36" class-list="px-3 text-[12px] gap-1.5">
                    <span>{{ t('nav.getStarted') }}</span>
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

    sectionObserver = new IntersectionObserver(
        (entries) => {
            if (isNearTop() || isFooterInView()) {
                clearActiveLink()
                return
            }

            const visibleEntries = entries.filter((entry) => entry.isIntersecting)
            if (!visibleEntries.length) return

            visibleEntries.sort((a, b) => {
                if (b.intersectionRatio !== a.intersectionRatio) {
                    return b.intersectionRatio - a.intersectionRatio
                }
                return Math.abs(a.boundingClientRect.top) - Math.abs(b.boundingClientRect.top)
            })

            const primaryEntry = visibleEntries[0]
            if (primaryEntry?.target?.id) {
                activeLink.value = `/#${primaryEntry.target.id}`
            }
        },
        {
            root: null,
            rootMargin: '-35% 0px -45% 0px',
            threshold: [0.15, 0.35, 0.6],
        }
    )

    sections.forEach((section) => sectionObserver?.observe(section))
}

const onScroll = () => {
    scrolled.value = window.scrollY > 20
    syncInactiveZones()
}

onMounted(() => {
    window.addEventListener('scroll', onScroll, { passive: true })
    scrolled.value = window.scrollY > 20
    setupSectionObserver()
})

onUnmounted(() => {
    window.removeEventListener('scroll', onScroll)
    sectionObserver?.disconnect()
})

watch(() => route.path, () => {
    setupSectionObserver()
})
</script>
