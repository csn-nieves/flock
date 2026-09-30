import { expect, test } from '@playwright/test'

test('reports the selected flock without owning navigation', async ({
  mount,
}) => {
  const component = await mount('components/FlockList/Interactive')

  await component.getByRole('button', { name: 'Open Weekend Miles' }).click()

  await expect(component.getByTestId('selected-flock')).toHaveText(
    'weekend-miles-id',
  )
})

test('keeps flock selections usable in a mobile viewport', async ({
  mount,
  page,
}) => {
  const component = await mount('components/FlockList/Interactive')
  const viewport = page.viewportSize()

  for (const name of ['Open Morning Runners', 'Open Weekend Miles']) {
    const buttonBox = await component
      .getByRole('button', { name })
      .boundingBox()

    expect(buttonBox).not.toBeNull()
    expect(viewport).not.toBeNull()
    expect(buttonBox?.height).toBeGreaterThanOrEqual(44)
    expect(buttonBox?.x).toBeGreaterThanOrEqual(0)
    expect((buttonBox?.x ?? 0) + (buttonBox?.width ?? 0)).toBeLessThanOrEqual(
      viewport?.width ?? 0,
    )
  }
})

test('wraps a long flock name without horizontal overflow', async ({
  mount,
}) => {
  const component = await mount('components/FlockList/LongName')
  const list = component.getByRole('list', { name: 'Your flocks' })

  await expect(
    component.getByText(
      'Runners Who Meet Before Sunrise Along the Riverside Trail',
    ),
  ).toBeVisible()
  expect(
    await list.evaluate((element) => element.scrollWidth),
  ).toBeLessThanOrEqual(await list.evaluate((element) => element.clientWidth))
})

test('renders no list when the page supplies no flocks', async ({ mount }) => {
  const component = await mount('components/FlockList/Empty')

  await expect(component.getByRole('list')).toHaveCount(0)
})
