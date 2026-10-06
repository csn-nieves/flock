import { type Page, type Route } from '@playwright/test'

import { expect, test } from './fixtures'

const flocksRoute = '**/rest/v1/flocks**'
const flockMembersRoute = '**/rest/v1/rpc/list_flock_members'
const flockEventsRoute = '**/rest/v1/flock_events**'
const flockAttendanceRoute = '**/rest/v1/flock_event_attendance**'

type TestFlock = {
  description: string
  id: string
  location: string
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
  await page.addInitScript((session: ReturnType<typeof createTestSession>) => {
    window.localStorage.setItem(
      'sb-example-auth-token',
      JSON.stringify(session),
    )
  }, createTestSession())
}

async function mockFlockWorkflow(page: Page) {
  const flocks: TestFlock[] = []

  await page.route(flocksRoute, async (route: Route) => {
    const request = route.request()
    const url = new URL(request.url())

    if (request.method() === 'POST') {
      const requestBody = request.postDataJSON() as {
        description: string
        location: string
        name: string
      }
      const createdFlock = {
        description: requestBody.description,
        id: 'sunrise-striders-id',
        location: requestBody.location,
        name: requestBody.name,
        owner_id: 'runner-id',
      }

      flocks.push(createdFlock)
      await route.fulfill({ json: createdFlock, status: 201 })
      return
    }

    if (request.method() === 'PATCH') {
      const requestBody = request.postDataJSON() as {
        description: string
        location: string
        name: string
      }
      const requestedId = url.searchParams.get('id')?.replace(/^eq\./, '')
      const flock = flocks.find(({ id }) => id === requestedId)

      if (!flock) {
        await route.fulfill({ json: null, status: 404 })
        return
      }

      Object.assign(flock, requestBody)
      await route.fulfill({ json: flock, status: 200 })
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

  await page.route(flockMembersRoute, async (route: Route) => {
    await route.fulfill({
      json: [
        {
          display_name: 'Local Runner',
          joined_at: '2026-01-01T12:00:00.000Z',
          role: 'owner',
          user_id: 'runner-id',
        },
      ],
      status: 200,
    })
  })

  await page.route(flockEventsRoute, async (route: Route) => {
    await route.fulfill({ json: [], status: 200 })
  })
  await page.route(flockAttendanceRoute, async (route: Route) => {
    await route.fulfill({ json: [], status: 200 })
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
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('button', { name: 'Close dialog' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)

  await page.getByRole('button', { name: 'Create a flock' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()

  await page
    .getByRole('textbox', { name: 'Flock name' })
    .fill('Sunrise Striders')
  await page
    .getByRole('textbox', { name: 'Location' })
    .fill('Eastbank Esplanade, Portland')
  await page
    .getByRole('textbox', { name: 'Description' })
    .fill('Friendly sunrise miles for every pace.')
  await page.getByRole('button', { name: 'Create flock' }).click()

  await expect(page).toHaveURL('/flocks/sunrise-striders-id')
  await expect(page).toHaveTitle('Sunrise Striders — Flock')
  await expect(
    page.getByRole('heading', { level: 1, name: 'Sunrise Striders' }),
  ).toBeVisible()
  await expect(page.getByText('Eastbank Esplanade, Portland')).toBeVisible()
  await expect(
    page.getByText('Friendly sunrise miles for every pace.'),
  ).toBeVisible()

  await page.getByRole('button', { name: 'Edit flock details' }).click()
  const editDialog = page.getByRole('dialog', { name: 'Edit flock details' })
  await editDialog.getByLabel('Location').fill('Mount Tabor, Portland')
  await editDialog
    .getByLabel('Description')
    .fill('Welcoming hill loops with a regroup after every climb.')
  await editDialog.getByRole('button', { name: 'Save changes' }).click()
  await expect(page.getByRole('status')).toHaveText('Flock details saved.')
  await expect(page.getByText('Mount Tabor, Portland')).toBeVisible()
  await page.getByRole('button', { name: 'Show' }).click()
  await expect(page.getByRole('list', { name: 'Flock members' })).toContainText(
    'Local Runner',
  )

  await page.getByRole('link', { name: 'Flock home' }).click()
  await expect(page).toHaveURL('/flocks')
  await expect(
    page.getByRole('button', { name: 'Open Sunrise Striders' }),
  ).toBeVisible()

  await page.getByRole('button', { name: 'Open Sunrise Striders' }).click()
  await expect(page).toHaveURL('/flocks/sunrise-striders-id')

  await page.getByRole('button', { name: 'Invite a runner' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Create invitation link' }),
  ).toBeVisible()
})
