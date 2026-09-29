import { expect, test } from '@playwright/test'

test('associates its label and hint with a mobile-safe input', async ({
  mount,
  page,
}) => {
  const component = await mount('primitives/TextField/Email')
  const input = component.getByRole('textbox', { name: 'Email address' })
  const hint = component.getByText('We will send a six-digit code.')
  const hintId = await hint.getAttribute('id')

  expect(hintId).not.toBeNull()
  await expect(input).toHaveAttribute('aria-describedby', hintId ?? '')

  await component.getByText('Email address').click()
  await expect(input).toBeFocused()

  const inputBox = await input.boundingBox()
  const hintBox = await hint.boundingBox()
  const viewport = page.viewportSize()

  expect(inputBox).not.toBeNull()
  expect(hintBox).not.toBeNull()
  expect(viewport).not.toBeNull()
  expect(inputBox?.height).toBeGreaterThanOrEqual(44)
  expect(
    (hintBox?.y ?? 0) - ((inputBox?.y ?? 0) + (inputBox?.height ?? 0)),
  ).toBeGreaterThanOrEqual(8)
  expect(inputBox?.x).toBeGreaterThanOrEqual(0)
  expect((inputBox?.x ?? 0) + (inputBox?.width ?? 0)).toBeLessThanOrEqual(
    viewport?.width ?? 0,
  )
})

test('accepts text and exposes a visible focus state', async ({ mount }) => {
  const component = await mount('primitives/TextField/Email')
  const input = component.getByRole('textbox', { name: 'Email address' })

  await input.fill('runner@example.com')

  await expect(input).toHaveValue('runner@example.com')
  await expect(input).not.toHaveCSS('box-shadow', 'none')
})

test('connects visible error guidance to the invalid input', async ({
  mount,
}) => {
  const component = await mount('primitives/TextField/Error')
  const input = component.getByRole('textbox', { name: 'Email address' })
  const error = component.getByRole('alert')
  const errorId = await error.getAttribute('id')

  await expect(input).toHaveAttribute('aria-invalid', 'true')
  expect(errorId).not.toBeNull()
  await expect(input).toHaveAttribute('aria-describedby', errorId ?? '')
  await expect(error).toContainText('Enter a valid email address.')
  await expect(input).toHaveCSS('border-color', 'rgb(217, 95, 76)')
})

test('exposes the native disabled state', async ({ mount }) => {
  const component = await mount('primitives/TextField/Disabled')
  const input = component.getByRole('textbox', { name: 'Email address' })

  await expect(input).toBeDisabled()
  await expect(input).toHaveCSS('background-color', 'rgb(243, 247, 244)')
})
