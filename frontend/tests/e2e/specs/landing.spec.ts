import { test, expect, visit } from '../support/fixtures'

test.beforeEach(async ({ page }) => visit(page, '/'))

test('has the page title, hero and every section', async ({ page }) => {
  await expect(page).toHaveTitle(/Tutelage AI/)
  await expect(page.getByText('Learn English').first()).toBeVisible()
  for (const id of ['features', 'how', 'dashboard', 'pricing', 'cta']) {
    await expect(page.locator(`#${id}`)).toBeAttached()
  }
})

test('navbar links jump to their sections', async ({ page }) => {
  await page.locator('header nav').getByRole('link', { name: 'Pricing' }).click()
  await expect(page).toHaveURL(/#pricing$/)
  await expect(page.locator('#pricing')).toBeInViewport()
})

test('pricing shows three plans with the Gold plan featured', async ({ page }) => {
  const cards = page.locator('#pricing article')
  await expect(cards).toHaveCount(3)
  await expect(cards.nth(1)).toContainText('Most Popular')
  await expect(cards.nth(1)).toContainText('25,000')
})

test('guests are sent to sign up with the plan remembered', async ({ page }) => {
  const gold = page.locator('#pricing article').nth(1).getByRole('link')
  await expect(gold).toHaveAttribute('href', '/signup?redirect=/dashboard/billing?plan=GOLD')
  await gold.click()
  await expect(page).toHaveURL(/\/signup\?redirect=/)
})

test('feature cards always show Learn more and open their own page', async ({ page }) => {
  const cards = page.locator('#features a[href^="/features/"]')
  await expect(cards).toHaveCount(6)
  // No hover needed: phones must see it too
  await expect(cards.first().getByText('Learn more')).toBeVisible()
  await cards.nth(2).click()
  await expect(page).toHaveURL(/\/features\/vocabulary$/)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Words that')
})

test('a feature page tours the real screen: choosing a note marks it as the one shown', async ({ page }) => {
  await visit(page, '/features/ai-conversation')
  await expect(page.getByRole('heading', { name: 'How it works' })).toBeVisible()
  const note = page.getByRole('button', { name: /^Session report/ })
  await note.click()
  await expect(note).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('button', { name: /^Your chats/ })).toHaveAttribute('aria-pressed', 'false')
  await expect(page.getByRole('heading', { name: 'Questions' })).toBeVisible()
})

test('an unknown feature page is a 404', async ({ page }) => {
  const res = await page.goto('/features/not-a-feature')
  expect(res?.status()).toBe(404)
})

async function switchToKurdish(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: 'Select language' }).first().click()
  await page.getByRole('option', { name: /کوردی/ }).click()
}

test('switches to Kurdish and flips the page to right-to-left', async ({ page }) => {
  await switchToKurdish(page)
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  await expect(page.locator('html')).toHaveAttribute('lang', 'ckb')
  await expect(page.getByText('فێری ئینگلیزی ببە،').first()).toBeVisible()
})

// Saved in localStorage and restored right after hydration (plugins/locale.client.ts).
test('remembers Kurdish after a reload', async ({ page }) => {
  await switchToKurdish(page)
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
})
