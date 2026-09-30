import { expect, test } from '@playwright/test'

test('renders the primary variant with a mobile-safe touch target', async ({
  mount,
  page,
}) => {
  const component = await mount('primitives/Button/Primary')
  const button = component.getByRole('button', { name: 'Join a flock' })

  await expect(button).toHaveAttribute('type', 'button')
  await expect(button).toHaveCSS('background-color', 'rgb(54, 159, 96)')
  await expect(button).toHaveCSS('color', 'rgb(16, 36, 62)')

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

test('renders the secondary variant', async ({ mount }) => {
  const component = await mount('primitives/Button/Secondary')
  const button = component.getByRole('button', { name: 'View details' })

  await expect(button).toHaveCSS('background-color', 'rgb(255, 255, 255)')
  await expect(button).toHaveCSS('border-color', 'rgb(214, 224, 217)')
  await expect(button).toHaveCSS('color', 'rgb(16, 36, 62)')
})

test('records a real browser click', async ({ mount }) => {
  const component = await mount('primitives/Button/Interactive')
  const clickCount = component.getByTestId('click-count')

  await component.getByRole('button', { name: 'Create flock' }).click()

  await expect(clickCount).toHaveValue('1')
})

test('exposes the native disabled state', async ({ mount }) => {
  const component = await mount('primitives/Button/Disabled')
  const button = component.getByRole('button', { name: 'Create flock' })

  await expect(button).toBeDisabled()
  await expect(button).toHaveCSS('opacity', '0.55')
})

test('shows a stable action-specific pending state', async ({ mount }) => {
  const component = await mount('primitives/Button/Pending')
  const button = component.getByRole('button', { name: 'Create flock' })
  const idleBox = await button.boundingBox()

  expect(idleBox).not.toBeNull()
  await expect(component.locator('.animate-spin')).toHaveCount(0)

  await button.click()

  const pendingButton = component.getByRole('button', {
    name: 'Creating flock',
  })
  const pendingBox = await pendingButton.boundingBox()

  await expect(pendingButton).toBeDisabled()
  await expect(pendingButton).toHaveAttribute('aria-busy', 'true')
  await expect(component.getByRole('status')).toHaveText('Creating flock')
  expect(pendingBox).not.toBeNull()
  expect(pendingBox?.width).toBe(idleBox?.width)
  expect(pendingBox?.height).toBe(idleBox?.height)
})

test('stops pending animation when reduced motion is requested', async ({
  mount,
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })

  const component = await mount('primitives/Button/Pending')
  await component.getByRole('button', { name: 'Create flock' }).click()

  await expect(component.locator('.animate-spin')).toHaveCSS(
    'animation-name',
    'none',
  )
})

test('shows a visible focus state', async ({ mount }) => {
  const component = await mount('primitives/Button/FocusOrder')
  const firstButton = component.getByRole('button', { name: 'First action' })

  await firstButton.focus()

  await expect(firstButton).toBeFocused()
  await expect(firstButton).not.toHaveCSS('box-shadow', 'none')
})

test('supports desktop keyboard focus and skips the disabled button', async ({
  mount,
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'components',
    'Desktop keyboard navigation',
  )

  const component = await mount('primitives/Button/FocusOrder')
  const firstButton = component.getByRole('button', { name: 'First action' })
  const nextButton = component.getByRole('button', { name: 'Next action' })

  await page.keyboard.press('Tab')
  await expect(firstButton).toBeFocused()

  await page.keyboard.press('Tab')
  await expect(nextButton).toBeFocused()
})

test('shows desktop hover and pressed states', async ({
  mount,
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'components',
    'Pointer-only desktop state',
  )

  const component = await mount('primitives/Button/Primary')
  const button = component.getByRole('button', { name: 'Join a flock' })

  await button.hover()
  await expect(button).toHaveCSS('background-color', 'rgb(66, 173, 108)')

  const buttonBox = await button.boundingBox()

  expect(buttonBox).not.toBeNull()

  if (!buttonBox) {
    return
  }

  await page.mouse.move(
    buttonBox.x + buttonBox.width / 2,
    buttonBox.y + buttonBox.height / 2,
  )
  await page.mouse.down()

  try {
    await expect(button).toHaveCSS('background-color', 'rgb(36, 107, 65)')
  } finally {
    await page.mouse.up()
  }
})
