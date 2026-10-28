import { test, expect } from './fixtures'

test('command palette searches applications and runs actions', async ({ board: page }) => {
  await page.keyboard.press('ControlOrMeta+k')
  const palette = page.getByRole('dialog')
  await palette.getByRole('combobox').fill('analytics')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/analytics/)

  await page.keyboard.press('ControlOrMeta+k')
  await palette.getByRole('combobox').fill('stripe')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('dialog', { name: 'Stripe' })).toBeVisible()
})

test('exports and re-imports CSV', async ({ board: page }) => {
  await page.getByRole('button', { name: 'Settings and data' }).click()
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('menuitem', { name: 'Export CSV' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(/^pipeline-\d{4}-\d{2}-\d{2}\.csv$/)
  const path = await download.path()

  await page.getByRole('button', { name: 'Settings and data' }).click()
  await page.getByRole('menuitem', { name: 'Clear all data' }).click()
  await expect(page.getByRole('heading', { name: 'No applications yet' })).toBeVisible()

  const chooser = page.waitForEvent('filechooser')
  await page.getByRole('button', { name: 'Import CSV' }).click()
  await (await chooser).setFiles(path)
  await expect(page.getByText('Imported 48 applications')).toBeVisible()
  await expect(page.getByTestId('board-card')).toHaveCount(48)
})
