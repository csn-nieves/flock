import { expect, test, type Page } from '@playwright/test'

const otpRoute = '**/auth/v1/otp**'

async function mockSuccessfulOtpRequest(page: Page) {
  await page.route(otpRoute, async (route) => {
    await route.fulfill({ json: {}, status: 200 })
  })
}

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
  const applicationBox = await application.boundingBox()
  const buttonBox = await submitButton.boundingBox()
  const viewport = page.viewportSize()

  expect(applicationBox).not.toBeNull()
  expect(buttonBox).not.toBeNull()
  expect(viewport).not.toBeNull()
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
