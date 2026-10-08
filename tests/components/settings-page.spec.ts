import { expect, test } from '@playwright/test'

test('changes the notification control for the current device', async ({
  mount,
}) => {
  const component = await mount('pages/SettingsPage/NotificationControl')

  await expect(component.getByText('Off for this device')).toBeVisible()
  await expect(
    component.getByText(/flock event changes, and new messages/),
  ).toBeVisible()
  await component.getByRole('button', { name: 'Turn on notifications' }).click()

  await expect(component.getByText('On for this device')).toBeVisible()
  await expect(component.getByText(/show event and chat alerts/)).toBeVisible()
  await expect(
    component.getByRole('button', { name: 'Turn off on this device' }),
  ).toBeVisible()
})

test('keeps iPhone installation guidance inside the viewport', async ({
  mount,
  page,
}) => {
  const component = await mount('pages/SettingsPage/IosInstallRequired')
  const guidance = component.getByText(/Share → Add to Home Screen/)

  await expect(guidance).toBeVisible()
  await expect(
    component.getByRole('button', { name: 'Turn on notifications' }),
  ).toHaveCount(0)

  const viewport = page.viewportSize()
  const box = await guidance.boundingBox()
  expect(viewport).not.toBeNull()
  expect(box).not.toBeNull()
  expect(box?.x).toBeGreaterThanOrEqual(0)
  expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(
    viewport?.width ?? 0,
  )
})
