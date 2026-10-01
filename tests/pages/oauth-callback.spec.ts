import { expect, test, type Page } from './fixtures'

const tokenRoute = '**/auth/v1/token**'
const authDestinationStorageKey = 'flock.auth.destination'
const codeVerifierStorageKey = 'sb-example-auth-token-code-verifier'

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
      id: 'runner-id',
      role: 'authenticated',
      user_metadata: {},
    },
  }
}

async function seedOAuthState(page: Page, destination: string) {
  await page.addInitScript(
    ({ destination, destinationKey, verifierKey }) => {
      window.sessionStorage.setItem(destinationKey, destination)
      window.localStorage.setItem(
        verifierKey,
        JSON.stringify('test-code-verifier'),
      )
    },
    {
      destination,
      destinationKey: authDestinationStorageKey,
      verifierKey: codeVerifierStorageKey,
    },
  )
}

test('exchanges the code once and returns to the saved destination', async ({
  page,
}) => {
  let finishExchange = () => undefined
  let exchangeBody: unknown
  let exchangeRequests = 0
  const pendingExchange = new Promise<void>((resolve) => {
    finishExchange = resolve
  })
  await seedOAuthState(page, '/?from=social#members')
  await page.route(tokenRoute, async (route) => {
    exchangeRequests += 1
    exchangeBody = route.request().postDataJSON()
    await pendingExchange
    await route.fulfill({
      json: createTestSession(),
      status: 200,
    })
  })

  await page.goto('/auth/callback?code=callback-authorization-code')

  await expect(page).toHaveTitle('Finishing sign-in — Flock')
  await expect(
    page.getByRole('heading', { level: 1, name: 'Finishing sign-in' }),
  ).toBeVisible()
  await expect(page).toHaveURL('/auth/callback')

  finishExchange()

  await expect(page).toHaveURL('/?from=social#members')
  expect(exchangeBody).toEqual({
    auth_code: 'callback-authorization-code',
    code_verifier: 'test-code-verifier',
  })
  expect(exchangeRequests).toBe(1)
  expect(
    await page.evaluate((storageKey) => {
      return window.sessionStorage.getItem(storageKey)
    }, authDestinationStorageKey),
  ).toBeNull()
  expect(
    await page.evaluate((storageKey) => {
      return window.localStorage.getItem(storageKey)
    }, codeVerifierStorageKey),
  ).toBeNull()
})

test('preserves the destination after a failed code exchange', async ({
  page,
}) => {
  await seedOAuthState(page, '/?from=social#members')
  await page.route(tokenRoute, async (route) => {
    await route.fulfill({
      json: {
        error: 'invalid_grant',
        error_description: 'raw provider message',
      },
      status: 400,
    })
  })

  await page.goto('/auth/callback?code=expired-code')

  await expect(page).toHaveTitle('Sign-in problem — Flock')
  await expect(
    page.getByRole('heading', { level: 1, name: 'Sign-in did not finish' }),
  ).toBeVisible()
  await expect(page.getByRole('alert')).toHaveText(
    'We could not finish social sign-in. Return to sign in and try again.',
  )
  await expect(page.getByText('raw provider message')).toHaveCount(0)
  await expect(page).toHaveURL('/auth/callback')
  expect(
    await page.evaluate((storageKey) => {
      return window.sessionStorage.getItem(storageKey)
    }, authDestinationStorageKey),
  ).toBe('/?from=social#members')

  await page.getByRole('button', { name: 'Return to sign in' }).click()

  await expect(page).toHaveURL('/sign-in')
})

test('handles provider cancellation without exchanging a code', async ({
  page,
}) => {
  let tokenRequests = 0
  await page.route(tokenRoute, async (route) => {
    tokenRequests += 1
    await route.abort()
  })

  await page.goto(
    '/auth/callback?error=access_denied&error_description=raw-provider-message',
  )

  await expect(page).toHaveTitle('Sign-in problem — Flock')
  await expect(page.getByRole('alert')).toHaveText(
    'Social sign-in was canceled or could not be completed. Return to sign in and try again.',
  )
  await expect(page.getByText('raw-provider-message')).toHaveCount(0)
  await expect(page).toHaveURL('/auth/callback')
  expect(tokenRequests).toBe(0)
})
