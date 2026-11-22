import { describe, it, expect } from 'vitest'
import {
  signInSchema,
  signUpSchema,
  forgotPasswordSchema,
  verifyOtpSchema,
  resetPasswordSchema,
  setPasswordSchema,
  verifyEmailSchema,
  googleUsernameSchema,
} from '~/common/schemas/AuthSchema'

/**
 * The error <Form> shows for `field` — the LAST failing rule (Form.vue overwrites per field) —
 * or undefined when the field is valid. Messages are i18n keys, translated by <FormError>.
 */
function errorFor(result: { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } }, field: string) {
  return result.error?.issues.filter((i) => i.path[0] === field).at(-1)?.message
}
const V = 'auth.validation.'

const validSignUp = {
  username: 'student_ali',
  email: 'ali@tutelage.com',
  password: 'password123',
  confirmPassword: 'password123',
  displayName: 'Ali',
  acceptAgreement: true as const,
}

describe('signInSchema', () => {
  it('accepts a username and password', () => {
    expect(signInSchema.safeParse({ username: 'ali', password: 'x' }).success).toBe(true)
  })

  it('requires both fields', () => {
    const r = signInSchema.safeParse({ username: '', password: '' })
    expect(errorFor(r, 'username')).toBe(`${V}usernameRequired`)
    expect(errorFor(r, 'password')).toBe(`${V}passwordRequired`)
  })
})

describe('signUpSchema', () => {
  it('accepts a complete, consistent registration', () => {
    expect(signUpSchema.safeParse(validSignUp).success).toBe(true)
  })

  it.each([
    ['ab', `${V}usernameMin`],
    ['a'.repeat(31), `${V}usernameMax`],
    ['has space', `${V}usernameChars`],
    ['dash-name', `${V}usernameChars`],
    // ISS-010: an empty field says "required", not the character rule
    ['', `${V}usernameRequired`],
  ])('rejects username %j', (username, message) => {
    expect(errorFor(signUpSchema.safeParse({ ...validSignUp, username }), 'username')).toBe(message)
  })

  it('accepts usernames at the 3 and 30 character bounds', () => {
    expect(signUpSchema.safeParse({ ...validSignUp, username: 'abc' }).success).toBe(true)
    expect(signUpSchema.safeParse({ ...validSignUp, username: 'a'.repeat(30) }).success).toBe(true)
  })

  it('rejects an invalid email', () => {
    expect(errorFor(signUpSchema.safeParse({ ...validSignUp, email: 'not-an-email' }), 'email')).toBe(`${V}emailInvalid`)
  })

  it('requires an 8+ character password', () => {
    const r = signUpSchema.safeParse({ ...validSignUp, password: 'short', confirmPassword: 'short' })
    expect(errorFor(r, 'password')).toBe(`${V}passwordMin`)
  })

  it('reports mismatched passwords on confirmPassword', () => {
    const r = signUpSchema.safeParse({ ...validSignUp, confirmPassword: 'password124' })
    expect(r.success).toBe(false)
    expect(errorFor(r, 'confirmPassword')).toBe(`${V}passwordsMatch`)
  })

  it('requires the terms to be accepted', () => {
    const r = signUpSchema.safeParse({ ...validSignUp, acceptAgreement: false })
    expect(errorFor(r, 'acceptAgreement')).toBe(`${V}termsRequired`)
  })

  it('bounds the display name', () => {
    expect(errorFor(signUpSchema.safeParse({ ...validSignUp, displayName: '' }), 'displayName')).toBe(`${V}displayNameRequired`)
    // ISS-008: spaces only is no name
    expect(errorFor(signUpSchema.safeParse({ ...validSignUp, displayName: '   ' }), 'displayName')).toBe(`${V}displayNameRequired`)
    expect(errorFor(signUpSchema.safeParse({ ...validSignUp, displayName: 'x'.repeat(101) }), 'displayName'))
      .toBe(`${V}displayNameMax`)
  })
})

describe('forgotPasswordSchema', () => {
  it('needs a valid email', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'ali@tutelage.com' }).success).toBe(true)
    expect(forgotPasswordSchema.safeParse({ email: 'nope' }).success).toBe(false)
  })
})

describe.each([
  ['verifyOtpSchema', verifyOtpSchema],
  ['verifyEmailSchema', verifyEmailSchema],
])('%s', (_name, schema) => {
  it('accepts a 6-digit numeric code', () => {
    expect(schema.safeParse({ email: 'ali@tutelage.com', otp: '123456' }).success).toBe(true)
  })

  it.each(['12345', '1234567', '12a456', '      '])('rejects otp %j', (otp) => {
    expect(schema.safeParse({ email: 'ali@tutelage.com', otp }).success).toBe(false)
  })
})

describe('resetPasswordSchema', () => {
  const base = { email: 'ali@tutelage.com', otp: '123456', newPassword: 'newpassword', confirmPassword: 'newpassword' }

  it('accepts matching new passwords', () => {
    expect(resetPasswordSchema.safeParse(base).success).toBe(true)
  })

  it('rejects mismatched passwords', () => {
    const r = resetPasswordSchema.safeParse({ ...base, confirmPassword: 'different1' })
    expect(errorFor(r, 'confirmPassword')).toBe(`${V}passwordsMatch`)
  })
})

describe('setPasswordSchema', () => {
  it('enforces length and match', () => {
    expect(setPasswordSchema.safeParse({ newPassword: 'abcdefgh', confirmPassword: 'abcdefgh' }).success).toBe(true)
    expect(setPasswordSchema.safeParse({ newPassword: 'abc', confirmPassword: 'abc' }).success).toBe(false)
    expect(setPasswordSchema.safeParse({ newPassword: 'abcdefgh', confirmPassword: 'abcdefgx' }).success).toBe(false)
  })
})

describe('googleUsernameSchema', () => {
  it('validates username rules and agreement', () => {
    expect(googleUsernameSchema.safeParse({ username: 'new_user', acceptAgreement: true }).success).toBe(true)
    expect(googleUsernameSchema.safeParse({ username: 'new user', acceptAgreement: true }).success).toBe(false)
    expect(googleUsernameSchema.safeParse({ username: 'new_user', acceptAgreement: false }).success).toBe(false)
  })
})
