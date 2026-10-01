import { expect, test, type Page } from './fixtures'

const otpRoute = '**/auth/v1/otp**'
const oauthRoute = '**/auth/v1/authorize**'
const verifyRoute = '**/auth/v1/verify**'
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
      id: 'runner-id',
      role: 'authenticated',
      user_metadata: {},
    },
  }
}

async function mockSuccessfulOtpRequest(page: Page) {
  await page.route(otpRoute, async (route) => {
    await route.fulfill({ json: {}, status: 200 })
  })
}

async function seedAuthenticatedSession(page: Page, destination?: string) {
  await page.addInitScript(
    ({ destination, session, storageKey }) => {
      window.localStorage.setItem(
        'sb-example-auth-token',
        JSON.stringify(session),
      )

      if (destination) {
        window.sessionStorage.setItem(storageKey, destination)
      }
    },
    {
      destination,
      session: createTestSession(),
      storageKey: authDestinationStorageKey,
    },
  )
}

async function mockSuccessfulOtpVerification(page: Page) {
  await page.route(verifyRoute, async (route) => {
    await route.fulfill({
      json: createTestSession(),
      status: 200,
    })
  })
}

test('redirects an authenticated runner away from sign-in', async ({
  page,
}) => {
  await seedAuthenticatedSession(page, '/?from=invite#members')
  await page.goto('/sign-in')

  await expect(page).toHaveURL('/?from=invite#members')
  await expect(
    page.getByRole('heading', { level: 1, name: 'Sign in to Flock' }),
  ).toHaveCount(0)
  expect(
    await page.evaluate((storageKey) => {
      return window.sessionStorage.getItem(storageKey)
    }, authDestinationStorageKey),
  ).toBeNull()
})

test('moves from email entry to code verification', async ({ page }) => {
  await mockSuccessfulOtpRequest(page)
  await page.goto('/sign-in')

  await expect(page).toHaveTitle('Sign in — Flock')
  await expect(
    page.getByRole('heading', { level: 1, name: 'Sign in to Flock' }),
  ).toBeVisible()

  const emailInput = page.getByRole('textbox', { name: 'Email address' })
  await emailInput.fill('runner@example.com')
  await page.getByRole('button', { name: 'Send code' }).click()

  await expect(
    page.getByRole('heading', { level: 1, name: 'Check your email' }),
  ).toBeVisible()
  await expect(page.getByText('runner@example.com')).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Send another code' }),
  ).toBeDisabled()
  await expect(
    page.getByText('You can request another code in 60 seconds.'),
  ).toBeVisible()
})

for (const provider of ['Google', 'Facebook'] as const) {
  test(`starts ${provider} sign-in with the Flock callback`, async ({
    page,
  }) => {
    let requestUrl = ''
    await page.route(oauthRoute, async (route) => {
      requestUrl = route.request().url()
      await route.fulfill({
        body: `<h1>Mock ${provider} authorization</h1>`,
        contentType: 'text/html',
        status: 200,
      })
    })
    await page.goto('/sign-in')

    await page
      .getByRole('button', { name: `Continue with ${provider}` })
      .click()

    await expect(
      page.getByRole('heading', {
        level: 1,
        name: `Mock ${provider} authorization`,
      }),
    ).toBeVisible()

    const authorizationUrl = new URL(requestUrl)
    expect(authorizationUrl.searchParams.get('provider')).toBe(
      provider.toLowerCase(),
    )
    expect(authorizationUrl.searchParams.get('redirect_to')).toBe(
      'http://127.0.0.1:4199/auth/callback',
    )
  })
}

test('leaves sign-in after email verification creates a session', async ({
  page,
}) => {
  await mockSuccessfulOtpRequest(page)
  await mockSuccessfulOtpVerification(page)
  await page.goto('/?from=email#members')

  await expect(page).toHaveURL('/sign-in')
  expect(
    await page.evaluate((storageKey) => {
      return window.sessionStorage.getItem(storageKey)
    }, authDestinationStorageKey),
  ).toBe('/?from=email#members')

  await page
    .getByRole('textbox', { name: 'Email address' })
    .fill('runner@example.com')
  await page.getByRole('button', { name: 'Send code' }).click()
  await page.getByRole('textbox', { name: 'Six-digit code' }).fill('123456')
  await page.getByRole('button', { name: 'Verify code' }).click()

  await expect(page).toHaveURL('/?from=email#members')
  expect(
    await page.evaluate((storageKey) => {
      return window.sessionStorage.getItem(storageKey)
    }, authDestinationStorageKey),
  ).toBeNull()
})

test('returns to email entry without losing the address', async ({ page }) => {
  await mockSuccessfulOtpRequest(page)
  await page.goto('/sign-in')
  const emailInput = page.getByRole('textbox', { name: 'Email address' })
  await emailInput.fill('runner@example.com')
  await page.getByRole('button', { name: 'Send code' }).click()

  await page.getByRole('button', { name: 'Change email' }).click()

  await expect(
    page.getByRole('heading', { level: 1, name: 'Sign in to Flock' }),
  ).toBeVisible()
  await expect(
    page.getByRole('textbox', { name: 'Email address' }),
  ).toHaveValue('runner@example.com')
})

test('blocks duplicate submission while requesting a code', async ({
  page,
}) => {
  let finishRequest = () => undefined
  const pendingRequest = new Promise<void>((resolve) => {
    finishRequest = resolve
  })
  await page.route(otpRoute, async (route) => {
    await pendingRequest
    await route.fulfill({ json: {}, status: 200 })
  })
  await page.goto('/sign-in')

  const form = page.locator('form')
  const input = page.getByRole('textbox', { name: 'Email address' })
  const button = page.getByRole('button', { name: 'Send code' })
  await input.fill('runner@example.com')
  await button.click()

  await expect(form).toHaveAttribute('aria-busy', 'true')
  await expect(input).toBeDisabled()
  await expect(button).toBeDisabled()

  finishRequest()
  await expect(
    page.getByRole('heading', { level: 1, name: 'Check your email' }),
  ).toBeVisible()
})

test('keeps the email available after a rate-limit failure', async ({
  page,
}) => {
  await page.route(otpRoute, async (route) => {
    await route.fulfill({
      json: {
        code: 'over_email_send_rate_limit',
        message: 'raw provider message',
      },
      status: 429,
    })
  })
  await page.goto('/sign-in')

  const input = page.getByRole('textbox', { name: 'Email address' })
  const button = page.getByRole('button', { name: 'Send code' })
  await input.fill('runner@example.com')
  await button.click()

  await expect(page.getByRole('alert')).toHaveText(
    'Error: Too many codes requested. Wait a moment and try again.',
  )
  await expect(input).toHaveValue('runner@example.com')
  await expect(input).toBeEnabled()
  await expect(button).toBeEnabled()
})

test('keeps the sign-in workflow inside the viewport', async ({ page }) => {
  await page.goto('/sign-in')
  const application = page.getByRole('main', { name: 'Flock application' })
  const submitButton = page.getByRole('button', { name: 'Send code' })
  const googleButton = page.getByRole('button', {
    name: 'Continue with Google',
  })
  const applicationBox = await application.boundingBox()
  const buttonBox = await submitButton.boundingBox()
  const viewport = page.viewportSize()

  expect(applicationBox).not.toBeNull()
  expect(buttonBox).not.toBeNull()
  expect(viewport).not.toBeNull()
  await expect(googleButton).toBeVisible()
  expect(buttonBox?.height).toBeGreaterThanOrEqual(44)
  expect(applicationBox?.x).toBeGreaterThanOrEqual(0)
  expect(
    (applicationBox?.x ?? 0) + (applicationBox?.width ?? 0),
  ).toBeLessThanOrEqual(viewport?.width ?? 0)
  expect(buttonBox?.x).toBeGreaterThanOrEqual(0)
  expect((buttonBox?.x ?? 0) + (buttonBox?.width ?? 0)).toBeLessThanOrEqual(
    viewport?.width ?? 0,
  )
})
