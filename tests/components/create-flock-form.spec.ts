import { expect, test } from '@playwright/test'

test('validates and submits a normalized flock name', async ({ mount }) => {
  const component = await mount('components/CreateFlockForm/Default')
  const input = component.getByRole('textbox', { name: 'Flock name' })

  await component.getByRole('button', { name: 'Create flock' }).click()
  await expect(input).toBeFocused()
  await expect(input).toHaveAttribute('aria-invalid', 'true')
  await expect(component.getByRole('alert')).toContainText(
    'Enter a flock name.',
  )

  await input.fill('  Sunrise Striders  ')
  await input.press('Enter')

  await expect(component.getByTestId('submitted-name')).toHaveText(
    'Sunrise Striders',
  )
})

test('fits the primary action within a mobile viewport', async ({
  mount,
  page,
}) => {
  const component = await mount('components/CreateFlockForm/Default')
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
  const component = await mount('components/CreateFlockForm/ServerError')

  await expect(component.getByRole('alert')).toContainText(
    'We could not create your flock. Check your connection and try again.',
  )
  await expect(
    component.getByRole('textbox', { name: 'Flock name' }),
  ).toHaveValue('Sunrise Striders')
  await expect(
    component.getByRole('button', { name: 'Create flock' }),
  ).toBeEnabled()
})

test('keeps its label stable and blocks duplicate submission while busy', async ({
  mount,
}) => {
  const component = await mount('components/CreateFlockForm/Submitting')

  await expect(component.locator('form')).toHaveAttribute('aria-busy', 'true')
  await expect(
    component.getByRole('textbox', { name: 'Flock name' }),
  ).toBeDisabled()
  await expect(
    component.getByRole('button', { name: 'Create flock' }),
  ).toBeDisabled()
  await expect(component.getByRole('status')).toHaveText('Creating flock.')
})
