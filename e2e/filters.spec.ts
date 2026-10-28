import { test, expect } from './fixtures'

test('search is stored in the URL, survives reload and carries across views', async ({
  board: page,
}) => {
  const total = await page.getByTestId('board-card').count()
  await page.getByRole('searchbox', { name: 'Search applications' }).fill('stripe')
  await expect(page).toHaveURL(/q=stripe/)
  await expect(page.getByTestId('board-card')).toHaveCount(1)

  await page.reload()
  await expect(page.getByRole('searchbox', { name: 'Search applications' })).toHaveValue('stripe')
  await expect(page.getByTestId('board-card')).toHaveCount(1)

  await page.getByRole('link', { name: 'Table' }).click()
  await expect(page).toHaveURL(/\/table\?q=stripe/)
  await expect(page.locator('tbody tr:not([aria-hidden])')).toHaveCount(1)

  await page.getByRole('button', { name: 'Clear' }).click()
  await page.getByRole('link', { name: 'Board' }).click()
  await expect(page.getByTestId('board-card')).toHaveCount(total)
})

test('table sorting is shareable via the URL', async ({ board: page }) => {
  await page.goto('/table')
  await page.getByRole('button', { name: 'Company' }).click()
  await expect(page).toHaveURL(/sort=company\.asc/)
  await expect(page.getByRole('columnheader', { name: 'Company' })).toHaveAttribute(
    'aria-sort',
    'ascending',
  )
  const first = await page.locator('tbody tr:not([aria-hidden]) td').first().textContent()

  await page.reload()
  await expect(page.locator('tbody tr:not([aria-hidden]) td').first()).toHaveText(first!)
})

test('virtualizes 2,000 rows', async ({ board: page }) => {
  await page.getByRole('button', { name: 'Settings and data' }).click()
  await page.getByRole('menuitem', { name: /Load 2,000 rows/ }).click()
  await page.getByRole('link', { name: 'Table' }).click()
  await expect(page.getByText('2,000 applications', { exact: true })).toBeVisible()
  await expect(page.locator('tr[aria-rowindex="2"]')).toBeVisible()
  const rendered = await page.locator('tbody tr:not([aria-hidden])').count()
  expect(rendered).toBeGreaterThan(5)
  expect(rendered).toBeLessThan(80)

  await page.getByTestId('table-scroll').evaluate((el) => (el.scrollTop = el.scrollHeight))
  await expect(page.locator('tr[aria-rowindex="2001"]')).toBeVisible()
})
