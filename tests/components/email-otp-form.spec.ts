import { expect, test } from '@playwright/test'

test('validates and submits a six-digit code', async ({ mount }) => {
  const component = await mount('components/EmailOtpForm/Default')
  const input = component.getByRole('textbox', { name: 'Six-digit code' })

  await component.getByRole('button', { name: 'Verify code' }).click()
  await expect(input).toBeFocused()
  await expect(input).toHaveAttribute('aria-invalid', 'true')
  await expect(component.getByRole('alert')).toContainText(
    'Enter the six-digit code.',
  )

  await input.fill('123456')
  await component.getByRole('button', { name: 'Verify code' }).click()
  await expect(component.getByTestId('result')).toHaveText('123456')
})

test('shows the email and emits the change-email action', async ({ mount }) => {
  const component = await mount('components/EmailOtpForm/Default')

  await expect(component.getByText('runner@example.com')).toBeVisible()
  await component.getByRole('button', { name: 'Change email' }).click()
  await expect(component.getByTestId('result')).toHaveText('change-email')
})

test('emits resend intent when another code is available', async ({
  mount,
}) => {
  const component = await mount('components/EmailOtpForm/Default')

  await component.getByRole('button', { name: 'Send another code' }).click()
  await expect(component.getByTestId('result')).toHaveText('resend')
})

test('fits its actions within a mobile viewport', async ({ mount, page }) => {
  const component = await mount('components/EmailOtpForm/Default')
  const viewport = page.viewportSize()

  expect(viewport).not.toBeNull()

  for (const name of ['Change email', 'Verify code']) {
    const buttonBox = await component
      .getByRole('button', { name })
      .boundingBox()

    expect(buttonBox).not.toBeNull()
    expect(buttonBox?.height).toBeGreaterThanOrEqual(44)
    expect(buttonBox?.x).toBeGreaterThanOrEqual(0)
    expect((buttonBox?.x ?? 0) + (buttonBox?.width ?? 0)).toBeLessThanOrEqual(
      viewport?.width ?? 0,
    )
  }
})

test('separates the field guidance from the primary action', async ({
  mount,
}) => {
  const component = await mount('components/EmailOtpForm/Default')
  const guidance = component.getByText('Enter the code from your email.')
  const button = component.getByRole('button', { name: 'Verify code' })
  const guidanceBox = await guidance.boundingBox()
  const buttonBox = await button.boundingBox()

  expect(guidanceBox).not.toBeNull()
  expect(buttonBox).not.toBeNull()
  expect(
    (buttonBox?.y ?? 0) - ((guidanceBox?.y ?? 0) + (guidanceBox?.height ?? 0)),
  ).toBeGreaterThanOrEqual(16)
})

test('shows a recoverable error in place of the field guidance', async ({
  mount,
}) => {
  const component = await mount('components/EmailOtpForm/ServerError')

  await expect(component.getByRole('alert')).toContainText(
    'That code is invalid or has expired. Check the code and try again.',
  )
  await expect(
    component.getByText('Enter the code from your email.'),
  ).toHaveCount(0)
  await expect(
    component.getByRole('textbox', { name: 'Six-digit code' }),
  ).toBeEnabled()
  await expect(
    component.getByRole('button', { name: 'Verify code' }),
  ).toBeEnabled()
})

test('keeps actions stable and disabled while verifying', async ({ mount }) => {
  const component = await mount('components/EmailOtpForm/Submitting')

  await expect(component.locator('form')).toHaveAttribute('aria-busy', 'true')
  await expect(
    component.getByRole('textbox', { name: 'Six-digit code' }),
  ).toBeDisabled()
  await expect(
    component.getByRole('button', { name: 'Change email' }),
  ).toBeDisabled()
  await expect(
    component.getByRole('button', { name: 'Verify code' }),
  ).toBeDisabled()
  await expect(
    component.getByRole('button', { name: 'Send another code' }),
  ).toBeDisabled()
  await expect(component.getByRole('status')).toHaveText('Verifying code.')
})

test('shows and enforces the resend cooldown', async ({ mount }) => {
  const component = await mount('components/EmailOtpForm/ResendCooldown')
  const resendButton = component.getByRole('button', {
    name: 'Send another code',
  })

  await expect(resendButton).toBeDisabled()
  await expect(resendButton).toHaveAccessibleDescription(
    'You can request another code in 42 seconds.',
  )
  await expect(
    component.getByText('You can request another code in 42 seconds.'),
  ).toBeVisible()
})

test('keeps resend available after a recoverable error', async ({ mount }) => {
  const component = await mount('components/EmailOtpForm/ResendError')

  await expect(component.getByRole('alert')).toContainText(
    'We could not send another code. Check your connection and try again.',
  )
  await expect(
    component.getByRole('button', { name: 'Send another code' }),
  ).toBeEnabled()
})

test('blocks competing actions while sending another code', async ({
  mount,
}) => {
  const component = await mount('components/EmailOtpForm/Resending')

  await expect(component.locator('form')).toHaveAttribute('aria-busy', 'true')
  await expect(
    component.getByRole('textbox', { name: 'Six-digit code' }),
  ).toBeDisabled()
  await expect(
    component.getByRole('button', { name: 'Change email' }),
  ).toBeDisabled()
  await expect(
    component.getByRole('button', { name: 'Verify code' }),
  ).toBeDisabled()
  await expect(
    component.getByRole('button', { name: 'Send another code' }),
  ).toBeDisabled()
  await expect(component.getByRole('status')).toHaveText(
    'Sending another code.',
  )
})
