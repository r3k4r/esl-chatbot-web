import { describe, expect, it } from 'vitest'
import { parseWords } from '~/composables/useAssignWordsPage'

describe('parseWords', () => {
  it('splits on new lines, commas and semicolons, and tidies spaces', () => {
    expect(parseWords('borrow, kitchen\n  get   up ;although\n\n')).toEqual(['borrow', 'kitchen', 'get up', 'although'])
  })

  it('keeps one card per word, whatever the case', () => {
    expect(parseWords('Kitchen\nkitchen\nKITCHEN')).toEqual(['Kitchen'])
  })

  it('drops entries longer than a word can be', () => {
    expect(parseWords(`ok\n${'x'.repeat(101)}`)).toEqual(['ok'])
  })
})
