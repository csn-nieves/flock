import { expect, test } from '@playwright/test'
import {
  collectConsoleProblems,
  createAuthenticatedContext,
} from './authenticatedBrowser'

const organizerEmail = 'runner@flock.com'
const runnerEmail = 'maya.chen@flock.com'

test('persists flock membership, event visibility, and RSVP across two real users', async ({
  browser,
}) => {
  const uniqueSuffix = Date.now()
  const flockName = `E2E Night Owls ${uniqueSuffix}`
  const flockLocation = `Moonrise Park ${uniqueSuffix}`
  const updatedFlockLocation = `Starlight Trailhead ${uniqueSuffix}`
  const eventTitle = `E2E moonlight miles ${uniqueSuffix}`
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

    await organizerPage.goto('/flocks')
    await expect(organizerPage).toHaveTitle('Your flocks — Flock')
    await organizerPage.getByRole('button', { name: 'Create a flock' }).click()

    const createFlockDialog = organizerPage.getByRole('dialog', {
      name: 'Create a flock',
    })
    await createFlockDialog.getByLabel('Flock name').fill(flockName)
    await createFlockDialog.getByLabel('Location').fill(flockLocation)
    await createFlockDialog
      .getByLabel('Description')
      .fill('Friendly evening miles with a no-drop finish.')
    await createFlockDialog
      .getByRole('button', { name: 'Create flock' })
      .click()

    await expect(
      organizerPage.getByRole('heading', { level: 1, name: flockName }),
    ).toBeVisible()
    await expect(organizerPage).toHaveTitle(`${flockName} — Flock`)
    await expect(organizerPage.getByText(flockLocation)).toBeVisible()

    await organizerPage
      .getByRole('button', { name: 'Edit flock details' })
      .click()
    const editFlockDialog = organizerPage.getByRole('dialog', {
      name: 'Edit flock details',
    })
    await editFlockDialog.getByLabel('Location').fill(updatedFlockLocation)
    await editFlockDialog
      .getByLabel('Description')
      .fill('No-drop moonlight miles with a regroup at every turn.')
    await editFlockDialog.getByRole('button', { name: 'Save changes' }).click()
    await expect(organizerPage.getByRole('status')).toHaveText(
      'Flock details saved.',
    )
    await organizerPage.reload()
    await expect(organizerPage.getByText(updatedFlockLocation)).toBeVisible()
    await expect(
      organizerPage.getByText(
        'No-drop moonlight miles with a regroup at every turn.',
      ),
    ).toBeVisible()

    await organizerPage.getByRole('button', { name: 'Invite a runner' }).click()
    const invitationDialog = organizerPage.getByRole('dialog', {
      name: 'Invite a runner',
    })
    await invitationDialog
      .getByRole('button', { name: 'Create invitation link' })
      .click()
    const invitationUrl = await invitationDialog
      .getByLabel('Invitation link')
      .inputValue()

    await runnerPage.goto(new URL(invitationUrl).pathname)
    await expect(runnerPage).toHaveTitle(`${flockName} — Flock`)
    await expect(
      runnerPage.getByRole('heading', { level: 1, name: flockName }),
    ).toBeVisible()
    await expect(runnerPage.getByText(updatedFlockLocation)).toBeVisible()

    await organizerPage.reload()
    await organizerPage.getByRole('button', { name: 'Show' }).click()
    await expect(
      organizerPage.getByRole('list', { name: 'Flock members' }),
    ).toContainText('Maya Chen')

    await organizerPage.getByRole('button', { name: 'Create an event' }).click()
    const createEventDialog = organizerPage.getByRole('dialog', {
      name: 'Create an event',
    })
    await createEventDialog.getByLabel('Title').fill(eventTitle)
    await createEventDialog.getByLabel('Date and time').fill('2099-07-12T20:00')
    await createEventDialog
      .getByLabel('Location')
      .fill('Moonrise Park entrance')
    await createEventDialog
      .getByLabel('Description')
      .fill('Conversational miles under the lights.')
    await createEventDialog.getByLabel('Distance').fill('5 miles')
    await createEventDialog.getByLabel('Pace').fill('Social')
    await createEventDialog
      .getByRole('button', { name: 'Add another option' })
      .click()
    await createEventDialog.getByLabel('Distance').nth(1).fill('10 miles')
    await createEventDialog.getByLabel('Pace').nth(1).fill('Steady')
    await createEventDialog
      .getByRole('button', { name: 'Create event' })
      .click()

    const organizerEvent = organizerPage
      .getByRole('listitem')
      .filter({ hasText: eventTitle })
    await expect(organizerEvent).toContainText('Moonrise Park entrance')

    await runnerPage.reload()
    const runnerEvent = runnerPage
      .getByRole('listitem')
      .filter({ hasText: eventTitle })
    await expect(runnerEvent).toContainText(
      'Conversational miles under the lights.',
    )
    await runnerEvent.getByRole('button', { name: "I'm in" }).click()
    const runChoiceDialog = runnerPage.getByRole('dialog', {
      name: 'Choose your run',
    })
    await runChoiceDialog.getByRole('radio', { name: /10 miles/ }).check()
    await runChoiceDialog.getByRole('button', { name: 'Save response' }).click()
    await expect(
      runnerEvent.getByRole('button', { name: "I'm in" }),
    ).toHaveAttribute('aria-pressed', 'true')
    await expect(runnerEvent.getByText('Your choice')).toBeVisible()

    await organizerPage.reload()
    await expect(
      organizerPage.getByLabel('Attendance: 1 in, 0 maybe, 0 out'),
    ).toBeVisible()
    const organizerTenMileOption = organizerEvent
      .getByText('10 miles · Steady')
      .locator('..')
      .locator('..')
    await expect(organizerTenMileOption).toContainText('1 in · 0 maybe')
    expect(organizerConsoleProblems).toEqual([])
    expect(runnerConsoleProblems).toEqual([])
  } finally {
    await Promise.all([organizerContext.close(), runnerContext.close()])
  }
})
