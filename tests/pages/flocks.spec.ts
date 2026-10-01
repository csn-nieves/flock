import { expect, test, type Page } from '@playwright/test'

const flocksRoute = '**/rest/v1/flocks**'

type TestFlock = {
  id: string
  name: string
  owner_id: string
}

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

async function seedAuthenticatedSession(page: Page) {
  await page.addInitScript((session) => {
    window.localStorage.setItem(
      'sb-example-auth-token',
      JSON.stringify(session),
    )
  }, createTestSession())
}

async function mockFlockWorkflow(page: Page) {
  const flocks: TestFlock[] = []

  await page.route(flocksRoute, async (route) => {
    const request = route.request()
    const url = new URL(request.url())

    if (request.method() === 'POST') {
      const requestBody = request.postDataJSON() as { name: string }
      const createdFlock = {
        id: 'sunrise-striders-id',
        name: requestBody.name,
        owner_id: 'runner-id',
      }

      flocks.push(createdFlock)
      await route.fulfill({ json: createdFlock, status: 201 })
      return
    }

    const requestedId = url.searchParams.get('id')?.replace(/^eq\./, '')

    if (requestedId) {
      const flock = flocks.find(({ id }) => id === requestedId)

      await route.fulfill({
        json: flock ?? null,
        status: 200,
      })
      return
    }

    await route.fulfill({ json: flocks, status: 200 })
  })
}

test('routes through the complete flock list, create, and detail workflow', async ({
  page,
}) => {
  await seedAuthenticatedSession(page)
  await mockFlockWorkflow(page)
  await page.goto('/')

  await expect(page).toHaveURL('/')
  await expect(page).toHaveTitle('Your flocks — Flock')
  await expect(
    page.getByRole('heading', { level: 2, name: 'No flocks yet' }),
  ).toBeVisible()

  await page.getByRole('button', { name: 'Create a flock' }).click()
  await expect(page).toHaveURL('/flocks/new')
  await expect(page).toHaveTitle('Create a flock — Flock')

  await page
    .getByRole('textbox', { name: 'Flock name' })
    .fill('Sunrise Striders')
  await page.getByRole('button', { name: 'Create flock' }).click()

  await expect(page).toHaveURL('/flocks/sunrise-striders-id')
  await expect(page).toHaveTitle('Sunrise Striders — Flock')
  await expect(
    page.getByRole('heading', { level: 1, name: 'Sunrise Striders' }),
  ).toBeVisible()

  await page.goBack()
  await expect(page).toHaveURL('/')
  await expect(
    page.getByRole('button', { name: 'Open Sunrise Striders' }),
  ).toBeVisible()

  await page.getByRole('button', { name: 'Open Sunrise Striders' }).click()
  await expect(page).toHaveURL('/flocks/sunrise-striders-id')
})
