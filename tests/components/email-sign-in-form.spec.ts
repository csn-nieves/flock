import { expect, test } from '@playwright/test'

test('validates and submits a normalized email address', async ({ mount }) => {
  const component = await mount('components/EmailSignInForm/Default')
  const input = component.getByRole('textbox', { name: 'Email address' })

  await component.getByRole('button', { name: 'Send code' }).click()
  await expect(input).toBeFocused()
  await expect(input).toHaveAttribute('aria-invalid', 'true')
  await expect(component.getByRole('alert')).toContainText(
    'Enter your email address.',
  )

  await input.fill('  runner@example.com  ')
  await component.getByRole('button', { name: 'Send code' }).click()

  await expect(component.getByTestId('submitted-email')).toHaveText(
    'runner@example.com',
  )
})

test('fits the primary action within a mobile viewport', async ({
  mount,
  page,
}) => {
  const component = await mount('components/EmailSignInForm/Default')
  const button = component.getByRole('button', { name: 'Send code' })
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

test('shows a recoverable server error without disabling the form', async ({
  mount,
}) => {
  const component = await mount('components/EmailSignInForm/ServerError')

  await expect(component.getByRole('alert')).toContainText(
    'We could not send a code. Check your connection and try again.',
  )
  await expect(
    component.getByText('We will send you a six-digit code.'),
  ).toHaveCount(0)
  await expect(
    component.getByRole('textbox', { name: 'Email address' }),
  ).toBeEnabled()
  await expect(
    component.getByRole('button', { name: 'Send code' }),
  ).toBeEnabled()
})

test('keeps its label stable and blocks duplicate submission while busy', async ({
  mount,
}) => {
  const component = await mount('components/EmailSignInForm/Submitting')

  await expect(component.locator('form')).toHaveAttribute('aria-busy', 'true')
  await expect(
    component.getByRole('textbox', { name: 'Email address' }),
  ).toBeDisabled()
  await expect(
    component.getByRole('button', { name: 'Send code' }),
  ).toBeDisabled()
  await expect(component.getByRole('status')).toHaveText('Sending code.')
})
