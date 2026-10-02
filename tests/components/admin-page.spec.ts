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
  await expect(component.getByText(/Riverside Park/)).toBeVisible()
  await expect(component.getByText(/Central Track/)).toBeVisible()

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

test('shows global membership controls and protects owners', async ({
  mount,
  page,
}) => {
  const component = await mount('pages/AdminPage/EventControls')

  await expect(
    component.getByRole('heading', { name: 'Memberships (2)' }),
  ).toBeVisible()
  await expect(component.getByText('Flock: Morning Miles')).toHaveCount(2)
  await expect(
    component.getByText('Owner memberships cannot be removed here.'),
  ).toBeVisible()
  const removeButton = component.getByRole('button', {
    name: 'Remove member',
  })
  await expect(removeButton).toHaveCount(1)
  expect((await removeButton.boundingBox())?.height).toBeGreaterThanOrEqual(44)
  expect(
    await page.evaluate('document.documentElement.scrollWidth'),
  ).toBeLessThanOrEqual(page.viewportSize()?.width ?? 0)
})

test('confirms and reflects a global membership removal', async ({ mount }) => {
  const component = await mount('pages/AdminPage/EventControls')

  await component.getByRole('button', { name: 'Remove member' }).click()
  const dialog = component.getByRole('dialog', { name: 'Remove member?' })
  await expect(dialog).toBeVisible()
  await expect(
    dialog.getByRole('button', { name: 'Close dialog' }),
  ).toBeFocused()
  await expect(dialog).toContainText(
    'They will lose access to the flock and its flock events.',
  )

  await dialog.getByRole('button', { name: 'Remove member' }).click()
  await expect(dialog).not.toBeVisible()
  await expect(
    component.getByRole('heading', { name: 'Memberships (1)' }),
  ).toBeVisible()
  await expect(
    component.getByText('Maya Chen was removed from Morning Miles.'),
  ).toBeVisible()
  await expect(
    component.getByRole('heading', { name: 'Memberships (1)' }),
  ).toBeFocused()
  await expect(
    component.getByRole('button', { name: 'Remove member' }),
  ).toHaveCount(0)
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
    component.getByText('No flock memberships have been created.'),
  ).toBeVisible()
  await expect(
    component.getByRole('heading', { name: 'Runners (0)' }),
  ).toBeVisible()
})
