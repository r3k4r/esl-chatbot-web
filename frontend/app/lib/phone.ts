import countryCodes from '~/common/data/country-code'

export const DEFAULT_DIAL_CODE = '+964'

// Dial codes longest first, so "+1684" (American Samoa) wins over "+1".
const DIAL_CODES = [...new Set(countryCodes.map((c) => c.dial_code))].sort((a, b) => b.length - a.length)

/** "+964 7501234567" → { code: "+964", local: "7501234567" }. A number saved without a code keeps the default code. */
export function splitPhone(full: string | null | undefined): { code: string; local: string } {
  const value = (full ?? '').trim()
  if (!value.startsWith('+')) return { code: DEFAULT_DIAL_CODE, local: value }
  const compact = value.replace(/\s+/g, '')
  const code = DIAL_CODES.find((c) => compact.startsWith(c))
  return code ? { code, local: compact.slice(code.length) } : { code: DEFAULT_DIAL_CODE, local: value }
}

/**
 * { "+964", "0750 123 4567" } → "+964 7501234567"; empty number → null (no phone).
 * The trunk 0 is dropped, as it is when dialling from abroad.
 * shortcut: a few countries (Italy) keep that 0 after the code; handle per country if they become users.
 */
export function joinPhone(code: string, local: string): string | null {
  const digits = local.replace(/\D/g, '').replace(/^0/, '')
  return digits ? `${code} ${digits}` : null
}
