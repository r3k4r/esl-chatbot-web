// v-reveal: an element rises into place the first time it scrolls into view.
//   <h2 v-reveal>…</h2>  ·  <p v-reveal="90">…</p> (delay in ms, for staggering)
// Server-rendered content is never hidden: an element only hides once this runs in the
// browser, and only if it is still below the fold. Styles in assets/css/animation.css.
export default defineNuxtPlugin((nuxtApp) => {
  let observer: IntersectionObserver | null = null
  const getObserver = () => (observer ??= new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue
      e.target.classList.add('is-in')
      observer!.unobserve(e.target)
    }
  }, { rootMargin: '0px 0px -8% 0px' }))

  nuxtApp.vueApp.directive<HTMLElement, number | undefined>('reveal', {
    getSSRProps: () => ({}),
    mounted(el, binding) {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      // Already on screen: leave it as it is, so nothing flashes.
      if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return
      if (binding.value) el.style.setProperty('--reveal-delay', `${binding.value}ms`)
      el.classList.add('reveal-wait')
      getObserver().observe(el)
    },
    unmounted(el) {
      observer?.unobserve(el)
    },
  })
})
