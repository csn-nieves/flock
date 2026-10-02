import { expect, test } from '@playwright/test'

test('shows paginated global events without mobile overflow', async ({
  mount,
  page,
}) => {
  const component = await mount('pages/AdminPage/EventControls')

  await expect(
    component.getByRole('heading', { name: 'Events (42)' }),
  ).toBeVisible()
  await expect(
    component.getByText('Flock event · Morning Miles · Created by Alex Runner'),
  ).toBeVisible()
  await expect(
    component.getByText('Personal event · Created by Maya Chen'),
  ).toBeVisible()
  await expect(component.getByText('Canceled')).toBeVisible()

  const nextButton = component.getByRole('button', { name: 'Next' })
  const buttonBox = await nextButton.boundingBox()
  const viewport = page.viewportSize()
  expect(buttonBox?.height).toBeGreaterThanOrEqual(44)
  expect(viewport).not.toBeNull()
  expect(
    await page.evaluate('document.documentElement.scrollWidth'),
  ).toBeLessThanOrEqual(viewport?.width ?? 0)

  await nextButton.click()
  await expect(component.getByText('Page 2 of 3')).toBeVisible()
})

test('confirms and reflects a global event cancellation', async ({ mount }) => {
  const component = await mount('pages/AdminPage/EventControls')

  await component.getByRole('button', { name: 'Cancel event' }).click()
  const dialog = component.getByRole('dialog', { name: 'Cancel event?' })
  await expect(dialog).toBeVisible()
  await expect(
    dialog.getByRole('button', { name: 'Close dialog' }),
  ).toBeFocused()
  await expect(dialog).toContainText(
    'preserving its record and attendance history',
  )

  await dialog.getByRole('button', { name: 'Cancel event' }).click()
  await expect(dialog).not.toBeVisible()
  await expect(component.getByText('Canceled')).toHaveCount(2)
  await expect(
    component.getByRole('button', { name: 'Cancel event' }),
  ).toHaveCount(0)
})

test('explains the empty global event state', async ({ mount }) => {
  const component = await mount('pages/AdminPage/EmptyEvents')

  await expect(
    component.getByText('No events have been created.'),
  ).toBeVisible()
  await expect(
    component.getByRole('heading', { name: 'Flocks (0)' }),
  ).toBeVisible()
  await expect(
    component.getByRole('heading', { name: 'Runners (0)' }),
  ).toBeVisible()
})
