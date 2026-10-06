import {
  devices,
  expect,
  test,
  type BrowserContext,
  type Page,
} from '@playwright/test'
import { createLocalSession } from './localSupabase'

const organizerEmail = 'runner@flock.com'
const runnerEmail = 'maya.chen@flock.com'
const flockName = 'Riverside Tempo Club'
const browserContextOptions = {
  ...devices['Desktop Chrome'],
  baseURL: 'http://localhost:5173',
  serviceWorkers: 'block' as const,
}

async function seedSession(
  context: BrowserContext,
  sessionDetails: Awaited<ReturnType<typeof createLocalSession>>,
) {
  await context.addInitScript(({ session, storageKey }) => {
    window.localStorage.setItem(storageKey, JSON.stringify(session))
  }, sessionDetails)
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
  return problems
}

test('persists a whole-flock invitation and RSVP across two real users', async ({
  browser,
}) => {
  const eventTitle = `E2E river run ${Date.now()}`
  const organizerSession = await createLocalSession(organizerEmail)
  const runnerSession = await createLocalSession(runnerEmail)
  const organizerContext = await browser.newContext(browserContextOptions)
  const runnerContext = await browser.newContext(browserContextOptions)

  try {
    await seedSession(organizerContext, organizerSession)
    await seedSession(runnerContext, runnerSession)
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
    await expect(
      runnerEvent.getByRole('button', { name: 'Maybe' }),
    ).toHaveAttribute('aria-pressed', 'true')

    await organizerPage.reload()
    await expect(
      organizerPage.getByLabel('Attendance: 0 in, 1 maybe, 0 out'),
    ).toBeVisible()
    expect(organizerConsoleProblems).toEqual([])
    expect(runnerConsoleProblems).toEqual([])
  } finally {
    await Promise.all([organizerContext.close(), runnerContext.close()])
  }
})
