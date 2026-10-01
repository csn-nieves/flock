import { expect, test, type Page } from '@playwright/test'

const acceptInvitationRoute = '**/rest/v1/rpc/accept_flock_invitation'
const authDestinationStorageKey = 'flock.auth.destination'

function createTestSession() {
  const expiresInSeconds = 60 * 60

  return {
    access_token: 'test-access-token',
    expires_at: Math.floor(Date.now() / 1000) + expiresInSeconds,
    expires_in: expiresInSeconds,
    refresh_token: 'test-refresh-token',
    token_type: 'bearer',
    user: {
      app_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      id: 'invited-runner-id',
      role: 'authenticated',
      user_metadata: {},
    },
  }
}

async function seedAuthenticatedSession(page: Page) {
  await page.addInitScript((session) => {
    window.localStorage.setItem(
      'sb-example-auth-token',
      JSON.stringify(session),
    )
  }, createTestSession())
}

test('preserves an invitation destination through sign-in', async ({
  page,
}) => {
  await page.goto('/invitations/invitation-token')

  await expect(page).toHaveURL('/sign-in')
  expect(
    await page.evaluate((storageKey) => {
      return window.sessionStorage.getItem(storageKey)
    }, authDestinationStorageKey),
  ).toBe('/invitations/invitation-token')
})

test('accepts an invitation once and opens the joined flock', async ({
  page,
}) => {
  let finishAcceptance = () => undefined
  const acceptanceRequested = new Promise<void>((resolve) => {
    finishAcceptance = resolve
  })
  let requestBody: unknown

  await seedAuthenticatedSession(page)
  await page.route(acceptInvitationRoute, async (route) => {
    requestBody = route.request().postDataJSON()
    await acceptanceRequested
    await route.fulfill({
      json: {
        id: 'morning-runners-id',
        name: 'Morning Runners',
        owner_id: 'owner-id',
      },
      status: 200,
    })
  })
  await page.goto('/invitations/invitation-token')

  await expect(page).toHaveTitle('Joining flock… — Flock')
  await expect(page.getByRole('status')).toHaveText('Joining flock…')
  expect(requestBody).toEqual({ invitation_token: 'invitation-token' })

  finishAcceptance()
  await expect(page).toHaveURL('/flocks/morning-runners-id')
  await expect(page).toHaveTitle('Morning Runners — Flock')
  await expect(
    page.getByRole('heading', { level: 1, name: 'Morning Runners' }),
  ).toBeVisible()
})

test('shows the same safe result for an unavailable invitation', async ({
  page,
}) => {
  await seedAuthenticatedSession(page)
  await page.route(acceptInvitationRoute, async (route) => {
    await route.fulfill({
      json: {
        code: 'P0002',
        details: null,
        hint: null,
        message: 'raw database message',
      },
      status: 400,
    })
  })
  await page.goto('/invitations/unavailable-token')

  await expect(page).toHaveTitle('Invitation unavailable — Flock')
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: 'Invitation unavailable',
    }),
  ).toBeVisible()
  await expect(page.getByText('raw database message')).toHaveCount(0)
})
