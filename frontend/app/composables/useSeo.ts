import type { MaybeRefOrGetter } from 'vue'

const SITE = {
  name: 'Tutelage AI',
  url: 'https://ai.tutelage.krd',
  description: 'Learn English with an AI tutor: real conversations, live voice practice, pronunciation feedback, vocabulary review and progress tracking, all in one place.',
  keywords: 'learn English, ESL, AI English tutor, English speaking practice, pronunciation, vocabulary, IELTS, Kurdistan, Tutelage',
  ogImage: '/og/default.jpg', // drawn by scripts/generate-og-images.cjs
}

// Social crawlers need absolute URLs.
const absolute = (path: string) => (path.startsWith('http') ? path : `${SITE.url}${path}`)

/**
 * Page title + meta. `title` is the page name only ("AI Chat"); the site name is appended.
 * Values may be getters so translated or loaded text stays reactive.
 * Use `noindex` for signed-in and one-time pages (dashboard, OTP, reset password).
 */
export const useSeo = (options: {
  title?: MaybeRefOrGetter<string | undefined>
  description?: MaybeRefOrGetter<string | undefined>
  keywords?: string
  ogImage?: MaybeRefOrGetter<string | undefined>
  noindex?: boolean
} = {}) => {
  const route = useRoute()
  const title = () => {
    const page = toValue(options.title)
    return page ? `${page} · ${SITE.name}` : SITE.name
  }
  const description = () => toValue(options.description) || SITE.description
  const image = () => absolute(toValue(options.ogImage) || SITE.ogImage)

  useSeoMeta({
    title,
    ogTitle: title,
    twitterTitle: title,
    description,
    ogDescription: description,
    twitterDescription: description,
    keywords: options.keywords || SITE.keywords,
    ogUrl: () => absolute(route.path),
    ogImage: image,
    ogImageAlt: title,
    // shortcut: assumes every share image is a 1200x630 card from public/og/; drop these if a page passes another size.
    ogImageWidth: 1200,
    ogImageHeight: 630,
    twitterImage: image,
    ogSiteName: SITE.name,
    ogType: 'website',
    twitterCard: 'summary_large_image',
    themeColor: '#cc923b',
    ...(options.noindex ? { robots: 'noindex, nofollow' } : {}),
  })
}
