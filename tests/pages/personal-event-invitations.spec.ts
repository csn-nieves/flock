import {
  devices,
  type BrowserContext,
  type Page,
  type Route,
} from '@playwright/test'

import { expect, test } from './fixtures'

const organizerId = 'organizer-id'
const runnerId = 'runner-id'
const flockId = 'sunrise-striders-id'
const eventId = 'weekend-long-run-id'
const invitationId = 'weekend-long-run-invitation-id'
const runOptionId = 'weekend-long-run-option-id'
const eventTitle = 'Weekend long run'

type EventResponse = 'in' | 'maybe' | 'out'

type EventRow = {
  canceled_at: null
  created_at: string
  created_by: string
  description: string
  flock_id: null
  id: string
  location: string
  starts_at: string
  title: string
}

type JourneyState = {
  accepted: boolean
  acceptanceRequest?: unknown
  event?: EventRow
  invitationRequest?: unknown
  invitationCreated: boolean
  runOptions: Array<{
    distanceTenths: number
    paceSeconds: number
    unit: 'mi' | 'km'
  }>
  responseRequest?: unknown
  responses: Record<string, EventResponse>
}

function createTestSession(userId: string, displayName: string) {
  const expiresInSeconds = 60 * 60

  return {
    access_token: `test-access-token-${userId}`,
    expires_at: Math.floor(Date.now() / 1000) + expiresInSeconds,
    expires_in: expiresInSeconds,
    refresh_token: `test-refresh-token-${userId}`,
    token_type: 'bearer',
    user: {
      app_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      id: userId,
      role: 'authenticated',
      user_metadata: { display_name: displayName },
    },
  }
}

async function seedAuthenticatedSession(
  page: Page,
  userId: string,
  displayName: string,
) {
  await page.addInitScript(
    ({ session }) => {
      window.localStorage.setItem(
        'sb-example-auth-token',
        JSON.stringify(session),
      )
    },
    { session: createTestSession(userId, displayName) },
  )
}

async function installJourneyRoutes(
  page: Page,
  userId: string,
  state: JourneyState,
) {
  await page.route('**/auth/v1/user', async (route: Route) => {
    await route.fulfill({
      json: { user: createTestSession(userId, 'Test Runner').user },
      status: 200,
    })
  })

  await page.route('**/rest/v1/profiles**', async (route: Route) => {
    await route.fulfill({
      json: [
        {
          display_name: 'Test Runner',
          location: null,
          updated_at: '2099-01-01T00:00:00.000Z',
          user_id: userId,
        },
      ],
      status: 200,
    })
  })

  await page.route(
    '**/storage/v1/object/sign/flock-media/**',
    async (route: Route) => {
      await route.fulfill({
        json: {
          signedURL: 'http://127.0.0.1:4199/mock-profile-image.svg',
        },
        status: 200,
      })
    },
  )

  await page.route('**/mock-profile-image.svg', async (route: Route) => {
    await route.fulfill({
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1" />',
      contentType: 'image/svg+xml',
      status: 200,
    })
  })

  await page.route(
    '**/rest/v1/rpc/list_my_flock_chats',
    async (route: Route) => {
      await route.fulfill({ json: [], status: 200 })
    },
  )

  await page.route(
    '**/rest/v1/rpc/list_my_direct_conversations',
    async (route: Route) => {
      await route.fulfill({ json: [], status: 200 })
    },
  )

  await page.route('**/rest/v1/saved_routes**', async (route: Route) => {
    await route.fulfill({ json: [], status: 200 })
  })

  await page.route('**/rest/v1/flock_events**', async (route: Route) => {
    const eventIsVisible =
      state.event &&
      (userId === organizerId || (userId === runnerId && state.accepted))
    await route.fulfill({
      json: eventIsVisible ? [state.event] : [],
      status: 200,
    })
  })

  await page.route(
    '**/rest/v1/flock_event_attendance**',
    async (route: Route) => {
      await route.fulfill({
        json: Object.entries(state.responses).map(
          ([responseUserId, response]) => ({
            event_id: eventId,
            response,
            run_option_id: runOptionId,
            user_id: responseUserId,
          }),
        ),
        status: 200,
      })
    },
  )

  await page.route('**/rest/v1/flock_event_run_options**', async (route) => {
    await route.fulfill({
      json: state.event
        ? state.runOptions.map((option, position) => ({
            distance_label: `${option.distanceTenths / 10} ${option.unit}`,
            distance_tenths: option.distanceTenths,
            distance_unit: option.unit,
            event_id: eventId,
            id: runOptionId,
            pace_label: `${Math.floor(option.paceSeconds / 60)}:${String(option.paceSeconds % 60).padStart(2, '0')}/${option.unit}`,
            pace_seconds: option.paceSeconds,
            pace_unit: option.unit,
            position,
          }))
        : [],
      status: 200,
    })
  })

  await page.route('**/rest/v1/rpc/create_user_event', async (route: Route) => {
    const input = route.request().postDataJSON() as {
      event_description: string
      event_location: string
      event_starts_at: string
      event_title: string
      event_run_options: JourneyState['runOptions']
    }
    state.runOptions = input.event_run_options
    state.event = {
      canceled_at: null,
      created_at: new Date().toISOString(),
      created_by: organizerId,
      description: input.event_description,
      flock_id: null,
      id: eventId,
      location: input.event_location,
      starts_at: input.event_starts_at,
      title: input.event_title,
    }
    await route.fulfill({ json: state.event, status: 200 })
  })

  await page.route('**/rest/v1/rpc/search_flocks', async (route: Route) => {
    await route.fulfill({
      json: [{ id: flockId, name: 'Sunrise Striders', owner_id: organizerId }],
      status: 200,
    })
  })

  await page.route(
    '**/rest/v1/rpc/create_flock_event_invitation',
    async (route: Route) => {
      state.invitationRequest = route.request().postDataJSON()
      state.invitationCreated = true
      await route.fulfill({
        json: {
          expires_at: '2099-06-17T10:30:00.000Z',
          token: 'universal-flock-event-token',
        },
        status: 200,
      })
    },
  )

  await page.route(
    '**/rest/v1/rpc/list_pending_event_invitations',
    async (route: Route) => {
      const canSeeInvitation =
        userId === runnerId &&
        state.invitationCreated &&
        !state.accepted &&
        state.event
      await route.fulfill({
        json: canSeeInvitation
          ? [
              {
                audience_name: 'Sunrise Striders',
                event_description: state.event?.description,
                event_id: eventId,
                event_location: state.event?.location,
                event_starts_at: state.event?.starts_at,
                event_title: state.event?.title,
                expires_at: '2099-06-17T10:30:00.000Z',
                invitation_id: invitationId,
                invitation_kind: 'flock',
              },
            ]
          : [],
        status: 200,
      })
    },
  )

  await page.route(
    '**/rest/v1/rpc/accept_event_invitation_by_id',
    async (route: Route) => {
      state.acceptanceRequest = route.request().postDataJSON()
      state.accepted = true
      await route.fulfill({ json: state.event, status: 200 })
    },
  )

  await page.route(
    '**/rest/v1/rpc/set_flock_event_response',
    async (route: Route) => {
      const input = route.request().postDataJSON() as {
        next_response: EventResponse
      }
      state.responseRequest = input
      state.responses[userId] = input.next_response
      await route.fulfill({ json: true, status: 200 })
    },
  )
}

async function rejectUnexpectedRestRequests(page: Page) {
  await page.route('**/rest/**', async (route: Route) => {
    const request = route.request()
    throw new Error(
      `Unhandled Supabase request: ${request.method()} ${request.url()}. Add an explicit page.route mock for this request.`,
    )
  })
}

function collectConsoleProblems(page: Page) {
  const problems: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') {
      problems.push(`${message.type()}: ${message.text()}`)
    }
  })
  page.on('pageerror', (error) => {
    problems.push(`pageerror: ${error.message}`)
  })
  page.on('requestfailed', (request) => {
    problems.push(
      `requestfailed: ${request.url()} — ${request.failure()?.errorText ?? 'unknown'}`,
    )
  })
  return problems
}

function runnerDevice(projectName: string) {
  if (projectName === 'pages-android') return devices['Pixel 10']
  if (projectName === 'pages-iphone') return devices['iPhone 17']
  return devices['Desktop Chrome']
}

test('carries a whole-flock invitation from organizer to runner RSVP', async ({
  browser,
  page: organizerPage,
}, testInfo) => {
  const state: JourneyState = {
    accepted: false,
    invitationCreated: false,
    runOptions: [],
    responses: {},
  }
  const organizerConsoleProblems = collectConsoleProblems(organizerPage)
  let runnerContext: BrowserContext | undefined

  try {
    await seedAuthenticatedSession(
      organizerPage,
      organizerId,
      'Olivia Organizer',
    )
    await installJourneyRoutes(organizerPage, organizerId, state)
    await organizerPage.goto('/events')

    await expect(organizerPage).toHaveTitle('Your events — Flock')
    await expect(
      organizerPage.getByRole('heading', { level: 1, name: 'Your events' }),
    ).toBeVisible()
    await organizerPage.getByRole('button', { name: 'Create event' }).click()

    const createDialog = organizerPage.getByRole('dialog', {
      name: 'Create an event',
    })
    await createDialog.getByLabel('Title').fill(eventTitle)
    await createDialog.getByLabel('Date and time').fill('2099-06-10T06:30')
    await createDialog.getByLabel('Location').fill('Riverfront trailhead')
    await createDialog
      .getByLabel('Description')
      .fill('Easy miles followed by coffee.')
    await createDialog.getByRole('button', { name: 'Create event' }).click()

    const organizerEvent = organizerPage
      .getByRole('listitem')
      .filter({ hasText: eventTitle })
    await expect(organizerEvent).toBeVisible()
    await organizerEvent.getByRole('button', { name: 'Invite runners' }).click()

    const audienceDialog = organizerPage.getByRole('dialog', {
      name: 'Choose an audience',
    })
    await audienceDialog.getByRole('button', { name: 'A whole flock' }).click()
    await audienceDialog
      .getByRole('textbox', { name: 'Search flocks' })
      .fill('sun')
    await audienceDialog
      .getByRole('button', { name: 'Sunrise Striders' })
      .click()

    const sentDialog = organizerPage.getByRole('dialog', {
      name: 'Invitation sent',
    })
    await expect(sentDialog).toContainText(
      'Sunrise Striders members will see this invitation in Flock.',
    )
    await expect(sentDialog).toContainText(
      'Each eligible flock member can accept once.',
    )

    runnerContext = await browser.newContext({
      ...runnerDevice(testInfo.project.name),
      baseURL: testInfo.project.use.baseURL as string,
      serviceWorkers: 'block',
    })
    const runnerPage = await runnerContext.newPage()
    const runnerConsoleProblems = collectConsoleProblems(runnerPage)
    await rejectUnexpectedRestRequests(runnerPage)
    await seedAuthenticatedSession(runnerPage, runnerId, 'Riley Runner')
    await installJourneyRoutes(runnerPage, runnerId, state)
    await runnerPage.goto('/events')

    await expect(runnerPage).toHaveTitle('Your events — Flock')
    const invitation = runnerPage
      .getByRole('listitem')
      .filter({ hasText: eventTitle })
    await expect(invitation).toContainText('Invited with Sunrise Striders')
    await invitation.getByRole('button', { name: 'Accept invitation' }).click()

    await expect(
      runnerPage.getByRole('heading', { name: 'Event invitations' }),
    ).toHaveCount(0)
    const runnerEvent = runnerPage
      .getByRole('listitem')
      .filter({ hasText: eventTitle })
    await expect(runnerEvent).toBeVisible()
    await runnerEvent.getByRole('button', { name: 'Maybe' }).click()
    const runDialog = runnerPage.getByRole('dialog', {
      name: 'Choose your run',
    })
    await runDialog.getByRole('button', { name: 'Save response' }).click()
    await expect(
      runnerEvent.getByRole('button', { name: 'Maybe' }),
    ).toHaveAttribute('aria-pressed', 'true')

    await organizerPage.reload()
    await expect(
      organizerPage.getByLabel('Attendance: 0 in, 1 maybe, 0 out'),
    ).toBeVisible()
    expect(state.invitationRequest).toEqual({
      target_event_id: eventId,
      target_flock_id: flockId,
    })
    expect(state.acceptanceRequest).toEqual({
      target_invitation_id: invitationId,
    })
    expect(state.responseRequest).toEqual({
      next_response: 'maybe',
      target_event_id: eventId,
      target_run_option_id: runOptionId,
    })
    expect(organizerConsoleProblems).toEqual([])
    expect(runnerConsoleProblems).toEqual([])
  } finally {
    await runnerContext?.close()
  }
})
