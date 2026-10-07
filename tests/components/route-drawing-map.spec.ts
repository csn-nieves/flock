import { expect, test } from '@playwright/test'

test('renders a road-following draft with a keyboard alternative', async ({
  mount,
  page,
}) => {
  const component = await mount('components/RouteDrawingMap/PlannedRoute')
  const map = component.getByRole('group', { name: /Route drawing map/ })

  await expect(map).toBeVisible()
  await expect(
    component.getByRole('button', { name: 'Add point at map center' }),
  ).toBeVisible()
  await expect(component.locator('.maplibregl-canvas')).toBeVisible()
  await component
    .getByRole('button', { name: 'Add point at map center' })
    .click()
  await expect(component.getByTestId('added-point')).not.toHaveText(
    'No point added',
  )

  const viewport = page.viewportSize()
  const box = await map.boundingBox()
  expect(box).not.toBeNull()
  expect(box?.x).toBeGreaterThanOrEqual(0)
  expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(
    viewport?.width ?? 0,
  )
})
