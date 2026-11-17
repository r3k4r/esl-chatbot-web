import { test, expect, visit } from '../support/fixtures'

test.beforeEach(async ({ loginAs }) => loginAs('student'))

test.describe('AI chat', () => {
  test('opens on a blank chat, without opening or creating a session', async ({ page }) => {
    let created = false
    page.on('request', (r) => { if (r.url().endsWith('/sessions') && r.method() === 'POST') created = true })
    await visit(page, '/dashboard/chat')
    await expect(page.getByText('Practised café vocabulary.')).toBeVisible()
    await expect(page).not.toHaveURL(/session=/)
    await expect(page.getByText('I would like a large coffee, please.')).toHaveCount(0)
    expect(created).toBe(false)
  })

  test('opens a session from its link with its history', async ({ page }) => {
    await visit(page, '/dashboard/chat?session=sess-1')
    await expect(page.getByText('I would like a large coffee, please.')).toBeVisible()
    await expect(page.getByText('Great order! Would you like milk with that?')).toBeVisible()
  })

  test('the first message of a blank chat creates the session', async ({ page }) => {
    await visit(page, '/dashboard/chat')
    const created = page.waitForRequest((r) => r.url().endsWith('/sessions') && r.method() === 'POST')
    await page.getByPlaceholder('Ask anything in English, or just say hi.').fill('Hello there')
    await page.getByRole('button', { name: 'Send message' }).click()
    expect((await created).postDataJSON()).toEqual({ mode: 'TEXT', topic: null })
    await expect(page).toHaveURL(/session=sess-new/)
  })

  test('sends a message and shows the tutor reply', async ({ page }) => {
    await visit(page, '/dashboard/chat?session=sess-1')
    await expect(page.getByText('I would like a large coffee, please.')).toBeVisible()

    const sent = page.waitForRequest((r) => r.url().endsWith('/sessions/sess-1/messages') && r.method() === 'POST')
    const box = page.getByPlaceholder('Ask anything in English, or just say hi.')
    await box.fill('Can I have it with oat milk?')
    await page.getByRole('button', { name: 'Send message' }).click()

    expect((await sent).postDataJSON()).toEqual({ content: 'Can I have it with oat milk?', type: 'TEXT' })
    await expect(page.getByText('Can I have it with oat milk?')).toBeVisible()
    await expect(page.getByText('[mock AI] Nice sentence! Tell me more.')).toBeVisible({ timeout: 15_000 })
    await expect(box).toHaveValue('')
  })

  test('puts the text back when sending fails', async ({ page, mockApi }) => {
    await mockApi('POST', '/sessions/sess-1/messages', { status: 500, body: { success: false, message: 'AI provider unavailable' } })
    await visit(page, '/dashboard/chat?session=sess-1')
    const box = page.getByPlaceholder('Ask anything in English, or just say hi.')
    await box.fill('One more message')
    await page.getByRole('button', { name: 'Send message' }).click()
    await expect(page.getByText('AI provider unavailable')).toBeVisible()
    await expect(box).toHaveValue('One more message')
  })

  // Regression: useHttp used to replace every 429 message with a generic
  // "Too many attempts", hiding the plan's upgrade message.
  test('shows the backend reason when a plan limit is hit', async ({ page, mockApi }) => {
    const reason = 'Daily message limit reached (20). Upgrade to GOLD for more messages.'
    await mockApi('POST', '/sessions/sess-1/messages', { status: 429, body: { success: false, message: reason } })
    await visit(page, '/dashboard/chat?session=sess-1')
    await page.getByPlaceholder('Ask anything in English, or just say hi.').fill('Hello again')
    await page.getByRole('button', { name: 'Send message' }).click()
    await expect(page.getByText(reason)).toBeVisible()
  })

  test('New chat clears the thread without creating a session', async ({ page }) => {
    let created = false
    page.on('request', (r) => { if (r.url().endsWith('/sessions') && r.method() === 'POST') created = true })
    await visit(page, '/dashboard/chat?session=sess-1')
    await expect(page.getByText('I would like a large coffee, please.')).toBeVisible()
    await page.getByRole('button', { name: 'New chat', exact: true }).last().click()
    await expect(page.getByText('I would like a large coffee, please.')).toHaveCount(0)
    await expect(page).not.toHaveURL(/session=/)
    expect(created).toBe(false)
  })

  test('filters the sessions list by search', async ({ page }) => {
    await visit(page, '/dashboard/chat')
    await expect(page.getByText('Practised café vocabulary.')).toBeVisible()
    await page.getByPlaceholder('Search chats').fill('interview')
    await expect(page.getByText('Session ended').first()).toBeVisible()
    await expect(page.getByText('Practised café vocabulary.')).toHaveCount(0)
  })

  test('a chat without an AI name yet falls back to its topic', async ({ page }) => {
    await visit(page, '/dashboard/chat')
    await expect(page.getByText('Ordering Coffee').first()).toBeVisible()
    await expect(page.getByText('Job interview').first()).toBeVisible()
  })

  test('pins, renames and deletes a chat from its menu', async ({ page }) => {
    await visit(page, '/dashboard/chat')

    const pinned = page.waitForRequest((r) => r.url().endsWith('/sessions/sess-1') && r.method() === 'PATCH')
    await page.getByRole('button', { name: 'Options for Ordering Coffee' }).first().click()
    await page.getByRole('menuitem', { name: 'Pin to top' }).click()
    expect((await pinned).postDataJSON()).toEqual({ isPinned: true })
    await expect(page.getByText('Pinned', { exact: true }).first()).toBeVisible()

    const renamed = page.waitForRequest((r) => r.url().endsWith('/sessions/sess-1') && r.method() === 'PATCH')
    await page.getByRole('button', { name: 'Options for Ordering Coffee' }).first().click()
    await page.getByRole('menuitem', { name: 'Rename' }).click()
    const nameBox = page.getByLabel('Chat name').first()
    await nameBox.fill('Café practice')
    await nameBox.press('Enter')
    expect((await renamed).postDataJSON()).toEqual({ title: 'Café practice' })
    await expect(page.getByText('Café practice').first()).toBeVisible()

    const deleted = page.waitForRequest((r) => r.url().endsWith('/sessions/sess-1') && r.method() === 'DELETE')
    await page.getByRole('button', { name: 'Options for Café practice' }).first().click()
    await page.getByRole('menuitem', { name: 'Delete' }).click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click()
    await deleted
    await expect(page.getByText('Café practice')).toHaveCount(0)
  })

  test('an ended session offers a new one instead of the composer', async ({ page }) => {
    await visit(page, '/dashboard/chat?session=sess-2')
    await expect(page.getByText('Session complete')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Send message' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'New chat' }).last()).toBeVisible()
  })
})

test.describe('Vocabulary', () => {
  test('shows due cards, stats and the word list', async ({ page }) => {
    await visit(page, '/dashboard/vocab')
    await expect(page.getByRole('heading', { name: 'Vocabulary', level: 1 })).toBeVisible()
    await expect(page.getByText('Mastery breakdown')).toBeVisible()
    await expect(page.getByText('All words')).toBeVisible()
    await expect(page.getByText('candid').first()).toBeVisible()
  })

  test('reviews a flashcard with an SM-2 rating', async ({ page }) => {
    await visit(page, '/dashboard/vocab')
    await page.locator('.flip-front .dash-card').first().click()
    const review = page.waitForRequest((r) => /\/vocabulary\/v\d+\/review$/.test(r.url()))
    await page.getByRole('button', { name: /Good/ }).click()
    expect((await review).postDataJSON()).toEqual({ quality: 3 })
  })

  test('adds a word', async ({ page }) => {
    await visit(page, '/dashboard/vocab')
    await page.getByRole('button', { name: 'Add word' }).first().click()
    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('Word').fill('tenacious')
    await dialog.getByLabel('Definition').fill('very determined')
    const add = page.waitForRequest((r) => r.url().endsWith('/vocabulary') && r.method() === 'POST')
    await dialog.getByRole('button', { name: 'Add word' }).click()
    expect((await add).postDataJSON()).toMatchObject({ word: 'tenacious', definition: 'very determined' })
    await expect(dialog).toBeHidden()
  })

  test('reports a duplicate word without closing the dialog', async ({ page }) => {
    await visit(page, '/dashboard/vocab')
    await page.getByRole('button', { name: 'Add word' }).first().click()
    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('Word').fill('resilient')
    await dialog.getByLabel('Definition').fill('again')
    await dialog.getByRole('button', { name: 'Add word' }).click()
    await expect(page.getByText(/already in your vocabulary list/)).toBeVisible()
    await expect(dialog).toBeVisible()
  })

  test('searches the word list (debounced)', async ({ page }) => {
    await visit(page, '/dashboard/vocab')
    const searched = page.waitForRequest((r) => r.url().includes('/vocabulary?') && r.url().includes('search=cand'))
    await page.getByPlaceholder('Search words…').fill('cand')
    await searched
  })
})

test.describe('Goals', () => {
  test('lists goals with live counts', async ({ page }) => {
    await visit(page, '/dashboard/goals')
    await expect(page.getByText('Learn 50 travel words')).toBeVisible()
    await expect(page.getByText('Hold a 5-minute conversation')).toBeVisible()
  })

  test('filters by status', async ({ page }) => {
    await visit(page, '/dashboard/goals')
    const filtered = page.waitForRequest((r) => r.url().includes('/goals?') && r.url().includes('status=COMPLETED'))
    await page.getByRole('button', { name: 'Completed', exact: true }).click()
    await filtered
    await expect(page.getByText('Learn 50 travel words')).toHaveCount(0)
  })

  test('creates a goal', async ({ page }) => {
    await visit(page, '/dashboard/goals')
    await page.getByRole('button', { name: 'New goal' }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('Description').fill('Read one article a day')
    await dialog.getByLabel(/Target/).first().fill('30')
    const created = page.waitForRequest((r) => r.url().endsWith('/goals') && r.method() === 'POST')
    await dialog.getByRole('button', { name: 'Create goal' }).click()
    expect((await created).postDataJSON()).toMatchObject({ description: 'Read one article a day', target: 30 })
  })

  // Regression: closing the dialog used to clear the target before confirmDelete ran.
  test('asks for confirmation, then deletes the goal', async ({ page }) => {
    await visit(page, '/dashboard/goals')
    // The 3-dot trigger has no accessible name (a11y gap), so find it from its card.
    await page.getByText('Learn 50 travel words')
      .locator('xpath=ancestor::*[.//*[@aria-haspopup="menu"]][1]')
      .locator('[aria-haspopup="menu"]').click()
    await page.getByRole('menuitem', { name: /Delete/ }).click()
    await expect(page.getByRole('alertdialog')).toContainText('Delete goal?')
    const deleted = page.waitForRequest((r) => r.url().endsWith('/goals/g1') && r.method() === 'DELETE')
    await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click()
    await deleted
  })
})
