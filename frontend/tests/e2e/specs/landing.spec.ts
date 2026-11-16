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
