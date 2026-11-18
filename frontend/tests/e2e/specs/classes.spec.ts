import { test, expect, visit } from '../support/fixtures'
import { classDetail } from '../../fixtures/api'
import type { Page } from '@playwright/test'

const tab = (page: Page, name: string) => page.getByRole('button', { name, exact: true })

test.describe('student', () => {
  test.beforeEach(async ({ loginAs }) => loginAs('student'))

  test('lists enrolled classes', async ({ page }) => {
    await visit(page, '/dashboard/classes')
    await expect(page.getByText('English B1 Evening')).toBeVisible()
    await expect(page.getByText('Business English')).toBeVisible()
  })

  test('joining with an unknown code shows the server error', async ({ page }) => {
    await visit(page, '/dashboard/classes')
    await page.getByRole('button', { name: 'Join a class' }).first().click()
    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('Class code').fill('NOPE123')
    await dialog.getByRole('button', { name: 'Join class' }).click()
    await expect(page.getByText('No class found with that code.')).toBeVisible()
  })

  test('joins a class with a valid code', async ({ page }) => {
    await visit(page, '/dashboard/classes')
    await page.getByRole('button', { name: 'Join a class' }).first().click()
    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('Class code').fill('engb1x')
    const joined = page.waitForResponse((r) => r.url().endsWith('/classes/join') && r.status() === 200)
    await dialog.getByRole('button', { name: 'Join class' }).click()
    await joined
  })

  test('sees only member tabs and no management actions', async ({ page }) => {
    await visit(page, '/dashboard/classes/c1')
    for (const name of ['People', 'Tasks', 'Announcements']) await expect(tab(page, name)).toBeVisible()
    await expect(tab(page, 'Analytics')).toHaveCount(0)
    // Students see who is in the class, never anyone's progress
    await expect(page.getByText('Teachers', { exact: true })).toBeVisible()
    await expect(page.getByText('AI practice', { exact: true })).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Edit', exact: true })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Archive', exact: true })).toHaveCount(0)
    await expect(page.getByPlaceholder(/Write an announcement/)).toHaveCount(0)
  })

  test('deep-links straight to a tab', async ({ page }) => {
    await visit(page, '/dashboard/classes/c1?tab=announcements')
    await expect(page.getByText('Welcome to the class! Homework is due Friday.')).toBeVisible()
  })

  test('a student cannot force a tutor-only tab via the URL', async ({ page }) => {
    await visit(page, '/dashboard/classes/c1?tab=analytics')
    await expect(page.getByText('Subject-verb agreement')).toHaveCount(0)
  })

  test('opens a task on its own page from the Tasks tab', async ({ page }) => {
    await visit(page, '/dashboard/classes/c1?tab=tasks')
    await page.getByText('Describe your weekend').click()
    await expect(page).toHaveURL(/\/dashboard\/classes\/c1\/tasks\/t1$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Describe your weekend' })).toBeVisible()
    await expect(page.getByText('Assigned', { exact: true })).toBeVisible()
  })

  test('images open in the viewer, documents open in a new tab, both download', async ({ page }) => {
    await visit(page, '/dashboard/classes/c1/tasks/t1')
    const doc = page.getByRole('link', { name: 'Open weekend-worksheet.pdf in a new tab' })
    await expect(doc).toHaveAttribute('target', '_blank')
    await expect(doc).toHaveAttribute('href', /ws\.pdf$/)

    await page.getByRole('button', { name: 'View park-photo.png' }).click()
    const viewer = page.getByRole('dialog')
    await expect(viewer.getByRole('img', { name: 'park-photo.png' })).toBeVisible()
    const link = page.waitForRequest((r) => r.url().endsWith('/tasks/t1/attachments/ta2/download'))
    await viewer.getByRole('button', { name: 'Download' }).click()
    await link
  })

  test('hands in written work with a file', async ({ page }) => {
    await visit(page, '/dashboard/classes/c1/tasks/t1')
    await expect(page.getByText('Assigned', { exact: true })).toBeVisible()
    await page.getByLabel('Your answer').fill('On Saturday I visited my grandmother.')
    await page.locator('section[aria-labelledby=task-work-title] input[type=file]')
      .setInputFiles({ name: 'essay.txt', mimeType: 'text/plain', buffer: Buffer.from('My weekend') })
    await expect(page.getByText('essay.txt')).toBeVisible()
    const sent = page.waitForRequest((r) => r.url().endsWith('/tasks/t1/submissions') && r.method() === 'POST')
    await page.getByRole('button', { name: 'Hand in', exact: true }).click()
    const body = (await sent).postData() ?? ''
    expect(body).toContain('On Saturday I visited my grandmother.')
    expect(body).toContain('filename="essay.txt"')
  })

  test('reads the class comments on a task and posts one', async ({ page }) => {
    await visit(page, '/dashboard/classes/c1/tasks/t1')
    const main = page.locator('main')
    await expect(main.getByText('weekend-worksheet.pdf')).toBeVisible()
    await expect(main.getByText('Use the past simple, please.')).toBeVisible()
    await expect(main.getByText('Teacher')).toBeVisible()
    // The teacher's file can be downloaded but not removed; her comment has no menu at all
    await expect(main.getByRole('button', { name: 'Download weekend-worksheet.pdf' })).toBeVisible()
    await expect(main.getByRole('button', { name: /Options for weekend-worksheet/ })).toHaveCount(0)
    await expect(main.getByRole('button', { name: "Options for Sarah Miller's comment" })).toHaveCount(0)
    await expect(main.getByRole('button', { name: "Options for Ali Hassan's comment" })).toBeVisible()

    const posted = page.waitForRequest((r) => r.url().endsWith('/tasks/t1/comments') && r.method() === 'POST')
    await main.getByLabel('Class comment').fill('Thanks!')
    await main.getByRole('button', { name: 'Post', exact: true }).click()
    expect((await posted).postData()).toContain('Thanks!')
    await expect(main.getByText('Posted from the test')).toBeVisible()
  })

  test('cannot comment when the teacher turned comments off', async ({ page }) => {
    await visit(page, '/dashboard/classes/c1/tasks/t2')
    const main = page.locator('main')
    await expect(main.getByText('Your teacher turned off new comments.')).toBeVisible()
    await expect(main.getByLabel('Class comment')).toHaveCount(0)
    await expect(main.getByRole('switch')).toHaveCount(0)
  })
})

test.describe('tutor', () => {
  test.beforeEach(async ({ loginAs }) => loginAs('tutor'))

  test('lists the classes they teach', async ({ page }) => {
    await visit(page, '/dashboard/classes')
    await expect(page.getByText('My Classes')).toBeVisible()
    await expect(page.getByText('English B1 Evening')).toBeVisible()
  })

  test('sees every tab plus edit and archive', async ({ page }) => {
    await visit(page, '/dashboard/classes/c1')
    for (const name of ['People', 'Analytics', 'Tasks', 'Announcements']) await expect(tab(page, name)).toBeVisible()
    await expect(page.getByRole('link', { name: 'Edit', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Archive', exact: true })).toBeVisible()
  })

  test('sees each student\'s progress in People and class analytics', async ({ page }) => {
    await visit(page, '/dashboard/classes/c1')
    await expect(page.getByText('1 of 2 handed in')).toBeVisible()
    await expect(page.getByText('No AI practice yet')).toBeVisible()
    await tab(page, 'Analytics').click()
    await expect(page.getByText('Subject-verb agreement')).toBeVisible()
    await expect(page.getByText('Average of the 1 of 2 students who practise with the AI tutor.')).toBeVisible()
  })

  test('opens a student\'s progress page from People', async ({ page }) => {
    await visit(page, '/dashboard/classes/c1?tab=people')
    await page.getByRole('link', { name: /Ali Hassan/ }).click()
    await expect(page).toHaveURL(/\/dashboard\/classes\/c1\/students\/u-student$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Ali Hassan' })).toBeVisible()
    await expect(page.getByText('Average of their last 40 scored messages, 6 spoken', { exact: false })).toBeVisible()
    await expect(page.getByText('Past simple of irregular verbs')).toBeVisible()
    await expect(page.getByText('Missing', { exact: true }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Assign word' })).toBeVisible()
  })

  test('posts an announcement', async ({ page }) => {
    await visit(page, '/dashboard/classes/c1?tab=announcements')
    await page.getByPlaceholder(/Write an announcement/).fill('Quiz moved to Monday.')
    const posted = page.waitForRequest((r) => r.url().endsWith('/classes/c1/announcements') && r.method() === 'POST')
    await page.getByRole('button', { name: 'Post', exact: true }).click()
    expect((await posted).postDataJSON()).toMatchObject({ content: 'Quiz moved to Monday.' })
  })

  test('turns class comments off on a task', async ({ page }) => {
    await visit(page, '/dashboard/classes/c1/tasks/t1')
    const main = page.locator('main')
    await expect(main.getByRole('button', { name: /Options for weekend-worksheet/ })).toBeVisible()
    // A tutor may delete a student's comment
    await expect(main.getByRole('button', { name: "Options for Ali Hassan's comment" })).toBeVisible()
    const patched = page.waitForRequest((r) => r.url().endsWith('/tasks/t1') && r.method() === 'PATCH')
    await main.getByRole('switch', { name: 'Allow students to comment' }).click()
    expect((await patched).postDataJSON()).toEqual({ commentsEnabled: false })
  })

  test('creates a class', async ({ page }) => {
    await visit(page, '/dashboard/classes/create')
    await page.getByLabel('Class name').fill('IELTS Speaking Prep')
    const created = page.waitForRequest((r) => r.url().endsWith('/classes') && r.method() === 'POST')
    await page.getByRole('button', { name: 'Create class' }).click()
    expect((await created).postDataJSON()).toMatchObject({ className: 'IELTS Speaking Prep' })
  })

  test('keeps Create class disabled until the class has a name', async ({ page }) => {
    await visit(page, '/dashboard/classes/create')
    const create = page.getByRole('button', { name: 'Create class' })
    await expect(create).toBeDisabled()
    await page.getByLabel('Class name').fill('   ')
    await expect(create).toBeDisabled()
    await page.getByLabel('Class name').fill('Grammar club')
    await expect(create).toBeEnabled()
  })

  test('an archived class is read-only with an unarchive action', async ({ page, mockApi }) => {
    await mockApi('GET', '/classes/c1', { body: { success: true, message: 'OK', data: { ...classDetail('c1', 'tutor'), archived: true, archivedAt: '2026-06-01T00:00:00.000Z' } } })
    await visit(page, '/dashboard/classes/c1')
    await expect(page.getByRole('button', { name: 'Unarchive' }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: 'Edit', exact: true })).toHaveCount(0)
  })
})
