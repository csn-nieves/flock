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
  await expect(
    component.getByRole('heading', { name: 'Members' }),
  ).toBeVisible()
  await expect(component.getByText('2 members')).toBeVisible()
  await expect(
    component.getByRole('list', { name: 'Flock members' }),
  ).toBeVisible()
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

test('shows scoped member loading and empty states', async ({ mount }) => {
  const loading = await mount('pages/FlockDetailPage/MembersLoading')

  await expect(loading.getByRole('status')).toHaveText('Loading members…')
  await expect(
    loading.getByRole('heading', { level: 1, name: 'Morning Runners' }),
  ).toBeVisible()

  await loading.unmount()
  const empty = await mount('pages/FlockDetailPage/MembersEmpty')
  await expect(empty.getByText('0 members')).toBeVisible()
  await expect(empty.getByText('No members are visible yet.')).toBeVisible()
})

test('keeps members visible during refresh and refresh failure', async ({
  mount,
}) => {
  const refreshing = await mount('pages/FlockDetailPage/MembersRefreshing')

  await expect(refreshing.getByRole('status')).toHaveText('Refreshing members…')
  await expect(refreshing.getByText('Local Runner')).toBeVisible()

  await refreshing.unmount()
  const failed = await mount('pages/FlockDetailPage/MembersRefreshError')
  await expect(failed.getByText('Local Runner')).toBeVisible()
  await expect(failed.getByRole('alert')).toContainText(
    'The member list may be out of date.',
  )
  await failed.getByRole('button', { name: 'Refresh members' }).click()
  await expect(failed.getByTestId('page-intent')).toHaveText('refresh-members')
})

test('offers member-list recovery without replacing the flock page', async ({
  mount,
}) => {
  const component = await mount('pages/FlockDetailPage/MembersError')

  await expect(
    component.getByRole('heading', { level: 1, name: 'Morning Runners' }),
  ).toBeVisible()
  await expect(component.getByRole('alert')).toContainText(
    'We could not load the member list. Check your connection and try again.',
  )
  await component.getByRole('button', { name: 'Try again' }).click()
  await expect(component.getByTestId('page-intent')).toHaveText('retry-members')
})
