import { expect, test } from '@playwright/test'

test('renders populated flocks and reports page intent', async ({ mount }) => {
  const component = await mount('pages/FlocksPage/Populated')

  await expect(
    component.getByRole('heading', { level: 1, name: 'Your flocks' }),
  ).toBeVisible()
  await expect(
    component.getByRole('button', { name: 'Create a flock' }),
  ).toBeVisible()

  await component.getByRole('button', { name: 'Open Weekend Miles' }).click()
  await expect(component.getByTestId('page-intent')).toHaveText(
    'open:weekend-miles-id',
  )
})

test('keeps every populated-page action inside a mobile viewport', async ({
  mount,
  page,
}) => {
  const component = await mount('pages/FlocksPage/Populated')
  const viewport = page.viewportSize()
  const actions = await component.getByRole('button').all()

  expect(viewport).not.toBeNull()

  for (const action of actions) {
    const actionBox = await action.boundingBox()

    expect(actionBox).not.toBeNull()
    expect(actionBox?.height).toBeGreaterThanOrEqual(44)
    expect(actionBox?.x).toBeGreaterThanOrEqual(0)
    expect((actionBox?.x ?? 0) + (actionBox?.width ?? 0)).toBeLessThanOrEqual(
      viewport?.width ?? 0,
    )
  }
})

test('presents a useful empty state and creation intent', async ({ mount }) => {
  const component = await mount('pages/FlocksPage/Empty')

  await expect(
    component.getByRole('heading', { level: 2, name: 'No flocks yet' }),
  ).toBeVisible()
  await expect(component.getByRole('list')).toHaveCount(0)

  await component.getByRole('button', { name: 'Create a flock' }).click()
  await expect(component.getByTestId('page-intent')).toHaveText('create')
})

test('presents a stable loading state', async ({ mount }) => {
  const component = await mount('pages/FlocksPage/Loading')

  await expect(
    component.getByRole('status').filter({ hasText: 'Loading your flocks…' }),
  ).toHaveText('Loading your flocks…')
  await expect(
    component.getByRole('heading', { level: 1, name: 'Your flocks' }),
  ).toBeVisible()
})

test('keeps existing flocks visible during a background refresh', async ({
  mount,
}) => {
  const component = await mount('pages/FlocksPage/Refreshing')

  await expect(
    component.getByRole('button', { name: 'Open Morning Runners' }),
  ).toBeVisible()
  await expect(
    component
      .getByRole('status')
      .filter({ hasText: 'Refreshing your flocks…' }),
  ).toHaveText('Refreshing your flocks…')
})

test('shows safe recovery and reports retry intent', async ({ mount }) => {
  const component = await mount('pages/FlocksPage/Error')

  await expect(component.getByRole('alert')).toContainText(
    'We could not load your flocks. Check your connection and try again.',
  )
  await component.getByRole('button', { name: 'Try again' }).click()
  await expect(component.getByTestId('page-intent')).toHaveText('retry')
})

test('shows retry progress and blocks duplicate activation', async ({
  mount,
}) => {
  const component = await mount('pages/FlocksPage/Retrying')
  const retryButton = component.getByRole('button', { name: 'Trying again' })

  await expect(retryButton).toBeDisabled()
  await expect(retryButton).toHaveAttribute('aria-busy', 'true')
  await expect(
    component.getByRole('status').filter({ hasText: 'Trying again' }),
  ).toHaveText('Trying again')
  await expect(component.getByTestId('page-intent')).toBeEmpty()
})
