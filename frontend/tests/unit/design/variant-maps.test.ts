import { describe, it, expect } from 'vitest'
import { variantClasses, activeClasses, buttonSizeClasses, buttonRadiusClasses } from '~/common/types/button-types'
import { sizeClasses, colorClasses, weightClasses } from '~/common/types/text-types'

// Every variant/size must resolve to classes; a missing key silently renders an unstyled control.
describe('button design maps', () => {
  it('every variant has an active state', () => {
    expect(Object.keys(activeClasses).sort()).toEqual(Object.keys(variantClasses).sort())
  })

  it('every variant is disabled-aware', () => {
    for (const [variant, classes] of Object.entries(variantClasses)) {
      expect(classes, variant).toContain('disabled:cursor-not-allowed')
    }
  })

  it('primary-coloured variants use white text (brand rule)', () => {
    expect(variantClasses.primary).toContain('text-neutral-50')
    expect(variantClasses.ink).toContain('text-neutral-50')
  })

  it('every size and radius maps to a non-empty class', () => {
    for (const c of [...Object.values(buttonSizeClasses), ...Object.values(buttonRadiusClasses)]) {
      expect(c.trim()).not.toBe('')
    }
  })
})

describe('text design maps', () => {
  it('every size, weight and colour maps to a class', () => {
    for (const c of [...Object.values(sizeClasses), ...Object.values(weightClasses), ...Object.values(colorClasses)]) {
      expect(c.trim()).not.toBe('')
    }
  })
})
