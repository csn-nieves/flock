import { expect, test } from '@playwright/test'
import {
  collectConsoleProblems,
  createAuthenticatedContext,
} from './authenticatedBrowser'

const organizerEmail = 'runner@flock.com'
const runnerEmail = 'maya.chen@flock.com'
const flockName = 'Riverside Tempo Club'

test('persists a whole-flock invitation and RSVP across two real users', async ({
  browser,
}) => {
  const eventTitle = `E2E river run ${Date.now()}`
  const repeatedEventTitle = `${eventTitle} next week`
  const organizerContext = await createAuthenticatedContext(
    browser,
    organizerEmail,
  )
  const runnerContext = await createAuthenticatedContext(browser, runnerEmail)

  try {
    const organizerPage = await organizerContext.newPage()
    const runnerPage = await runnerContext.newPage()
    const organizerConsoleProblems = collectConsoleProblems(organizerPage)
    const runnerConsoleProblems = collectConsoleProblems(runnerPage)

    await organizerPage.goto('/events')
    await expect(organizerPage).toHaveTitle('Your events — Flock')
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
    await expect(organizerEvent).toContainText('5 mi · 8:00/mi')
    await organizerEvent.getByRole('button', { name: 'Invite runners' }).click()

    const audienceDialog = organizerPage.getByRole('dialog', {
      name: 'Choose an audience',
    })
    await audienceDialog.getByRole('button', { name: 'A whole flock' }).click()
    await audienceDialog
      .getByRole('textbox', { name: 'Search flocks' })
      .fill('Riverside')
    await audienceDialog.getByRole('button', { name: flockName }).click()
    await expect(
      organizerPage.getByRole('dialog', { name: 'Invitation sent' }),
    ).toContainText(`${flockName} members will see this invitation in Flock.`)

    await runnerPage.goto('/events')
    await expect(runnerPage).toHaveTitle('Your events — Flock')
    const invitation = runnerPage
      .getByRole('listitem')
      .filter({ hasText: eventTitle })
    await expect(invitation).toContainText(`Invited with ${flockName}`)
    await invitation.getByRole('button', { name: 'Accept invitation' }).click()

    const runnerEvent = runnerPage
      .getByRole('listitem')
      .filter({ hasText: eventTitle })
    await expect(runnerEvent).toBeVisible()
    await runnerEvent.getByRole('button', { name: 'Maybe' }).click()
    const runChoiceDialog = runnerPage.getByRole('dialog', {
      name: 'Choose your run',
    })
    await runChoiceDialog.getByRole('button', { name: 'Save response' }).click()
    await expect(
      runnerEvent.getByRole('button', { name: 'Maybe' }),
    ).toHaveAttribute('aria-pressed', 'true')
    await expect(runnerEvent.getByText('Your choice')).toBeVisible()

    await organizerPage.reload()
    await expect(
      organizerPage.getByLabel('Attendance: 0 in, 1 maybe, 0 out'),
    ).toBeVisible()
    await expect(organizerEvent).toContainText('0 in · 1 maybe')

    await organizerEvent.getByRole('button', { name: 'Repeat event' }).click()
    const repeatDialog = organizerPage.getByRole('dialog', {
      name: 'Repeat event',
    })
    await expect(repeatDialog.getByLabel('Title')).toHaveValue(eventTitle)
    await expect(repeatDialog.getByLabel('Location')).toHaveValue(
      'Riverfront trailhead',
    )
    await expect(repeatDialog.getByLabel('Date and time')).toHaveValue('')
    await repeatDialog.getByLabel('Title').fill(repeatedEventTitle)
    await repeatDialog.getByLabel('Date and time').fill('2099-06-17T06:30')
    await repeatDialog.getByRole('button', { name: 'Create event' }).click()

    const repeatedEvent = organizerPage
      .getByRole('listitem')
      .filter({ hasText: repeatedEventTitle })
    await expect(repeatedEvent).toBeVisible()
    await expect(repeatedEvent).toContainText('5 mi · 8:00/mi')
    await expect(
      repeatedEvent.getByLabel('Attendance: 0 in, 0 maybe, 0 out'),
    ).toBeVisible()

    await runnerPage.reload()
    await expect(
      runnerPage.getByRole('heading', { name: repeatedEventTitle }),
    ).toHaveCount(0)
    await expect(runnerEvent).toBeVisible()
    await expect(
      runnerEvent.getByRole('button', { name: 'Maybe' }),
    ).toHaveAttribute('aria-pressed', 'true')
    expect(organizerConsoleProblems).toEqual([])
    expect(runnerConsoleProblems).toEqual([])
  } finally {
    await Promise.all([organizerContext.close(), runnerContext.close()])
  }
})
