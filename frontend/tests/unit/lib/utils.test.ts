import { describe, it, expect } from 'vitest'
import { cn, stripHtml } from '~/lib/utils'

describe('cn', () => {
  it('lets later Tailwind classes win', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
  })

  it('drops falsy values and supports conditional objects', () => {
    expect(cn('a', false && 'b', null, undefined, { c: true, d: false })).toBe('a c')
  })
})

describe('stripHtml', () => {
  it('removes tags and collapses whitespace', () => {
    expect(stripHtml('<p>Hello <strong>world</strong></p>\n\n<p>again</p>')).toBe('Hello world again')
  })

  it('decodes the entities sanitized AI replies contain', () => {
    expect(stripHtml('Tom &amp; Jerry &lt;3 &quot;hi&quot; it&#39;s &apos;ok&apos;&nbsp;now')).toBe(`Tom & Jerry <3 "hi" it's 'ok' now`)
  })

  it('returns an empty string for markup-only input', () => {
    expect(stripHtml('<br/><hr>')).toBe('')
  })
})
