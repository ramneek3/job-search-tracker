import { test, expect, expectNoA11yViolations } from './fixtures'

test('login page has no accessibility violations', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expectNoA11yViolations(page)
})

for (const theme of ['light', 'dark'] as const) {
  test.describe(`${theme} theme`, () => {
    test.use({ colorScheme: theme })

    test('board, table, analytics and editor have no accessibility violations', async ({
      board: page,
    }) => {
      await page.evaluate((theme) => {
        const ui = JSON.parse(localStorage.getItem('pipeline:ui')!)
        ui.state.theme = theme
        localStorage.setItem('pipeline:ui', JSON.stringify(ui))
      }, theme)
      await page.reload()
      await expect(page.getByTestId('board-card').first()).toBeVisible()
      await expectNoA11yViolations(page)

      await page.getByRole('link', { name: 'Table' }).click()
      await expect(page.getByRole('table')).toBeVisible()
      await expectNoA11yViolations(page)

      await page.getByRole('link', { name: 'Analytics' }).click()
      await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible()
      await expectNoA11yViolations(page)

      await page.getByRole('button', { name: 'New', exact: true }).click()
      await expect(page.getByRole('dialog')).toBeVisible()
      await expectNoA11yViolations(page)
    })
  })
}

test('works at phone width without horizontal page scroll', async ({ board: page }) => {
  await page.setViewportSize({ width: 360, height: 740 })
  for (const path of ['/board', '/table', '/analytics']) {
    await page.goto(path)
    await page.waitForLoadState('networkidle')
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    )
    expect(overflow, path).toBeLessThanOrEqual(0)
  }
})
