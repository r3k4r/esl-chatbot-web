import { describe, it, expect, beforeEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import PricingCard from '~/components/Pages/Home/PricingCard.vue'
import Pricing from '~/components/Pages/Home/Pricing.vue'
import { useAuthStore } from '~~/stores/auth'
import type { PricingPlan } from '~/common/types/subscription-types'
import { sampleUser } from '../helpers/fetch-mock'

const plan = (overrides: Partial<PricingPlan> = {}): PricingPlan => ({
  id: 'gold', planKey: 'GOLD', featured: true, name: 'Gold', price: '25,000 IQD',
  description: 'Serious learners', features: ['15 sessions/day', '100 msgs/session'], cta: 'Get Gold',
  ...overrides,
})

describe('PagesHomePricingCard', () => {
  it('splits the price into amount and currency', async () => {
    const w = await mountSuspended(PricingCard, { props: { plan: plan(), href: '/x' } })
    expect(w.text()).toContain('25,000')
    expect(w.text()).toContain('IQD/month')
  })

  it('shows a single-word price on its own, without the per-month suffix', async () => {
    const w = await mountSuspended(PricingCard, { props: { plan: plan({ price: 'Free', featured: false }), href: '/signup' } })
    expect(w.text()).toContain('Free')
    expect(w.text()).not.toContain('/month')
  })

  it('marks only the featured plan as most popular, with stars', async () => {
    const featured = await mountSuspended(PricingCard, { props: { plan: plan(), href: '/x' } })
    const plain = await mountSuspended(PricingCard, { props: { plan: plan({ featured: false }), href: '/x' } })
    expect(featured.text()).toContain('Most Popular')
    expect(featured.findAll('.pricing-star').length).toBeGreaterThan(0)
    expect(plain.text()).not.toContain('Most Popular')
    expect(plain.findAll('.pricing-star')).toHaveLength(0)
  })

  it('lists every feature and links the CTA', async () => {
    const w = await mountSuspended(PricingCard, { props: { plan: plan(), href: '/signup?plan=GOLD' } })
    expect(w.findAll('li').map((li) => li.text())).toEqual(['15 sessions/day', '100 msgs/session'])
    const cta = w.find('a')
    expect(cta.text()).toContain('Get Gold')
    expect(cta.attributes('href')).toBe('/signup?plan=GOLD')
  })
})

describe('PagesHomePricing', () => {
  // mountSuspended renders with the Nuxt app's own Pinia, so reset that store
  // rather than activating a fresh one the component would never see.
  beforeEach(() => useAuthStore().$reset())

  const ctaHrefs = async () => (await mountSuspended(Pricing)).findAll('article a').map((a) => a.attributes('href'))

  it('renders the three plans from the locale', async () => {
    const w = await mountSuspended(Pricing)
    expect(w.findAll('article')).toHaveLength(3)
    expect(w.text()).toContain('Starter')
    expect(w.text()).toContain('Premium')
  })

  it('sends guests to sign up, keeping the chosen plan for after registration', async () => {
    expect(await ctaHrefs()).toEqual([
      '/signup',
      '/signup?redirect=/dashboard/billing?plan=GOLD',
      '/signup?redirect=/dashboard/billing?plan=PREMIUM',
    ])
  })

  it('sends signed-in users straight to billing', async () => {
    useAuthStore().setUserFromResponse(sampleUser() as never)
    expect(await ctaHrefs()).toEqual(['/signup', '/dashboard/billing?plan=GOLD', '/dashboard/billing?plan=PREMIUM'])
  })
})
