import { expect, test } from '@playwright/test'

test('selects one runner or a whole flock', async ({ mount }) => {
  const component = await mount('components/EventAudiencePicker/Interactive')
  const search = component.getByRole('textbox', { name: 'Search runners' })

  await search.fill('maya')
  await component.getByRole('button', { name: 'Maya Chen' }).click()
  await expect(component.getByTestId('audience-selection')).toHaveText(
    'runner:maya-id',
  )

  await component.getByRole('button', { name: 'A whole flock' }).click()
  const flockSearch = component.getByRole('textbox', {
    name: 'Search flocks',
  })
  await flockSearch.fill('harbor')
  await component.getByRole('button', { name: 'Harbor Long Run' }).click()
  await expect(component.getByTestId('audience-selection')).toHaveText(
    'flock:harbor-id',
  )
})

test('explains live flock membership and clears flock search', async ({
  mount,
}) => {
  const component = await mount('components/EventAudiencePicker/Interactive')

  await component.getByRole('button', { name: 'A whole flock' }).click()
  const flockSearch = component.getByRole('textbox', {
    name: 'Search flocks',
  })
  await flockSearch.fill('harbor')

  await expect(
    component.getByText(/including anyone who joins before it expires/),
  ).toBeVisible()
  await component.getByRole('button', { name: 'Clear flock search' }).click()
  await expect(flockSearch).toBeFocused()
  await expect(flockSearch).toHaveValue('')
})

test('keeps controls usable in mobile viewports', async ({ mount, page }) => {
  const component = await mount('components/EventAudiencePicker/Interactive')
  const viewport = page.viewportSize()

  expect(viewport).not.toBeNull()

  for (const control of await component
    .getByRole('button', { name: /One runner|A whole flock|Cancel/ })
    .all()) {
    const box = await control.boundingBox()

    expect(box).not.toBeNull()
    expect(box?.height).toBeGreaterThanOrEqual(44)
    expect(box?.x).toBeGreaterThanOrEqual(0)
    expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(
      viewport?.width ?? 0,
    )
  }
})

test('blocks duplicate selection while invitations are being created', async ({
  mount,
}) => {
  const component = await mount('components/EventAudiencePicker/Creating')

  await expect(component.getByRole('status')).toHaveText('Creating invitation…')
  await expect(
    component.getByRole('button', { name: 'Harbor Long Run' }),
  ).toBeDisabled()
  await expect(
    component.getByRole('textbox', { name: 'Search flocks' }),
  ).toBeDisabled()
})
