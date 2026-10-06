import { expect, test } from '@playwright/test'

test('validates and submits normalized flock details', async ({ mount }) => {
  const component = await mount('components/FlockDetailsForm/Default')
  const input = component.getByRole('textbox', { name: 'Flock name' })

  await component.getByRole('button', { name: 'Create flock' }).click()
  await expect(input).toBeFocused()
  await expect(input).toHaveAttribute('aria-invalid', 'true')
  await expect(component.getByText('Error: Enter a flock name.')).toBeVisible()

  await input.fill('  Sunrise Striders  ')
  await component
    .getByRole('textbox', { name: 'Location' })
    .fill('  Portland, Oregon  ')
  await component
    .getByRole('textbox', { name: 'Description' })
    .fill('  Friendly miles for every pace.  ')
  await input.press('Enter')

  await expect(component.getByTestId('submitted-name')).toHaveText(
    'Sunrise Striders',
  )
})

test('fits the primary action within a mobile viewport', async ({
  mount,
  page,
}) => {
  const component = await mount('components/FlockDetailsForm/Default')
  const button = component.getByRole('button', { name: 'Create flock' })
  const buttonBox = await button.boundingBox()
  const viewport = page.viewportSize()

  expect(buttonBox).not.toBeNull()
  expect(viewport).not.toBeNull()
  expect(buttonBox?.height).toBeGreaterThanOrEqual(44)
  expect(buttonBox?.x).toBeGreaterThanOrEqual(0)
  expect((buttonBox?.x ?? 0) + (buttonBox?.width ?? 0)).toBeLessThanOrEqual(
    viewport?.width ?? 0,
  )
})

test('shows a recoverable server error and preserves the name', async ({
  mount,
}) => {
  const component = await mount('components/FlockDetailsForm/ServerError')

  await expect(component.getByRole('alert')).toContainText(
    'We could not save your flock. Check your connection and try again.',
  )
  await expect(
    component.getByRole('textbox', { name: 'Flock name' }),
  ).toHaveValue('Sunrise Striders')
  await expect(
    component.getByRole('button', { name: 'Save changes' }),
  ).toBeEnabled()
})

test('shows pending progress and blocks duplicate submission while busy', async ({
  mount,
}) => {
  const component = await mount('components/FlockDetailsForm/Submitting')

  await expect(component.locator('form')).toHaveAttribute('aria-busy', 'true')
  await expect(
    component.getByRole('textbox', { name: 'Flock name' }),
  ).toBeDisabled()
  await expect(
    component.getByRole('button', { name: 'Saving changes' }),
  ).toBeDisabled()
  await expect(component.getByRole('status')).toHaveText('Saving changes')
})
