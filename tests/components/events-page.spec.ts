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
