import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h, reactive, nextTick } from 'vue'
import zod from 'zod'
import FormForm from '~/components/Form/Form.vue'
import FormInput from '~/components/Form/Input.vue'

const schema = zod.object({
  email: zod.string().email('Invalid email'),
  tags: zod.array(zod.object({ name: zod.string().min(1, 'Tag name required') })),
})

/** Wraps Form with reactive data and prints the slot's errors as JSON. */
function harness(initial: { email: string; tags: { name: string }[] }) {
  const data = reactive(initial)
  const Host = defineComponent({
    setup: (_, { expose }) => {
      expose({ data })
      return () => h(FormForm, { schema, formData: data, onSubmit: () => {} }, {
        default: ({ errors }: { errors: unknown }) => h('pre', { 'data-errors': '' }, JSON.stringify(errors)),
      })
    },
  })
  return { data, Host }
}

const errorsOf = (w: Awaited<ReturnType<typeof mountSuspended>>) => JSON.parse(w.find('[data-errors]').text())

describe('FormForm', () => {
  it('blocks submit and maps flat and nested errors', async () => {
    const { Host } = harness({ email: 'bad', tags: [{ name: 'ok' }, { name: '' }] })
    const w = await mountSuspended(Host)

    await w.find('form').trigger('submit')

    expect(w.findComponent(FormForm).emitted('submit')).toBeUndefined()
    // Index 0 is valid, so it is a hole in the errors array (null once serialised).
    expect(errorsOf(w)).toEqual({ email: 'Invalid email', tags: [null, { name: 'Tag name required' }] })
  })

  it('emits submit when the data is valid', async () => {
    const { Host } = harness({ email: 'a@b.co', tags: [] })
    const w = await mountSuspended(Host)
    await w.find('form').trigger('submit')
    expect(w.findComponent(FormForm).emitted('submit')).toHaveLength(1)
    expect(errorsOf(w)).toEqual({})
  })

  it('does not show errors before the first submit', async () => {
    const { Host, data } = harness({ email: 'a@b.co', tags: [] })
    const w = await mountSuspended(Host)
    data.email = 'broken'
    await nextTick()
    expect(errorsOf(w)).toEqual({})
  })

  it('re-validates live after a failed submit so fixed fields clear', async () => {
    const { Host, data } = harness({ email: 'bad', tags: [] })
    const w = await mountSuspended(Host)
    await w.find('form').trigger('submit')
    expect(errorsOf(w).email).toBe('Invalid email')

    data.email = 'fixed@b.co'
    await nextTick()
    await nextTick()
    expect(errorsOf(w)).toEqual({})
  })
})

describe('FormInput', () => {
  it('links the label to the input and shows the error', async () => {
    const w = await mountSuspended(FormInput, { props: { id: 'email', label: 'Email', error: 'Required' } })
    expect(w.find('label').attributes('for')).toBe('email')
    expect(w.find('input').attributes('id')).toBe('email')
    expect(w.text()).toContain('Required')
  })

  it('updates v-model on input', async () => {
    const w = await mountSuspended(FormInput, { props: { id: 'name', modelValue: '' } })
    await w.find('input').setValue('Ali')
    expect(w.emitted('update:modelValue')?.at(-1)).toEqual(['Ali'])
  })

  it.each([
    ['numbers', 'a1b2c3', '123'],
    ['letters', 'a1b2c3', 'abc'],
    ['alphanumeric', 'a-1 b_2!', 'a1b2'],
  ] as const)('acceptOnly=%s strips other characters', async (acceptOnly, typed, kept) => {
    const w = await mountSuspended(FormInput, { props: { id: 'f', modelValue: '', acceptOnly } })
    await w.find('input').setValue(typed)
    expect(w.emitted('update:modelValue')?.at(-1)).toEqual([kept])
  })

  it('toggles password visibility', async () => {
    const w = await mountSuspended(FormInput, { props: { id: 'pw', type: 'password' } })
    expect(w.find('input').attributes('type')).toBe('password')
    await w.find('[aria-label="Toggle Password Visibility"]').trigger('click')
    expect(w.find('input').attributes('type')).toBe('text')
  })
})
