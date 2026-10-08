import { expect, test } from '@playwright/test'

test('keeps audience search focused while controlled results update', async ({
  mount,
}) => {
  const component = await mount('pages/EventsPage/InvitationAudience')

  await component.getByRole('button', { name: 'Invite runners' }).click()
  const runnerSearch = component.getByRole('textbox', {
    name: 'Search runners',
  })
  await runnerSearch.pressSequentially('maya')

  await expect(runnerSearch).toBeFocused()
  await expect(runnerSearch).toHaveValue('maya')
  await expect(
    component.getByRole('button', { name: 'Maya Chen' }),
  ).toBeVisible()

  await component.getByRole('button', { name: 'A whole flock' }).click()
  const flockSearch = component.getByRole('textbox', {
    name: 'Search flocks',
  })
  await flockSearch.pressSequentially('harbor')

  await expect(flockSearch).toBeFocused()
  await expect(flockSearch).toHaveValue('harbor')
  await expect(
    component.getByRole('button', { name: 'Harbor Long Run' }),
  ).toBeVisible()
})

test('shows an actionable flock invitation across supported viewports', async ({
  mount,
  page,
}) => {
  const component = await mount('pages/EventsPage/PendingInvitation')

  await expect(
    component.getByRole('heading', { name: 'Event invitations' }),
  ).toBeVisible()
  await expect(
    component.getByText('Invited with Harbor Long Run'),
  ).toBeVisible()

  const acceptButton = component.getByRole('button', {
    name: 'Accept invitation',
  })
  await expect(acceptButton).toBeVisible()

  const viewport = page.viewportSize()
  const box = await acceptButton.boundingBox()
  expect(viewport).not.toBeNull()
  expect(box).not.toBeNull()
  expect(box?.height).toBeGreaterThanOrEqual(44)
  expect(box?.x).toBeGreaterThanOrEqual(0)
  expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(
    viewport?.width ?? 0,
  )
})

test('opens a mapped personal-event route across supported viewports', async ({
  mount,
  page,
}) => {
  await page.route('https://tiles.openfreemap.org/**', (route) => route.abort())
  const component = await mount('pages/EventsPage/MappedRoute')

  await expect(component.getByText('Mapped route · 5.00 mi')).toBeVisible()
  const viewMap = component.getByRole('button', { name: 'View map' })
  await viewMap.click()

  await expect(
    component.getByRole('dialog', { name: 'Event route' }),
  ).toBeVisible()
  await expect(
    component.getByRole('group', { name: 'Event route map' }),
  ).toBeVisible()

  const viewport = page.viewportSize()
  const mapBox = await component
    .getByRole('group', { name: 'Event route map' })
    .boundingBox()
  expect(viewport).not.toBeNull()
  expect(mapBox).not.toBeNull()
  expect(mapBox?.x).toBeGreaterThanOrEqual(0)
  expect((mapBox?.x ?? 0) + (mapBox?.width ?? 0)).toBeLessThanOrEqual(
    viewport?.width ?? 0,
  )
  if ((viewport?.width ?? 0) >= 640) {
    expect(mapBox?.height).toBe(416)
  } else {
    expect(mapBox?.height).toBe(256)
  }
})

test('offers a run-at-your-own-pace event option across supported viewports', async ({
  mount,
}) => {
  const component = await mount('pages/EventsPage/OwnPaceCreate')

  await component.getByRole('button', { name: 'Create event' }).click()
  await component.getByRole('radio', { name: 'Run at your own pace' }).click()

  await expect(
    component.getByRole('radio', { name: 'Run at your own pace' }),
  ).toBeChecked()
  await expect(
    component.getByText(
      'Runners choose this distance and complete it at their own pace.',
    ),
  ).toBeVisible()
  await expect(
    component.getByRole('spinbutton', {
      name: 'Pace minutes for option 1',
    }),
  ).toHaveCount(0)
})

test('repeats an event with a fresh required date across supported viewports', async ({
  mount,
  page,
}) => {
  await page.route('https://tiles.openfreemap.org/**', (route) => route.abort())
  const component = await mount('pages/EventsPage/RepeatEvent')

  await component.getByRole('button', { name: 'Repeat event' }).click()
  const dialog = component.getByRole('dialog', { name: 'Repeat event' })

  await expect(dialog.getByLabel('Title')).toHaveValue('Saturday social run')
  await expect(dialog.getByLabel('Location')).toHaveValue('Riverside Park')
  await expect(dialog.getByLabel('Date and time')).toHaveValue('')
  await expect(dialog.getByText('Mapped route')).toBeVisible()
  await expect(
    dialog.getByText(/invitations and responses will not be copied/),
  ).toBeVisible()

  const dialogBox = await dialog.boundingBox()
  const viewport = page.viewportSize()
  expect(dialogBox).not.toBeNull()
  expect(viewport).not.toBeNull()
  expect(dialogBox?.x).toBeGreaterThanOrEqual(0)
  expect((dialogBox?.x ?? 0) + (dialogBox?.width ?? 0)).toBeLessThanOrEqual(
    viewport?.width ?? 0,
  )

  await dialog.getByLabel('Date and time').fill('2026-10-17T08:30')
  await dialog.getByRole('button', { name: 'Create event' }).click()
  await expect(component.getByRole('status')).toHaveText(
    'Created Saturday social run',
  )
})
