import { test, expect, visit } from '../support/fixtures'

test.describe('admin: user management', () => {
  test.beforeEach(async ({ loginAs }) => loginAs('admin'))

  test('lists every account', async ({ page }) => {
    await visit(page, '/dashboard/users')
    await expect(page.getByRole('heading', { name: 'Users', level: 1 })).toBeVisible()
    for (const name of ['Ali Hassan', 'Yuki Tanaka', 'Sarah Miller']) await expect(page.getByText(name).first()).toBeVisible()
  })

  test('searches by name (server-side)', async ({ page }) => {
    await visit(page, '/dashboard/users')
    const searched = page.waitForRequest((r) => r.url().includes('/users?') && r.url().includes('search=yuki'))
    await page.getByPlaceholder('Search name, email, username…').fill('yuki')
    await searched
    await expect(page.getByText('Ali Hassan')).toHaveCount(0)
    await expect(page.getByText('Yuki Tanaka').first()).toBeVisible()
  })

  test('shows an empty state when nothing matches', async ({ page }) => {
    await visit(page, '/dashboard/users')
    await page.getByPlaceholder('Search name, email, username…').fill('zzzz-nobody')
    await expect(page.getByText('No users found')).toBeVisible()
  })

  test('opens a user from the list', async ({ page }) => {
    await visit(page, '/dashboard/users')
    await page.getByText('Yuki Tanaka').first().click()
    await expect(page).toHaveURL(/\/dashboard\/users\/u-free$/)
  })
})

test.describe('profile', () => {
  test('a student edits their display name', async ({ page, loginAs }) => {
    await loginAs('student')
    await visit(page, '/dashboard/profile')
    await page.getByRole('button', { name: 'Edit profile' }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('Display name').fill('Ali H.')
    const saved = page.waitForRequest((r) => r.url().endsWith('/users/me') && r.method() === 'PATCH')
    await dialog.getByRole('button', { name: 'Save changes' }).click()
    expect((await saved).postDataJSON()).toMatchObject({ displayName: 'Ali H.' })
  })

  for (const persona of ['tutor', 'admin'] as const) {
    test(`${persona} profile shows their role instead of a plan`, async ({ page, loginAs }) => {
      await loginAs(persona)
      await visit(page, '/dashboard/profile')
      await expect(page.getByText(persona === 'tutor' ? /tutor/i : /admin/i).first()).toBeVisible()
    })
  }
})

test.describe('command palette (⌘K)', () => {
  test('finds content and opens it', async ({ page, loginAs }) => {
    await loginAs('student')
    await visit(page, '/dashboard')
    await page.keyboard.press('Control+k')
    const input = page.getByPlaceholder('Search users, classes, vocabulary…')
    await expect(input).toBeFocused()
    const searched = page.waitForRequest((r) => r.url().includes('/search?q=resi'))
    await input.fill('resi')
    await searched
    await expect(page.getByText('resilient').last()).toBeVisible()
    await input.press('Enter')
    await expect(page).not.toHaveURL(/\/dashboard$/)
  })

  test('does not search for a single character', async ({ page, loginAs }) => {
    await loginAs('student')
    await visit(page, '/dashboard')
    let searches = 0
    page.on('request', (r) => { if (r.url().includes('/search?q=')) searches++ })
    await page.keyboard.press('Control+k')
    await page.getByPlaceholder('Search users, classes, vocabulary…').fill('r')
    await page.waitForTimeout(600)
    expect(searches).toBe(0)
  })
})

test.describe('billing', () => {
  test('a paid student sees the FIB billing page', async ({ page, loginAs }) => {
    await loginAs('student')
    await visit(page, '/dashboard/billing')
    await expect(page.getByText('Paying with FIB')).toBeVisible()
  })

  test('a FREE student can pick a paid plan', async ({ page, loginAs }) => {
    await loginAs('free')
    await visit(page, '/dashboard/billing?plan=GOLD')
    await expect(page.getByText(/Gold/i).first()).toBeVisible()
    await expect(page.getByText(/Premium/i).first()).toBeVisible()
  })
})
