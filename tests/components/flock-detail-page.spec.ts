import { expect, test } from '@playwright/test'

test('renders the visible flock identity', async ({ mount }) => {
  const component = await mount('pages/FlockDetailPage/Loaded')

  await expect(
    component.getByRole('heading', { level: 1, name: 'Morning Runners' }),
  ).toBeVisible()
  await expect(
    component.getByRole('button', { name: 'Invite a runner' }),
  ).toBeVisible()
  await expect(component.getByText('Your run club.')).toBeVisible()
})

test('keeps the detail screen inside a mobile viewport', async ({
  mount,
  page,
}) => {
  const component = await mount('pages/FlockDetailPage/Loaded')
  const section = component.getByRole('region', { name: 'Morning Runners' })
  const sectionBox = await section.boundingBox()
  const viewport = page.viewportSize()

  expect(sectionBox).not.toBeNull()
  expect(viewport).not.toBeNull()
  expect(sectionBox?.x).toBeGreaterThanOrEqual(0)
  expect((sectionBox?.x ?? 0) + (sectionBox?.width ?? 0)).toBeLessThanOrEqual(
    viewport?.width ?? 0,
  )
})

test('presents loading and background refresh distinctly', async ({
  mount,
}) => {
  const loading = await mount('pages/FlockDetailPage/Loading')

  await expect(loading.getByRole('status')).toHaveText('Loading flock…')

  await loading.unmount()
  const refreshing = await mount('pages/FlockDetailPage/Refreshing')
  await expect(refreshing.getByRole('status')).toHaveText('Refreshing flock…')
  await expect(
    refreshing.getByRole('heading', { level: 1, name: 'Morning Runners' }),
  ).toBeVisible()
})

test('presents missing or inaccessible flocks without disclosing which', async ({
  mount,
}) => {
  const component = await mount('pages/FlockDetailPage/NotFound')

  await expect(
    component.getByRole('heading', { level: 1, name: 'Flock not found' }),
  ).toBeVisible()
  await expect(component.getByText(/may not have access/)).toBeVisible()
})

test('shows safe recovery and reports retry intent', async ({ mount }) => {
  const component = await mount('pages/FlockDetailPage/Error')

  await expect(component.getByRole('alert')).toContainText(
    'We could not load this flock. Check your connection and try again.',
  )
  await component.getByRole('button', { name: 'Try again' }).click()
  await expect(component.getByTestId('page-intent')).toHaveText('retry')
})

test('shows retry progress and blocks duplicate activation', async ({
  mount,
}) => {
  const component = await mount('pages/FlockDetailPage/Retrying')
  const retryButton = component.getByRole('button', { name: 'Trying again' })

  await expect(retryButton).toBeDisabled()
  await expect(retryButton).toHaveAttribute('aria-busy', 'true')
  await expect(component.getByRole('status')).toHaveText('Trying again')
})
