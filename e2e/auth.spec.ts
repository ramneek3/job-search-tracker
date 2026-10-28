import { test, expect } from './fixtures'

test('protects app routes and returns to the requested page after sign-in', async ({ page }) => {
  await page.goto('/table?stage=offer')
  await expect(page).toHaveURL(/\/login/)
  await page.getByRole('button', { name: 'Start with an empty board' }).click()
  await expect(page).toHaveURL(/\/table\?stage=offer/)
  await expect(page.getByRole('heading', { name: 'No applications yet' })).toBeVisible()
})

test('signing out goes back to the login page', async ({ board: page }) => {
  await page.getByRole('button', { name: 'Settings and data' }).click()
  await page.getByRole('menuitem', { name: 'Sign out' }).click()
  await expect(page).toHaveURL(/\/login/)
  await page.goto('/board')
  await expect(page).toHaveURL(/\/login/)
})
