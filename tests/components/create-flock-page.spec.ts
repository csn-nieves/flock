import { expect, test } from '@playwright/test'

test('renders the page and reports normalized creation intent', async ({
  mount,
}) => {
  const component = await mount('pages/CreateFlockPage/Default')
  const input = component.getByRole('textbox', { name: 'Flock name' })

  await expect(
    component.getByRole('heading', { level: 1, name: 'Create a flock' }),
  ).toBeVisible()
  await input.fill('  Sunrise Striders  ')
  await component.getByRole('button', { name: 'Create flock' }).click()

  await expect(component.getByTestId('created-name')).toHaveText(
    'Sunrise Striders',
  )
})

test('keeps the create workflow inside a mobile viewport', async ({
  mount,
  page,
}) => {
  const component = await mount('pages/CreateFlockPage/Default')
  const input = component.getByRole('textbox', { name: 'Flock name' })
  const button = component.getByRole('button', { name: 'Create flock' })
  const backButton = component.getByRole('button', {
    name: 'Back to your flocks',
  })
  const viewport = page.viewportSize()

  expect(viewport).not.toBeNull()

  for (const control of [backButton, input, button]) {
    const controlBox = await control.boundingBox()

    expect(controlBox).not.toBeNull()
    expect(controlBox?.height).toBeGreaterThanOrEqual(44)
    expect(controlBox?.x).toBeGreaterThanOrEqual(0)
    expect((controlBox?.x ?? 0) + (controlBox?.width ?? 0)).toBeLessThanOrEqual(
      viewport?.width ?? 0,
    )
  }
})

test('shows safe recovery without clearing the entered name', async ({
  mount,
}) => {
  const component = await mount('pages/CreateFlockPage/Error')
  const input = component.getByRole('textbox', { name: 'Flock name' })

  await input.fill('Sunrise Striders')
  await expect(component.getByRole('alert')).toContainText(
    'We could not create your flock. Check your connection and try again.',
  )
  await expect(input).toHaveValue('Sunrise Striders')
  await expect(
    component.getByRole('button', { name: 'Create flock' }),
  ).toBeEnabled()
})

test('shows creation progress and blocks duplicate activation', async ({
  mount,
}) => {
  const component = await mount('pages/CreateFlockPage/Creating')

  await expect(
    component.getByRole('button', { name: 'Creating flock' }),
  ).toBeDisabled()
  await expect(
    component.getByRole('textbox', { name: 'Flock name' }),
  ).toBeDisabled()
  await expect(component.getByRole('status')).toHaveText('Creating flock')
})
