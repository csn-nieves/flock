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
