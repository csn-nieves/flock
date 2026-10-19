import { expect, test } from './fixtures'

test('shows the public privacy page without authentication', async ({
  page,
}) => {
  await page.goto('/privacy')

  await expect(page).toHaveTitle('Privacy — Flock')
  await expect(
    page.getByRole('heading', { level: 1, name: 'Privacy at Flock' }),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'csn.nieves@gmail.com' }).first(),
  ).toHaveAttribute('href', 'mailto:csn.nieves@gmail.com')
})

test('shows the public data-deletion instructions without authentication', async ({
  page,
}) => {
  await page.goto('/data-deletion')

  await expect(page).toHaveTitle('Request data deletion — Flock')
  await expect(
    page.getByRole('heading', { level: 1, name: 'Request data deletion' }),
  ).toBeVisible()
  await expect(page.getByText('Never send your sign-in code')).toBeVisible()
})
