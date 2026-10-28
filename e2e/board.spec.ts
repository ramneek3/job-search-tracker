import { test, expect, column, type Locator, type Page } from './fixtures'

/** dnd-kit's live region. */
const announcer = (page: Page) => page.getByRole('status').filter({ hasText: /\S/ }).last()

/** Focus a card and pick it up, waiting until dnd-kit has measured the drop targets. */
async function pickUp(page: Page, card: Locator) {
  const company = (await card.getAttribute('aria-label'))!.split(',')[0]!
  await card.focus()
  await page.keyboard.press('Space')
  await expect(announcer(page)).toHaveText(new RegExp(`${company} is now in`))
}

/**
 * Press → until the card is over `column`. dnd-kit may spend the first press scrolling
 * the board, and under heavy CI load a press can land mid-measure — a user would just
 * press again, so the test does too (but never overshoots).
 */
async function moveRightTo(page: Page, column: string) {
  const target = new RegExp(`now in ${column}`)
  await expect(async () => {
    if (!target.test((await announcer(page).textContent()) ?? ''))
      await page.keyboard.press('ArrowRight')
    await expect(announcer(page)).toHaveText(target, { timeout: 1000 })
  }).toPass({ timeout: 10_000 })
}

test('moves a card between columns with the keyboard only, and it persists', async ({
  board: page,
}) => {
  const card = column(page, 'applied').getByTestId('board-card').first()
  const name = (await card.getAttribute('aria-label'))!
  const before = await column(page, 'oa').getByTestId('board-card').count()

  await pickUp(page, card)
  await moveRightTo(page, 'Online assessment')
  // What a screen-reader user hears before dropping:
  await expect(announcer(page)).toHaveText(/is now in Online assessment, position 1/)
  await page.keyboard.press('Space')
  await expect(announcer(page)).toHaveText(/Dropped .* in Online assessment/)

  await expect(column(page, 'oa').getByTestId('board-card')).toHaveCount(before + 1)
  await expect(column(page, 'oa').getByRole('button', { name })).toBeVisible()

  await page.reload()
  await expect(column(page, 'oa').getByRole('button', { name })).toBeVisible()
})

test('Escape cancels a keyboard drag', async ({ board: page }) => {
  const card = column(page, 'applied').getByTestId('board-card').first()
  const name = (await card.getAttribute('aria-label'))!
  await pickUp(page, card)
  await moveRightTo(page, 'Online assessment')
  await page.keyboard.press('Escape')
  await expect(announcer(page)).toHaveText(/Moving cancelled/)
  await expect(column(page, 'applied').getByRole('button', { name })).toBeVisible()
})

test('drags a card with the mouse', async ({ board: page }) => {
  const card = column(page, 'wishlist').getByTestId('board-card').first()
  const name = (await card.getAttribute('aria-label'))!
  const target = column(page, 'applied')
  const from = (await card.boundingBox())!
  const to = (await target.boundingBox())!
  await page.mouse.move(from.x + 20, from.y + 20)
  await page.mouse.down()
  await page.mouse.move(from.x + 40, from.y + 30, { steps: 5 })
  await page.mouse.move(to.x + to.width / 2, to.y + 120, { steps: 15 })
  await page.mouse.up()
  await expect(target.getByRole('button', { name })).toBeVisible()
})

test.describe('when saves fail', () => {
  test.use({ failureRate: 1 })

  test('rolls the optimistic move back and explains why', async ({ board: page }) => {
    const card = column(page, 'applied').getByTestId('board-card').first()
    const name = (await card.getAttribute('aria-label'))!
    await pickUp(page, card)
    await moveRightTo(page, 'Online assessment')
    await page.keyboard.press('Space')

    await expect(page.getByText(/Couldn't move .* to Online assessment/)).toBeVisible()
    await expect(column(page, 'applied').getByRole('button', { name })).toBeVisible()
  })
})
