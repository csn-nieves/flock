import { expect, test } from '@playwright/test'

const invitationUrl = 'https://flock.test/invitations/invitation-token'

test('creates a single-use invitation link', async ({ mount }) => {
  const component = await mount('pages/CreateFlockInvitationPage/Default')

  await expect(
    component.getByRole('heading', { level: 1, name: 'Invite a runner' }),
  ).toBeVisible()
  await expect(component.getByText(/expires after 24 hours/)).toBeVisible()
  await component
    .getByRole('button', { name: 'Create invitation link' })
    .click()
  await expect(component.getByTestId('create-count')).toHaveText('1')
})

test('keeps the invitation workflow inside a mobile viewport', async ({
  mount,
  page,
}) => {
  const component = await mount('pages/CreateFlockInvitationPage/Ready')
  const input = component.getByRole('textbox', { name: 'Invitation link' })
  const button = component.getByRole('button', {
    name: 'Copy invitation link',
  })
  const viewport = page.viewportSize()

  expect(viewport).not.toBeNull()

  for (const control of [input, button]) {
    const controlBox = await control.boundingBox()

    expect(controlBox).not.toBeNull()
    expect(controlBox?.height).toBeGreaterThanOrEqual(44)
    expect(controlBox?.x).toBeGreaterThanOrEqual(0)
    expect((controlBox?.x ?? 0) + (controlBox?.width ?? 0)).toBeLessThanOrEqual(
      viewport?.width ?? 0,
    )
  }
})

test('shows creation progress and blocks duplicate activation', async ({
  mount,
}) => {
  const component = await mount('pages/CreateFlockInvitationPage/Creating')
  const button = component.getByRole('button', {
    name: 'Creating invitation',
  })

  await expect(button).toBeDisabled()
  await expect(button).toHaveAttribute('aria-busy', 'true')
  await expect(component.getByRole('status')).toHaveText('Creating invitation')
})

test('shows safe creation recovery', async ({ mount }) => {
  const component = await mount('pages/CreateFlockInvitationPage/Error')

  await expect(component.getByRole('alert')).toContainText(
    'We could not create an invitation. Check your connection and try again.',
  )
  await expect(
    component.getByRole('button', { name: 'Create invitation link' }),
  ).toBeEnabled()
})

test('copies the generated link and announces success', async ({ mount }) => {
  const component = await mount('pages/CreateFlockInvitationPage/Ready')

  await component.getByRole('button', { name: 'Copy invitation link' }).click()
  await expect(component.getByTestId('copied-value')).toHaveText(invitationUrl)
  await expect(component.getByText('Invitation link copied.')).toBeVisible()
})

test('keeps the link selectable when clipboard access fails', async ({
  mount,
}) => {
  const component = await mount('pages/CreateFlockInvitationPage/CopyError')
  const input = component.getByRole('textbox', { name: 'Invitation link' })

  await component.getByRole('button', { name: 'Copy invitation link' }).click()
  await expect(
    component.getByText(
      'We could not copy the link. Select it and copy it manually.',
    ),
  ).toBeVisible()
  await expect(input).toBeFocused()
  await expect(input).toHaveJSProperty('selectionStart', 0)
  await expect(input).toHaveJSProperty('selectionEnd', invitationUrl.length)
})

test('presents query loading, missing, error, and retry states', async ({
  mount,
}) => {
  const loading = await mount('pages/CreateFlockInvitationPage/Loading')
  await expect(loading.getByRole('status')).toHaveText('Loading flock…')

  await loading.unmount()
  const missing = await mount('pages/CreateFlockInvitationPage/NotFound')
  await expect(
    missing.getByRole('heading', { level: 1, name: 'Flock not found' }),
  ).toBeVisible()

  await missing.unmount()
  const error = await mount('pages/CreateFlockInvitationPage/QueryError')
  await error.getByRole('button', { name: 'Try again' }).click()
  await expect(error.getByTestId('page-intent')).toHaveText('retry')

  await error.unmount()
  const retrying = await mount('pages/CreateFlockInvitationPage/Retrying')
  await expect(
    retrying.getByRole('button', { name: 'Trying again' }),
  ).toBeDisabled()
})
