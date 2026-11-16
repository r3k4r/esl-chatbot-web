import { test, expect, visit, USERS } from '../support/fixtures'
import { PASSWORD } from '../../fixtures/api'
import type { Page } from '@playwright/test'

/** Types a code into the 6-box OTP input. */
async function typeOtp(page: Page, code: string) {
  const boxes = page.locator('input[inputmode="numeric"][maxlength="1"]')
  await expect(boxes).toHaveCount(6)
  await boxes.first().click()
  await page.keyboard.type(code)
}

test.describe('Sign in', () => {
  test.beforeEach(async ({ page }) => visit(page, '/signin'))

  test('shows inline errors for empty fields and does not call the API', async ({ page }) => {
    let calls = 0
    page.on('request', (r) => { if (r.url().includes('/auth/login')) calls++ })
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page.getByText('Username is required')).toBeVisible()
    await expect(page.getByText('Password is required')).toBeVisible()
    expect(calls).toBe(0)
  })

  test('clears an inline error as soon as the field is fixed', async ({ page }) => {
    await page.getByRole('button', { name: 'Sign in' }).click()
    await page.getByLabel('Username').fill('student_ali')
    await expect(page.getByText('Username is required')).toBeHidden()
    await expect(page.getByText('Password is required')).toBeVisible()
  })

  test('shows the server message for wrong credentials', async ({ page }) => {
    await page.getByLabel('Username').fill('student_ali')
    await page.locator('#password').fill('wrong-password')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page.getByText('Invalid username or password').first()).toBeVisible()
    await expect(page).toHaveURL(/\/signin$/)
  })

  test('when rate-limited, shows the server message and locks the button until Retry-After passes', async ({ page, mockApi }) => {
    await mockApi('POST', '/auth/login', {
      status: 429,
      headers: { 'Retry-After': '3' },
      body: { success: false, message: 'Too many sign-in attempts. Please try again in 3 seconds.', data: null, retryAfter: 3 },
    })
    await page.getByLabel('Username').fill('student_ali')
    await page.locator('#password').fill('password123')
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(page.getByText('Too many sign-in attempts. Please try again in 3 seconds.').first()).toBeVisible()
    const locked = page.getByRole('button', { name: /^Try again in 0:0\d$/ })
    await expect(locked).toBeDisabled()
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeEnabled({ timeout: 6_000 })
  })

  test('toggles password visibility', async ({ page }) => {
    const pw = page.locator('#password')
    await pw.fill('secret')
    await expect(pw).toHaveAttribute('type', 'password')
    await page.getByRole('button', { name: 'Toggle Password Visibility' }).click()
    await expect(pw).toHaveAttribute('type', 'text')
  })

  for (const persona of ['student', 'tutor', 'admin'] as const) {
    test(`signs a ${persona} in and lands on the dashboard`, async ({ page, context }) => {
      await page.getByLabel('Username').fill(USERS[persona].username)
      await page.locator('#password').fill(PASSWORD)
      await page.getByRole('button', { name: 'Sign in' }).click()
      await expect(page).toHaveURL(/\/dashboard$/)
      const cookies = await context.cookies()
      expect(cookies.find((c) => c.name === 'accessToken')?.value).toBe(`e2e-${persona}`)
      expect(cookies.find((c) => c.name === 'accessToken')?.httpOnly).toBe(true)
    })
  }

  test('links to sign up and forgot password', async ({ page }) => {
    await page.getByRole('link', { name: 'Forgot password?' }).click()
    await expect(page).toHaveURL(/\/forgot-password$/)
    await visit(page, '/signin')
    await page.getByRole('link', { name: 'Create one' }).click()
    await expect(page).toHaveURL(/\/signup$/)
  })
})

test.describe('Sign up', () => {
  test.beforeEach(async ({ page }) => visit(page, '/signup'))

  async function fillValid(page: Page, username = 'brand_new') {
    await page.getByLabel('Display name').fill('New Learner')
    await page.getByLabel('Username').fill(username)
    await page.getByLabel('Email').fill('new@tutelage.test')
    await page.locator('#password').fill('password123')
    await page.locator('#confirmPassword').fill('password123')
  }

  test('validates every field before submitting', async ({ page }) => {
    await page.getByLabel('Username').fill('a b')
    // Passes the browser's type="email" check (so the form submits) but not zod's.
    await page.getByLabel('Email').fill('nope@x')
    await page.locator('#password').fill('short')
    await page.locator('#confirmPassword').fill('different')
    await page.getByRole('button', { name: 'Create account' }).click()

    await expect(page.getByText('Display Name is required')).toBeVisible()
    await expect(page.getByText('Username can only contain letters, numbers, and underscores')).toBeVisible()
    await expect(page.getByText('Invalid email address')).toBeVisible()
    await expect(page.getByText('Password must be at least 8 characters long')).toBeVisible()
    await expect(page.getByText('You must accept the Terms of Service to create an account')).toBeVisible()
  })

  // zod runs the cross-field refine only once every field is individually valid.
  test('flags mismatched passwords once everything else is valid', async ({ page }) => {
    await fillValid(page)
    await page.locator('#confirmPassword').fill('password124')
    await page.locator('#acceptAgreement').click()
    await page.getByRole('button', { name: 'Create account' }).click()
    await expect(page.getByText('Passwords do not match')).toBeVisible()
    await expect(page).toHaveURL(/\/signup$/)
  })

  test('opens the Terms of Service from the checkbox label', async ({ page }) => {
    await page.getByRole('button', { name: 'Terms of Service' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('dialog')).toContainText('Terms of Service (test copy)')
  })

  test('reports a taken username from the server', async ({ page }) => {
    await fillValid(page, 'student_ali')
    await page.locator('#acceptAgreement').click()
    await page.getByRole('button', { name: 'Create account' }).click()
    await expect(page.getByText('Username is already taken')).toBeVisible()
  })

  test('creates the account and continues to email verification', async ({ page }) => {
    await fillValid(page)
    await page.locator('#acceptAgreement').click()
    await page.getByRole('button', { name: 'Create account' }).click()
    await expect(page).toHaveURL(/\/verify-email$/)
    expect(await page.evaluate(() => sessionStorage.getItem('pendingEmail'))).toBe('new@tutelage.test')
  })
})

test.describe('Email verification', () => {
  test('rejects a wrong code, then accepts the right one and signs in', async ({ page }) => {
    await page.addInitScript(() => sessionStorage.setItem('pendingEmail', 'new@tutelage.test'))
    await visit(page, '/verify-email')

    await typeOtp(page, '000000')
    await page.getByRole('button', { name: 'Verify email' }).click()
    await expect(page.getByText('Invalid or expired verification code')).toBeVisible()

    await page.reload()
    await page.waitForLoadState('networkidle')
    await typeOtp(page, '123456')
    await page.getByRole('button', { name: 'Verify email' }).click()
    await expect(page.getByText('All Done')).toBeVisible()
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 10_000 })
  })
})

test.describe('Password reset', () => {
  test('walks forgot → code → new password → sign in', async ({ page }) => {
    await visit(page, '/forgot-password')
    await page.getByLabel('Email').fill('ali@tutelage.test')
    await page.getByRole('button', { name: 'Send reset code' }).click()

    await expect(page).toHaveURL(/\/verify-otp$/)
    await expect(page.getByText(/We sent a 6-digit code to/)).toBeVisible()
    await typeOtp(page, '123456')
    await page.getByRole('button', { name: 'Verify code' }).click()

    await expect(page).toHaveURL(/\/reset-password$/)
    await page.getByLabel('New password').fill('newpassword1')
    await page.locator('#confirmPassword').fill('newpassword1')
    await page.getByRole('button', { name: 'Reset password' }).click()
    await expect(page).toHaveURL(/\/signin$/, { timeout: 10_000 })
  })

  test('requires a valid email to send a code', async ({ page }) => {
    let calls = 0
    page.on('request', (r) => { if (r.url().includes('/auth/forgot-password')) calls++ })
    await visit(page, '/forgot-password')
    const email = page.getByLabel('Email')
    await email.fill('not-an-email')
    await page.getByRole('button', { name: 'Send reset code' }).click()
    // type="email" lets the browser block the submit before the zod check runs.
    expect(await email.evaluate((el: HTMLInputElement) => el.validity.valid)).toBe(false)
    await expect(page).toHaveURL(/\/forgot-password$/)
    expect(calls).toBe(0)
  })
})

test.describe('Route guards', () => {
  for (const path of ['/dashboard', '/dashboard/chat', '/dashboard/vocab', '/dashboard/classes', '/dashboard/users']) {
    test(`guests are sent from ${path} to sign in`, async ({ page }) => {
      await page.goto(path)
      await expect(page).toHaveURL(/\/signin$/)
    })
  }

  for (const path of ['/signin', '/signup', '/forgot-password']) {
    test(`signed-in users are sent from ${path} to the dashboard`, async ({ page, loginAs }) => {
      await loginAs('student')
      await page.goto(path)
      await expect(page).toHaveURL(/\/dashboard$/)
    })
  }

  for (const persona of ['student', 'tutor'] as const) {
    test(`${persona} cannot open admin user management`, async ({ page, loginAs }) => {
      await loginAs(persona)
      await page.goto('/dashboard/users')
      await expect(page).toHaveURL(/\/dashboard$/)
    })
  }

  test('admin can open user management', async ({ page, loginAs }) => {
    await loginAs('admin')
    await page.goto('/dashboard/users')
    await expect(page).toHaveURL(/\/dashboard\/users$/)
  })

  // Regression: SSR used to lose the Nuxt context after an await and never refresh,
  // signing users out on any reload once the access token had expired.
  test('an expired access token is refreshed silently on a full page load', async ({ page, context, baseURL }) => {
    await context.addCookies([
      { name: 'accessToken', value: 'expired-token', url: baseURL! },
      { name: 'refreshToken', value: 'e2e-refresh-student', url: baseURL! },
    ])
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/dashboard$/)
    // SSR wrote the new access token to the cookie and the browser picked it up.
    expect((await context.cookies()).find((c) => c.name === 'accessToken')?.value).toBe('e2e-student')
    await expect.poll(() => page.evaluate(() => localStorage.getItem('accessToken'))).toBe('e2e-student')
  })

  test('the browser refreshes the access token shortly before it expires', async ({ page, loginAs }) => {
    await loginAs('student')
    // Access token "expires" in 62s → the session plugin refreshes ~60s early, i.e. now.
    await page.addInitScript(() => {
      localStorage.setItem('accessTokenExpiresAt', new Date(Date.now() + 62_000).toISOString())
      localStorage.setItem('refreshTokenExpiresAt', new Date(Date.now() + 3_600_000).toISOString())
    })
    const refreshed = page.waitForRequest((r) => r.url().endsWith('/auth/refresh') && r.method() === 'POST', { timeout: 10_000 })
    await visit(page, '/dashboard')
    expect((await refreshed).postDataJSON()).toEqual({ refreshToken: 'e2e-refresh-student' })
    // The new expiry (20 min ahead) replaces the near one.
    await expect.poll(async () => {
      const at = await page.evaluate(() => localStorage.getItem('accessTokenExpiresAt'))
      return Date.parse(at!) - Date.now()
    }).toBeGreaterThan(15 * 60_000)
    await expect(page).toHaveURL(/\/dashboard$/)
  })

  test('a rejected refresh token signs the user out to the sign-in page', async ({ page, context, baseURL }) => {
    await context.addCookies([
      { name: 'accessToken', value: 'e2e-student', url: baseURL! },
      { name: 'refreshToken', value: 'revoked-refresh', url: baseURL! },
    ])
    await page.addInitScript(() => {
      localStorage.setItem('accessToken', 'e2e-student')
      localStorage.setItem('refreshToken', 'revoked-refresh')
      localStorage.setItem('accessTokenExpiresAt', new Date(Date.now() + 61_000).toISOString())
    })
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/signin$/, { timeout: 15_000 })
    expect(await page.evaluate(() => localStorage.getItem('refreshToken'))).toBeNull()
  })

  test('signing out ends the session', async ({ page, loginAs }) => {
    await loginAs('student')
    await visit(page, '/dashboard')
    await page.evaluate(async () => {
      type Pinia = { _s: Map<string, { signOut: () => Promise<void> }> }
      const app = (document.querySelector('#__nuxt') as unknown as { __vue_app__: { config: { globalProperties: { $pinia: Pinia } } } }).__vue_app__
      await app.config.globalProperties.$pinia._s.get('useAuthStore')!.signOut()
    })
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/signin$/)
  })
})
