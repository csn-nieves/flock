import { expect, test } from '@playwright/test'

test('truncates long flock names within the chat sidebar', async ({
  mount,
}) => {
  const component = await mount('components/ConversationNavigation/Populated')
  const link = component.getByRole('link', {
    name: 'Sunday Long Run Through the Entire River Valley',
  })
  const label = link.locator('span').last()

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
