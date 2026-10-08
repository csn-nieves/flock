import { expect, test } from '@playwright/test'

test('uses an accessible compose icon for a new direct message', async ({
  mount,
}, testInfo) => {
  const component = await mount('components/ConversationNavigation/Populated')
  const composeLink = component.getByRole('link', {
    name: 'New direct message',
  })
  const composeIcon = composeLink.locator('svg')

  await expect(composeLink).toHaveAttribute('href', '/chats/direct/new')
  await expect(composeLink).toHaveAttribute('title', 'New direct message')
  await expect(composeIcon).toBeVisible()
  await expect(composeLink).not.toContainText('New')
  const bounds = await composeLink.boundingBox()
  const iconBounds = await composeIcon.boundingBox()
  expect(bounds?.width).toBeGreaterThanOrEqual(44)
  expect(bounds?.height).toBeGreaterThanOrEqual(44)
  const expectedIconSize =
    (testInfo.project.use.viewport?.width ?? 1280) < 1024 ? 22 : 20
  expect(iconBounds?.width).toBe(expectedIconSize)
  expect(iconBounds?.height).toBe(expectedIconSize)
})

test('truncates long flock names within the chat sidebar', async ({
  mount,
}) => {
  const component = await mount('components/ConversationNavigation/Populated')
  const link = component.getByRole('link', {
    name: /Sunday Long Run Through the Entire River Valley/,
  })
  const label = link.locator('span.truncate').first()

  await expect(link).toHaveAttribute(
    'title',
    'Sunday Long Run Through the Entire River Valley',
  )
  await expect(link).not.toContainText('#')
  expect(
    await link.evaluate(
      (element) => element.scrollWidth <= element.clientWidth,
    ),
  ).toBe(true)
  expect(
    await label.evaluate(
      (element) => element.scrollWidth > element.clientWidth,
    ),
  ).toBe(true)
  await expect(label).toHaveCSS('text-overflow', 'ellipsis')
})

test('truncates long direct-message names within the chat sidebar', async ({
  mount,
}) => {
  const component = await mount('components/ConversationNavigation/Populated')
  const link = component.getByRole('link', {
    name: /Alexandria Montgomery-Rivera With a Very Long Name/,
  })
  const label = link.locator('span.truncate').first()

  await expect(link).toHaveAttribute(
    'title',
    'Alexandria Montgomery-Rivera With a Very Long Name',
  )
  expect(
    await link.evaluate(
      (element) => element.scrollWidth <= element.clientWidth,
    ),
  ).toBe(true)
  expect(
    await label.evaluate(
      (element) => element.scrollWidth > element.clientWidth,
    ),
  ).toBe(true)
  await expect(label).toHaveCSS('text-overflow', 'ellipsis')
  await expect(link).toHaveAccessibleName(/128 unread messages/)
  await expect(link.getByText('99+')).toBeVisible()
})

test('shows recent activity and an accessible unread count', async ({
  mount,
}) => {
  const component = await mount('components/ConversationNavigation/Populated')
  const conversation = component.getByRole('link', {
    name: /^Morning Runners, 4 unread messages, Maya Chen: Meet at the west entrance/,
  })

  await expect(conversation).toBeVisible()
  await expect(conversation.locator('.tabular-nums')).toHaveText('4')
  await expect(conversation).toContainText(
    'Maya Chen: Meet at the west entrance.',
  )
})
