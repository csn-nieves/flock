import { expect, test } from '@playwright/test'
import {
  collectConsoleProblems,
  createAuthenticatedContext,
} from './authenticatedBrowser'

const organizerEmail = 'runner@flock.com'

test('saves, reuses, and persists a private route on a personal event', async ({
  browser,
}) => {
  const suffix = Date.now()
  const eventTitle = `E2E saved route run ${suffix}`
  const routeName = `E2E harbor route ${suffix}`
  const organizerContext = await createAuthenticatedContext(
    browser,
    organizerEmail,
  )

  try {
    const organizerPage = await organizerContext.newPage()
    const consoleProblems = collectConsoleProblems(organizerPage)

    await organizerPage.goto('/events')
    await organizerPage.getByRole('button', { name: 'Create event' }).click()

    const createDialog = organizerPage.getByRole('dialog', {
      name: 'Create an event',
    })
    await createDialog
      .getByRole('button', { name: 'Choose saved route' })
      .click()

    const routeLibrary = organizerPage.getByRole('dialog', {
      name: 'Choose a saved route',
    })
    await expect(
      routeLibrary.getByRole('button', { name: /Harbor recovery loop/ }),
    ).toBeVisible()
    await expect(
      routeLibrary.getByRole('button', { name: /Riverside five-mile loop/ }),
    ).toBeVisible()
    await routeLibrary.getByRole('button', { name: 'Use this route' }).click()

    await expect(
      createDialog.getByText('3.11 mi', { exact: true }),
    ).toBeVisible()
    await createDialog.getByRole('button', { name: 'Save for later' }).click()

    const saveDialog = organizerPage.getByRole('dialog', {
      name: 'Save route for later',
    })
    await saveDialog.getByLabel('Route name').fill(routeName)
    await saveDialog.getByRole('button', { name: 'Save route' }).click()
    await expect(saveDialog).toBeHidden()

    await createDialog
      .getByRole('button', { name: 'Choose saved route' })
      .click()
    const reopenedLibrary = organizerPage.getByRole('dialog', {
      name: 'Choose a saved route',
    })
    await expect(
      reopenedLibrary.getByRole('button', { name: new RegExp(routeName) }),
    ).toBeVisible()
    await reopenedLibrary
      .getByRole('button', { name: new RegExp(routeName) })
      .click()
    await reopenedLibrary
      .getByRole('button', { name: 'Use this route' })
      .click()

    await createDialog.getByLabel('Title').fill(eventTitle)
    await createDialog.getByLabel('Date and time').fill('2099-06-10T06:30')
    await createDialog.getByLabel('Location').fill('Harbor trailhead')
    await createDialog
      .getByLabel('Description')
      .fill('A reusable harbor route test.')
    await createDialog.getByRole('button', { name: 'Create event' }).click()

    const organizerEvent = organizerPage
      .getByRole('listitem')
      .filter({ hasText: eventTitle })
    await expect(organizerEvent).toBeVisible()
    await expect(organizerEvent).toContainText('Mapped route · 3.11 mi')

    await organizerPage.reload()
    await expect(organizerEvent).toContainText('Mapped route · 3.11 mi')
    expect(consoleProblems).toEqual([])
  } finally {
    await organizerContext.close()
  }
})
