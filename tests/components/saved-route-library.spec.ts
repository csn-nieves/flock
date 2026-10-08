import { expect, test } from '@playwright/test'

test('previews, renames, deletes, and reuses private routes', async ({
  mount,
  page,
}) => {
  await page.route('https://tiles.openfreemap.org/**', (route) => route.abort())
  const component = await mount('components/SavedRouteLibraryDialog/Ready')

  await expect(
    component.getByRole('dialog', { name: 'Choose a saved route' }),
  ).toBeVisible()
  const map = component.getByRole('group', { name: 'Event route map' })
  await expect(map).toBeVisible()

  const viewport = page.viewportSize()
  const mapBox = await map.boundingBox()
  expect(mapBox).not.toBeNull()
  expect(mapBox?.x).toBeGreaterThanOrEqual(0)
  expect((mapBox?.x ?? 0) + (mapBox?.width ?? 0)).toBeLessThanOrEqual(
    viewport?.width ?? 0,
  )
  expect(mapBox?.height).toBe(256)

  await component.getByRole('button', { name: /Harbor recovery loop/ }).click()
  await component.getByRole('button', { name: 'Rename' }).click()
  await component.getByLabel('Route name').fill('Harbor easy loop')
  await component.getByRole('button', { name: 'Save name' }).click()
  await expect(component.getByText('Harbor easy loop').first()).toBeVisible()

  await component.getByRole('button', { name: 'Use this route' }).click()
  await expect(
    component.getByText('Using Harbor easy loop', { exact: true }),
  ).toBeVisible()

  await component.getByRole('button', { name: 'Delete' }).click()
  await expect(
    component.getByText(
      'Delete this saved route? Events already using it will not change.',
    ),
  ).toBeVisible()
  await component.getByRole('button', { name: 'Delete route' }).click()
  await expect(
    component.getByRole('button', { name: /Harbor easy loop/ }),
  ).toHaveCount(0)
  await expect(
    component.getByText('Riverside five-mile loop').first(),
  ).toBeVisible()
})
