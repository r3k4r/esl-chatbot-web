import { test, expect, visit } from '../support/fixtures'

for (const persona of ['admin', 'student'] as const) {
  test(`debug ${persona}`, async ({ page, loginAs }) => {
    const errors: string[] = []
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text().slice(0, 300)) })
    page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
    await loginAs(persona)
    await visit(page, '/dashboard')
    await page.waitForTimeout(2500)
    console.log(persona, 'theme btn:', await page.getByRole('button', { name: /Switch to/ }).count())
    console.log(persona, 'nav links:', await page.locator('aside nav a').allInnerTexts())
    console.log(persona, 'header html:', (await page.locator('header').innerHTML()).length)
    console.log(errors.join('\n'))
    await page.screenshot({ path: `C:/Users/rekar/AppData/Local/Temp/claude/5eb79826cefa8295/189a12b5-6b4b-482c-90e1-e80353684037/scratchpad/${persona}.png` })
  })
}
