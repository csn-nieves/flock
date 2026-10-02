import { expect, test } from '@playwright/test'

test('shows stable invitation acceptance progress', async ({ mount }) => {
  const component = await mount('pages/AcceptFlockInvitationPage/Joining')

  await expect(
    component.getByRole('heading', { level: 1, name: 'Joining flock' }),
  ).toBeVisible()
  await expect(component.getByRole('status')).toHaveText('Joining flock…')
})

test('keeps invitation acceptance inside a mobile viewport', async ({
  mount,
  page,
}) => {
  const component = await mount('pages/AcceptFlockInvitationPage/Unavailable')
  const section = component.getByRole('region', {
    name: 'Invitation unavailable',
  })
  const sectionBox = await section.boundingBox()
  const viewport = page.viewportSize()

  expect(sectionBox).not.toBeNull()
  expect(viewport).not.toBeNull()
  expect(sectionBox?.x).toBeGreaterThanOrEqual(0)
  expect((sectionBox?.x ?? 0) + (sectionBox?.width ?? 0)).toBeLessThanOrEqual(
    viewport?.width ?? 0,
  )
})

test('explains an unavailable invitation without exposing internals', async ({
  mount,
}) => {
  const component = await mount('pages/AcceptFlockInvitationPage/Unavailable')

  await expect(
    component.getByText(/expired, has already been used, or is not valid/),
  ).toBeVisible()
})

test('offers safe retry after a connection failure', async ({ mount }) => {
  const component = await mount('pages/AcceptFlockInvitationPage/Error')

  await expect(component.getByRole('alert')).toContainText(
    'We could not join the flock. Check your connection and try again.',
  )
  await component.getByRole('button', { name: 'Try again' }).click()
  await expect(component.getByTestId('page-intent')).toHaveText('retry')
})

test('blocks duplicate retry while another attempt is pending', async ({
  mount,
}) => {
  const component = await mount('pages/AcceptFlockInvitationPage/Retrying')
  const button = component.getByRole('button', { name: 'Trying again' })

  await expect(button).toBeDisabled()
  await expect(button).toHaveAttribute('aria-busy', 'true')
})
