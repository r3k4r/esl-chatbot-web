import { describe, expect, it } from 'vitest'
import { joinPhone, splitPhone } from '~/lib/phone'

describe('phone numbers', () => {
  it('splits a saved number into its dial code and the number', () => {
    expect(splitPhone('+964 7501234567')).toEqual({ code: '+964', local: '7501234567' })
    expect(splitPhone('+16841234567')).toEqual({ code: '+1684', local: '1234567' })
  })

  it('keeps the default code for empty or code-less numbers', () => {
    expect(splitPhone(null)).toEqual({ code: '+964', local: '' })
    expect(splitPhone('07501234567')).toEqual({ code: '+964', local: '07501234567' })
  })

  it('joins code and number, dropping spaces and the leading 0', () => {
    expect(joinPhone('+964', '0750 123 4567')).toBe('+964 7501234567')
    expect(joinPhone('+44', '7700 900123')).toBe('+44 7700900123')
    expect(joinPhone('+964', '  ')).toBeNull()
  })
})
