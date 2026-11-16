import { describe, it, expect, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { h } from 'vue'
import { sizeClasses } from '~/common/types/text-types'
import AppButton from '~/components/App/Button.vue'
import AppText from '~/components/App/Text.vue'
import FormError from '~/components/Form/Error.vue'
import FormServerError from '~/components/Form/ServerError.vue'
import SectionHeader from '~/components/Layouts/SectionHeader.vue'

describe('AppButton', () => {
  it('renders a type="button" by default so it never submits forms by accident', async () => {
    const w = await mountSuspended(AppButton, { props: { text: 'Save' } })
    expect(w.element.tagName).toBe('BUTTON')
    expect(w.attributes('type')).toBe('button')
    expect(w.text()).toBe('Save')
  })

  it('respects an explicit submit type', async () => {
    const w = await mountSuspended(AppButton, { props: { text: 'Go' }, attrs: { type: 'submit' } })
    expect(w.attributes('type')).toBe('submit')
  })

  it('renders a link when given `to`', async () => {
    const w = await mountSuspended(AppButton, { props: { to: '/signup', text: 'Start' } })
    expect(w.element.tagName).toBe('A')
    expect(w.attributes('href')).toBe('/signup')
  })

  it('shows a spinner and disables itself while loading', async () => {
    const w = await mountSuspended(AppButton, { props: { text: 'Save', loading: true } })
    expect(w.attributes('disabled')).toBeDefined()
    expect(w.text()).not.toContain('Save')
  })

  it('applies the variant, size and radius classes, letting classList win', async () => {
    const w = await mountSuspended(AppButton, { props: { variant: 'ink', size: '52', radius: '12', classList: 'px-9' } })
    const cls = w.classes()
    expect(cls).toEqual(expect.arrayContaining(['bg-brand-ink', 'h-[52px]', 'rounded-xl', 'px-9']))
    expect(cls).not.toContain('px-5')
  })

  it('forwards click listeners to the element', async () => {
    const onClick = vi.fn()
    const w = await mountSuspended(AppButton, { props: { text: 'Hi' }, attrs: { onClick } })
    await w.trigger('click')
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('disables the element when `disabled` is set, and blocks clicks', async () => {
    const onClick = vi.fn()
    const w = await mountSuspended(AppButton, { props: { text: 'Next', disabled: true }, attrs: { onClick } })
    expect(w.attributes('disabled')).toBeDefined()
    await w.trigger('click')
    expect(onClick).not.toHaveBeenCalled()
  })

  it('renders no disabled attribute when enabled', async () => {
    const w = await mountSuspended(AppButton, { props: { text: 'Next', disabled: false } })
    expect(w.attributes('disabled')).toBeUndefined()
  })

  it('a disabled link becomes a disabled button (links cannot be disabled)', async () => {
    const w = await mountSuspended(AppButton, { props: { to: '/dashboard/billing', text: 'Upgrade', disabled: true } })
    expect(w.element.tagName).toBe('BUTTON')
    expect(w.attributes('disabled')).toBeDefined()
    expect(w.attributes('href')).toBeUndefined()
  })

  it('external URLs stay external links instead of becoming app routes', async () => {
    const w = await mountSuspended(AppButton, { props: { to: 'https://fib.iq/pay/abc', text: 'Open FIB' } })
    expect(w.element.tagName).toBe('A')
    expect(w.attributes('href')).toBe('https://fib.iq/pay/abc')
  })
})

describe('AppText', () => {
  it('maps size, weight and colour props to classes', async () => {
    const w = await mountSuspended(AppText, { props: { size: '24', weight: 'semibold', color: 'brand-ink' }, slots: { default: () => 'Hello' } })
    expect(w.text()).toBe('Hello')
    expect(w.classes()).toEqual(expect.arrayContaining([...sizeClasses['24'].split(' '), 'font-semibold', 'text-brand-ink']))
  })

  it('lets classList override the size', async () => {
    const w = await mountSuspended(AppText, { props: { size: '14', classList: 'text-[18px]' }, slots: { default: () => 'x' } })
    expect(w.classes()).toContain('text-[18px]')
    expect(w.classes()).not.toContain('text-[14px]')
  })
})

describe('FormError / FormServerError', () => {
  it('render nothing without an error', async () => {
    expect((await mountSuspended(FormError)).text()).toBe('')
    expect((await mountSuspended(FormServerError)).text()).toBe('')
  })

  it('render the message when present', async () => {
    expect((await mountSuspended(FormError, { props: { error: 'Required' } })).text()).toBe('Required')
    expect((await mountSuspended(FormServerError, { props: { error: 'Invalid credentials' } })).text()).toContain('Invalid credentials')
  })
})

describe('LayoutsSectionHeader', () => {
  it('renders eyebrow, title and optional description', async () => {
    const w = await mountSuspended(SectionHeader, { props: { eyebrow: 'Pricing', title: 'Plans', description: 'Pick one' } })
    expect(w.text()).toContain('Pricing')
    expect(w.text()).toContain('Plans')
    expect(w.text()).toContain('Pick one')
  })

  it('renders the action slot only when provided', async () => {
    const without = await mountSuspended(SectionHeader, { props: { eyebrow: 'E', title: 'T' } })
    expect(without.html()).not.toContain('data-action')
    const withAction = await mountSuspended(SectionHeader, {
      props: { eyebrow: 'E', title: 'T' },
      slots: { action: () => h('span', { 'data-action': '' }, 'More') },
    })
    expect(withAction.find('[data-action]').exists()).toBe(true)
  })
})
