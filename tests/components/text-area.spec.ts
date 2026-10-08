import { expect, test } from '@playwright/test'

test('associates its label and hint with a phone-safe textarea', async ({
  mount,
  page,
}) => {
  const component = await mount('primitives/TextArea/Message')
  const input = component.getByRole('textbox', { name: 'Message' })
  const hint = component.getByText('0 / 2,000 characters.')
  const hintId = await hint.getAttribute('id')

  expect(hintId).not.toBeNull()
  await expect(input).toHaveAttribute('aria-describedby', hintId ?? '')
  await input.fill('Meet at seven.')
  await expect(input).toHaveValue('Meet at seven.')
  await expect(component.getByText('14 / 2,000 characters.')).toBeVisible()

  const inputBox = await input.boundingBox()
  const viewport = page.viewportSize()
  expect(inputBox).not.toBeNull()
  expect(viewport).not.toBeNull()
  expect(inputBox?.height).toBeGreaterThanOrEqual(96)
  expect(inputBox?.x).toBeGreaterThanOrEqual(0)
  expect((inputBox?.x ?? 0) + (inputBox?.width ?? 0)).toBeLessThanOrEqual(
    viewport?.width ?? 0,
  )
})

test('connects an error to the textarea and exposes disabled state', async ({
  mount,
}) => {
  const errorComponent = await mount('primitives/TextArea/Error')
  const invalidInput = errorComponent.getByRole('textbox', { name: 'Message' })
  const error = errorComponent.getByRole('alert')
  const errorId = await error.getAttribute('id')

  await expect(invalidInput).toHaveAttribute('aria-invalid', 'true')
  await expect(invalidInput).toHaveAttribute('aria-describedby', errorId ?? '')
  await expect(error).toContainText('Your message was not sent.')

  await errorComponent.unmount()
  const disabledComponent = await mount('primitives/TextArea/Disabled')
  await expect(
    disabledComponent.getByRole('textbox', { name: 'Message' }),
  ).toBeDisabled()
})
