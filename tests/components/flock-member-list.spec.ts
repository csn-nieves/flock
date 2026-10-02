import { expect, test } from '@playwright/test'

test('renders each member name and role in a semantic list', async ({
  mount,
}) => {
  const component = await mount('components/FlockMemberList/Loaded')
  const list = component.getByRole('list', { name: 'Flock members' })

  await expect(list.getByRole('listitem')).toHaveCount(2)
  await expect(list.getByText('Local Organizer')).toBeVisible()
  await expect(list.getByText('Owner', { exact: true })).toBeVisible()
  await expect(list.getByText('Local Runner')).toBeVisible()
  await expect(list.getByText('Member', { exact: true })).toBeVisible()
})

test('wraps a long member name without horizontal overflow', async ({
  mount,
}) => {
  const component = await mount('components/FlockMemberList/LongName')
  const list = component.getByRole('list', { name: 'Flock members' })

  await expect(
    component.getByText(
      'Alexandria Montgomery-Rutherford Who Runs Every Riverside Trail',
    ),
  ).toBeVisible()
  expect(
    await list.evaluate((element) => element.scrollWidth),
  ).toBeLessThanOrEqual(await list.evaluate((element) => element.clientWidth))
})

test('renders no list for an empty roster', async ({ mount }) => {
  const component = await mount('components/FlockMemberList/Empty')

  await expect(component.getByRole('list')).toHaveCount(0)
})
