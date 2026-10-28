import { test as base, expect, type Locator, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

interface Options {
  failureRate: number
}

/** Every test starts signed in to a fresh demo workspace with instant (non-flaky) saves. */
export const test = base.extend<Options & { board: Page }>({
  failureRate: [0, { option: true }],
  board: async ({ page, failureRate }, use) => {
    await page.addInitScript((failureRate) => {
      // Runs on every navigation; only reset storage on the very first one.
      if (sessionStorage.getItem('e2e-init')) return
      localStorage.clear()
      sessionStorage.setItem('e2e-init', '1')
      localStorage.setItem(
        'pipeline:ui',
        JSON.stringify({ state: { theme: 'light', slowNetwork: false, failureRate }, version: 0 }),
      )
    }, failureRate)
    await page.goto('/login')
    await page.getByRole('button', { name: 'Explore with sample data' }).click()
    await expect(page).toHaveURL(/\/board/)
    await expect(page.getByTestId('board-card').first()).toBeVisible()
    await use(page)
  },
})

export { expect }
export type { Locator, Page }

export function column(page: Page, stage: string) {
  return page.getByTestId(`column-${stage}`)
}

export async function expectNoA11yViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze()
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.length} × ${v.help}`)).toEqual([])
}
