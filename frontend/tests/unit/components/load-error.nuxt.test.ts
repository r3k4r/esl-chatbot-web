import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import LoadError from '~/components/Block/LoadError.vue'

describe('BlockLoadError', () => {
  it('is announced as an alert with a title, reassurance and an illustration', async () => {
    const w = await mountSuspended(LoadError, { props: { title: "We couldn't load your dashboard" } })
    expect(w.attributes('role')).toBe('alert')
    expect(w.text()).toContain("We couldn't load your dashboard")
    expect(w.text()).toContain('Your progress is safe')
    expect(w.find('svg[aria-hidden="true"]').exists()).toBe(true)
  })

  it('shows the server reason only when there is one', async () => {
    expect((await mountSuspended(LoadError)).text()).not.toContain('Reason:')
    expect((await mountSuspended(LoadError, { props: { detail: 'Database unavailable' } })).text()).toContain('Reason: Database unavailable')
  })

  it('emits retry, and disables the button while retrying', async () => {
    const w = await mountSuspended(LoadError)
    await w.find('button').trigger('click')
    expect(w.emitted('retry')).toHaveLength(1)

    const busy = await mountSuspended(LoadError, { props: { retrying: true } })
    expect(busy.find('button').attributes('disabled')).toBeDefined()
  })
})
