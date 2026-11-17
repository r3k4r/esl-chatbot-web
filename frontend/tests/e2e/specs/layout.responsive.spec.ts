/**
 * Runs on every project: desktop (1440), tablet (iPad Mini 768) and phone (Pixel 7 412).
 * Guards the layout contract: nothing scrolls sideways, navigation adapts, and the
 * key content of each screen is reachable at every size.
 */
import { test, expect, visit, type Persona } from '../support/fixtures'
import { expectNoHorizontalOverflow, isPhone } from '../support/layout'

const PUBLIC_PAGES = ['/', '/signin', '/signup', '/forgot-password']

const APP_PAGES: [Persona, string][] = [
  ['student', '/dashboard'],
  ['student', '/dashboard/chat'],
  ['student', '/dashboard/vocab'],
  ['student', '/dashboard/goals'],
  ['student', '/dashboard/classes'],
  ['student', '/dashboard/billing'],
  ['student', '/dashboard/profile'],
  ['tutor', '/dashboard'],
  ['tutor', '/dashboard/classes/c1'],
  ['student', '/dashboard/classes/c1/tasks/t1'],
  ['admin', '/dashboard'],
  ['admin', '/dashboard/users'],
  ['admin', '/dashboard/classes'],
]

for (const path of PUBLIC_PAGES) {
  test(`${path} fits the screen`, async ({ page }) => {
    await visit(page, path)
    await expectNoHorizontalOverflow(page)
  })
}

for (const [persona, path] of APP_PAGES) {
  test(`${persona} ${path} fits the screen`, async ({ page, loginAs }) => {
    await loginAs(persona)
    await visit(page, path)
    await page.waitForLoadState('networkidle')
    await expectNoHorizontalOverflow(page)
  })
}

test('landing navigation adapts: inline links on desktop, menu on small screens', async ({ page }) => {
  await visit(page, '/')
  const inlineNav = page.locator('header nav')
  const menuButton = page.getByRole('button', { name: 'Toggle menu' })
  const width = page.viewportSize()!.width

  if (width >= 1024) {
    await expect(inlineNav).toBeVisible()
    await expect(menuButton).toBeHidden()
  } else {
    await expect(inlineNav).toBeHidden()
    await menuButton.click()
    const pricing = page.getByRole('link', { name: 'Pricing', exact: true }).filter({ visible: true }).first()
    await expect(pricing).toBeVisible()
    await pricing.click()
    await expect(page).toHaveURL(/#pricing$/)
  }
})

test('pricing cards stack on small screens and sit side by side on desktop', async ({ page }) => {
  await visit(page, '/')
  const cards = page.locator('#pricing article')
  await cards.first().scrollIntoViewIfNeeded()
  const [a, b] = [await cards.nth(0).boundingBox(), await cards.nth(1).boundingBox()]
  if (page.viewportSize()!.width >= 1024) expect(Math.abs(a!.y - b!.y)).toBeLessThan(80)
  else expect(b!.y).toBeGreaterThan(a!.y + a!.height - 1)
})

test('dashboard sidebar: always visible on desktop, a drawer on phones', async ({ page, loginAs }) => {
  await loginAs('student')
  await visit(page, '/dashboard')
  const chatLink = page.locator('aside nav').getByRole('link', { name: 'AI Chat' })

  if (isPhone(page)) {
    await expect(chatLink).not.toBeInViewport()
    await page.getByRole('button', { name: 'Open menu' }).click()
    await expect(chatLink).toBeInViewport()
    await chatLink.click()
    await expect(page).toHaveURL(/\/dashboard\/chat/)
    await expect(chatLink).not.toBeInViewport()
  } else {
    await expect(chatLink).toBeInViewport()
  }
})

test('chat sessions are reachable at every size', async ({ page, loginAs }) => {
  await loginAs('student')
  await visit(page, '/dashboard/chat')
  if (isPhone(page)) {
    await page.getByRole('button', { name: 'Show sessions' }).click()
  }
  await expect(page.getByPlaceholder('Search chats').last()).toBeVisible()
  await expect(page.getByText('Job interview').last()).toBeVisible()
})

test('the chat composer stays pinned inside the viewport', async ({ page, loginAs }) => {
  await loginAs('student')
  await visit(page, '/dashboard/chat')
  const send = page.getByRole('button', { name: 'Send message' })
  await expect(send).toBeInViewport()
  const box = await send.boundingBox()
  expect(box!.y + box!.height).toBeLessThanOrEqual(page.viewportSize()!.height)
})

test('sign-in form is fully usable', async ({ page }) => {
  await visit(page, '/signin')
  for (const target of [page.getByLabel('Username'), page.locator('#password'), page.getByRole('button', { name: 'Sign in' })]) {
    await expect(target).toBeInViewport()
  }
})
