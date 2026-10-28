import { test, expect, column } from './fixtures'

test('creates an application with validation feedback', async ({ board: page }) => {
  await page.getByRole('button', { name: 'New', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'New application' })
  await expect(dialog.getByLabel('Company')).toBeFocused()

  await dialog.getByRole('button', { name: 'Add application' }).click()
  await expect(dialog.getByText('Company is required')).toBeVisible()

  await dialog.getByLabel('Company').fill('Anthropic')
  await dialog.getByLabel('Role').fill('Frontend Engineering Intern')
  await dialog.getByLabel('Date applied').fill('2026-10-27')
  await dialog.getByRole('button', { name: 'Add application' }).click()

  await expect(dialog).toBeHidden()
  await expect(column(page, 'applied').getByTestId('board-card').first()).toHaveAccessibleName(
    /Anthropic/,
  )
  await expect(page.getByText('Added Anthropic')).toBeVisible()
})

test('deletes with undo', async ({ board: page }) => {
  const card = column(page, 'applied').getByTestId('board-card').first()
  const name = (await card.getAttribute('aria-label'))!
  const company = name.split(',')[0]!
  await card.click()
  await expect(page).toHaveURL(/app=/)
  await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click()

  await expect(page.getByRole('button', { name: name })).toHaveCount(0)
  await page.getByRole('button', { name: 'Undo' }).click()
  await expect(page.getByText(`Restored ${company}`)).toBeVisible()
  await expect(page.getByRole('button', { name })).toHaveCount(1)
})

test('editor state lives in the URL, so back closes it', async ({ board: page }) => {
  await column(page, 'interview').getByTestId('board-card').first().click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.goBack()
  await expect(page.getByRole('dialog')).toBeHidden()
})
