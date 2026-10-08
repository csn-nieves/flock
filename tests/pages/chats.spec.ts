import { expect, test } from './fixtures'

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
      user_metadata: { display_name: 'Local Runner' },
    },
  }
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript((session: ReturnType<typeof createTestSession>) => {
    window.localStorage.setItem(
      'sb-example-auth-token',
      JSON.stringify(session),
    )
  }, createTestSession())

  await page.route('**/rest/v1/rpc/list_my_flock_chats', async (route) => {
    await route.fulfill({
      json: [
        {
          flock_id: 'morning-runners-id',
          flock_name: 'Morning Runners',
          latest_message_body: 'Meet at the east trailhead.',
          latest_message_created_at: '2026-10-07T12:00:00.000Z',
          latest_sender_display_name: 'Maya Chen',
          latest_sender_id: 'maya-id',
          unread_count: 2,
        },
        {
          flock_id: 'trail-birds-id',
          flock_name: 'Trail Birds',
          latest_message_body: null,
          latest_message_created_at: null,
          latest_sender_display_name: null,
          latest_sender_id: null,
          unread_count: 0,
        },
      ],
      status: 200,
    })
  })

  await page.route(
    '**/rest/v1/rpc/list_my_direct_conversations',
    async (route) => {
      await route.fulfill({
        json: [
          {
            conversation_id: 'maya-conversation-id',
            latest_message_body: 'Want to run the bridge tomorrow?',
            latest_message_created_at: '2026-10-08T12:00:00.000Z',
            latest_sender_display_name: 'Maya Chen',
            latest_sender_id: 'maya-id',
            other_display_name: 'Maya Chen',
            other_user_id: 'maya-id',
            unread_count: 1,
          },
        ],
        status: 200,
      })
    },
  )

  await page.route('**/rest/v1/rpc/list_flock_messages', async (route) => {
    await route.fulfill({
      json: [
        {
          body: 'Meet at the east trailhead.',
          created_at: '2026-10-07T12:00:00.000Z',
          flock_id: 'morning-runners-id',
          id: 'message-id',
          sender_display_name: 'Maya Chen',
          sender_id: 'maya-id',
        },
      ],
      status: 200,
    })
  })

  await page.route('**/rest/v1/rpc/list_direct_messages', async (route) => {
    await route.fulfill({
      json: [
        {
          body: 'Want to run the bridge tomorrow?',
          conversation_id: 'maya-conversation-id',
          created_at: '2026-10-08T12:00:00.000Z',
          id: 'direct-message-id',
          sender_display_name: 'Maya Chen',
          sender_id: 'maya-id',
        },
      ],
      status: 200,
    })
  })

  await page.route('**/rest/v1/rpc/mark_flock_chat_read', async (route) => {
    await route.fulfill({ json: null, status: 200 })
  })
  await page.route(
    '**/rest/v1/rpc/mark_direct_conversation_read',
    async (route) => {
      await route.fulfill({ json: null, status: 200 })
    },
  )
})

test('opens flock conversations from the primary Chats destination', async ({
  page,
}) => {
  await page.goto('/chats')

  await expect(page).toHaveTitle('Chats — Flock')
  await expect(page.getByRole('link', { name: 'Chats' })).toHaveCount(0)
  if ((page.viewportSize()?.width ?? 1280) < 1024) {
    await page.getByRole('button', { name: 'Open menu' }).click()
  }
  const chatNavigation = page.getByRole('navigation', {
    name: 'Chat conversations',
  })
  await expect(
    chatNavigation.getByRole('heading', { level: 2, name: 'Flock chats' }),
  ).toBeVisible()
  await expect(
    chatNavigation.getByRole('heading', { level: 2, name: 'Direct messages' }),
  ).toBeVisible()
  await expect(
    chatNavigation.getByRole('link', { name: /^Maya Chen,/ }),
  ).toBeVisible()
  await expect(
    chatNavigation.getByRole('link', { name: 'New direct message' }),
  ).toBeVisible()
  if ((page.viewportSize()?.width ?? 0) >= 1024) {
    const workspaceBox = await page
      .getByRole('region', { name: 'Chat workspace' })
      .boundingBox()
    expect(workspaceBox?.width).toBeGreaterThan(900)
  }

  await chatNavigation.getByRole('link', { name: /Morning Runners/ }).click()

  await expect(page).toHaveURL('/chats/morning-runners-id')
  await expect(page).toHaveTitle('Morning Runners chat — Flock')
  await expect(page.getByRole('log', { name: 'Flock messages' })).toContainText(
    'Meet at the east trailhead.',
  )
  await expect(
    page.getByRole('heading', { name: 'Morning Runners' }),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'Send message' })).toBeVisible()
  expect(
    await page.evaluate<number>('document.documentElement.scrollHeight'),
  ).toBe(page.viewportSize()?.height)

  if ((page.viewportSize()?.width ?? 1280) < 1024) {
    await page.getByRole('button', { name: 'All chats' }).click()
    await expect(page).toHaveURL('/chats')
    await expect(page.getByRole('list', { name: 'Flock chats' })).toBeVisible()
  }
})

test('opens a private conversation from the shared chat navigation', async ({
  page,
}) => {
  await page.goto('/chats/direct/maya-conversation-id')

  await expect(page).toHaveTitle('Maya Chen — Flock')
  await expect(page.getByRole('heading', { name: 'Maya Chen' })).toBeVisible()
  await expect(
    page.getByRole('log', { name: 'Direct messages with Maya Chen' }),
  ).toContainText('Want to run the bridge tomorrow?')
  await expect(page.getByRole('button', { name: 'Send message' })).toBeVisible()
  expect(
    await page.evaluate<number>('document.documentElement.scrollHeight'),
  ).toBe(page.viewportSize()?.height)
})

test('searches runners and opens a canonical private conversation', async ({
  page,
}) => {
  await page.route('**/rest/v1/rpc/search_runners', async (route) => {
    await route.fulfill({
      json: [
        { display_name: 'Maya Chen', user_id: 'maya-id' },
        { display_name: 'Local Runner', user_id: 'runner-id' },
      ],
      status: 200,
    })
  })
  await page.route(
    '**/rest/v1/rpc/get_or_create_direct_conversation',
    async (route) => {
      await route.fulfill({ json: 'maya-conversation-id', status: 200 })
    },
  )

  await page.goto('/chats/direct/new')
  const search = page.getByRole('searchbox', {
    name: 'Search runners for a direct message',
  })
  await search.fill('Maya')

  await expect(page.getByRole('button', { name: /Maya Chen/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /Local Runner/ })).toHaveCount(
    0,
  )
  await page.getByRole('button', { name: /Maya Chen/ }).click()

  await expect(page).toHaveURL('/chats/direct/maya-conversation-id')
  await expect(page).toHaveTitle('Maya Chen — Flock')
})
