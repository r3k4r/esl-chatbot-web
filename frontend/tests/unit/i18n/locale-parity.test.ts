import { describe, it, expect } from 'vitest'
import en from '../../../i18n/locales/en.json'
import ku from '../../../i18n/locales/ku.json'

type Json = string | number | boolean | null | Json[] | { [k: string]: Json }

/** Every leaf path, with arrays recorded by length so list items stay in step. */
function shape(value: Json, prefix = ''): string[] {
  if (Array.isArray(value)) return [`${prefix}[${value.length}]`]
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([k, v]) => shape(v, prefix ? `${prefix}.${k}` : k))
  }
  return [prefix]
}

describe('locale parity (en ↔ ku)', () => {
  const enShape = shape(en as Json)
  const kuShape = shape(ku as Json)

  it('has no keys missing from Kurdish', () => {
    expect(enShape.filter((k) => !kuShape.includes(k))).toEqual([])
  })

  it('has no keys missing from English', () => {
    expect(kuShape.filter((k) => !enShape.includes(k))).toEqual([])
  })

  it('has no empty translations', () => {
    const empty: string[] = []
    const walk = (v: Json, path: string) => {
      if (typeof v === 'string') { if (!v.trim()) empty.push(path); return }
      if (Array.isArray(v)) return v.forEach((x, i) => walk(x, `${path}[${i}]`))
      if (v && typeof v === 'object') Object.entries(v).forEach(([k, x]) => walk(x, `${path}.${k}`))
    }
    walk(en as Json, 'en')
    walk(ku as Json, 'ku')
    expect(empty).toEqual([])
  })
})
