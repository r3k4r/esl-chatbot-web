import { test, expect, visit, type Persona } from '../support/fixtures'
import type { Page } from '@playwright/test'

const sidebar = (page: Page) => page.locator('aside nav')
// The accessible name may carry a count badge ("Vocabulary 2"), so allow trailing digits.
const navLink = (page: Page, name: string) => sidebar(page).getByRole('link', { name: new RegExp(`^${name}(\\s*\\d+)?$`) })

/** Which sidebar entries each role must (and must not) see — the UI half of role gating. */
const NAV: Record<Persona, { shown: string[]; hidden: string[] }> = {
  student: { shown: ['Dashboard', 'AI Chat', 'Voice Lab', 'Vocabulary', 'Goals', 'Classes', 'Billing'], hidden: ['Users'] },
  free: { shown: ['Dashboard', 'AI Chat', 'Billing'], hidden: ['Users'] },
  tutor: { shown: ['Dashboard', 'Classes'], hidden: ['AI Chat', 'Voice Lab', 'Vocabulary', 'Goals', 'Billing', 'Users'] },
  admin: { shown: ['Dashboard', 'Classes', 'Users'], hidden: ['AI Chat', 'Voice Lab', 'Vocabulary', 'Goals', 'Billing'] },
}

for (const persona of Object.keys(NAV) as Persona[]) {
  test(`${persona}: sidebar shows exactly the right sections`, async ({ page, loginAs }) => {
    await loginAs(persona)
    await visit(page, '/dashboard')
    for (const name of NAV[persona].shown) await expect(navLink(page, name), name).toBeVisible()
    for (const name of NAV[persona].hidden) await expect(navLink(page, name), name).toHaveCount(0)
  })
}

test('only FREE students see the upgrade card', async ({ page, loginAs }) => {
  await loginAs('free')
  await visit(page, '/dashboard')
  await expect(page.getByRole('link', { name: /Upgrade now/ })).toBeVisible()
})

test('paid students and staff do not see the upgrade card', async ({ browser }) => {
  for (const persona of ['student', 'tutor', 'admin'] as const) {
    const context = await browser.newContext({ baseURL: test.info().project.use.baseURL })
    const page = await context.newPage()
    await context.addCookies([{ name: 'accessToken', value: `e2e-${persona}`, url: test.info().project.use.baseURL! }])
    await page.addInitScript((t) => localStorage.setItem('accessToken', t), `e2e-${persona}`)
    await visit(page, '/dashboard')
    await expect(page.getByRole('link', { name: /Upgrade now/ }), persona).toHaveCount(0)
    await context.close()
  }
})

test.describe('role dashboards', () => {
  test('student sees the learning overview', async ({ page, loginAs }) => {
    await loginAs('student')
    await visit(page, '/dashboard')
    await expect(page.getByText('Continue conversation')).toBeVisible()
    await expect(page.getByText('Words mastered')).toBeVisible()
    await expect(page.getByText('resilient').first()).toBeVisible()
  })

  test('tutor sees the tutor dashboard', async ({ page, loginAs }) => {
    await loginAs('tutor')
    await visit(page, '/dashboard')
    await expect(page.getByText('Tutor Dashboard')).toBeVisible()
    await expect(page.getByText('Average class skills')).toBeVisible()
  })

  test('admin sees platform-wide stats', async ({ page, loginAs }) => {
    await loginAs('admin')
    await visit(page, '/dashboard')
    await expect(page.getByText('Admin Dashboard')).toBeVisible()
    await expect(page.getByText('Total users')).toBeVisible()
    await expect(page.getByText('128').first()).toBeVisible()
  })

  test('a failed overview shows the error screen, and Try again recovers', async ({ page, loginAs }) => {
    await loginAs('student')
    let failNext = true
    await page.route(/\/api\/v1\/dashboard\/overview$/, (route) => {
      if (!failNext) return route.fallback()
      failNext = false
      return route.fulfill({ status: 500, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ success: false, message: 'Database unavailable' }) })
    })
    await visit(page, '/dashboard')

    const alert = page.getByRole('alert')
    await expect(alert).toContainText("We couldn't load your dashboard")
    await expect(alert).toContainText('Reason: Database unavailable')
    // No fake zeros behind it.
    await expect(page.getByText('Words mastered')).toHaveCount(0)

    await alert.getByRole('button', { name: 'Try again' }).click()
    await expect(page.getByText('Words mastered')).toBeVisible()
    await expect(page.getByRole('alert')).toHaveCount(0)
  })

  for (const [persona, url, title] of [
    ['tutor', '/tutor/dashboard', "We couldn't load your classes overview"],
    ['admin', '/admin/dashboard', "We couldn't load the platform overview"],
  ] as const) {
    test(`${persona}: a failed dashboard keeps the header and shows the error screen`, async ({ page, loginAs, mockApi }) => {
      await loginAs(persona)
      await mockApi('GET', url, { status: 503, body: { success: false, message: 'Service unavailable' } })
      await visit(page, '/dashboard')
      await expect(page.getByRole('alert')).toContainText(title)
      await expect(page.getByText(persona === 'tutor' ? 'Tutor Dashboard' : 'Admin Dashboard')).toBeVisible()
    })
  }
})

/** Every page a role can reach must render without crashing. */
const PAGES: Record<Persona, string[]> = {
  student: ['/dashboard/chat', '/dashboard/voice', '/dashboard/vocab', '/dashboard/goals', '/dashboard/classes', '/dashboard/classes/c1', '/dashboard/billing', '/dashboard/profile'],
  free: ['/dashboard/billing'],
  tutor: ['/dashboard/classes', '/dashboard/classes/c1', '/dashboard/classes/create', '/dashboard/classes/c1/edit', '/dashboard/profile'],
  admin: ['/dashboard/users', '/dashboard/users/u-student', '/dashboard/users/u-student/profile', '/dashboard/classes', '/dashboard/classes/c1', '/dashboard/profile'],
}

for (const persona of Object.keys(PAGES) as Persona[]) {
  for (const path of PAGES[persona]) {
    test(`${persona} can open ${path}`, async ({ page, loginAs }) => {
      await loginAs(persona)
      await visit(page, path)
      await expect(page).toHaveURL(new RegExp(`${path.replace(/\//g, '\\/')}(\\?.*)?$`))
      await expect(page.locator('main')).not.toBeEmpty()
      await expect(page.getByText(/something went wrong|500|404/i)).toHaveCount(0)
    })
  }
}
