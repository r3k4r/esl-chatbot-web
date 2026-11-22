/**
 * Real numbers for the marketing site (ISS-005): the learner count comes from
 * GET /public/stats instead of a hard-coded "2,000+".
 *
 *   const { learners } = usePublicStats()   // "2,100+" / "120+" / "7", or null while unknown
 */
export function usePublicStats() {
  const { htmlLang } = useLocale()

  const { data } = useAsyncData('public-stats', async () => {
    const res = await useHttp<{ data: { learners: number } }>({ method: 'GET', url: '/public/stats' })
    return res.success ? (res.data?.data ?? null) : null
  })

  /** Rounded down so it never overstates: 2,140 → "2,100+", 128 → "120+", under 100 → exact. */
  const learners = computed(() => {
    const n = data.value?.learners
    if (!n) return null
    const step = n >= 1000 ? 100 : n >= 100 ? 10 : 1
    const shown = Math.floor(n / step) * step
    return `${shown.toLocaleString(htmlLang.value)}${step > 1 ? '+' : ''}`
  })

  return { learners }
}
