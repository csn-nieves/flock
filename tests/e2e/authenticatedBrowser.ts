import {
  devices,
  type Browser,
  type BrowserContext,
  type Page,
} from '@playwright/test'
import { createLocalSession } from './localSupabase'

const browserContextOptions = {
  ...devices['Desktop Chrome'],
  baseURL: 'http://localhost:5173',
  serviceWorkers: 'block' as const,
}

export async function createAuthenticatedContext(
  browser: Browser,
  email: string,
): Promise<BrowserContext> {
  const sessionDetails = await createLocalSession(email)
  const context = await browser.newContext(browserContextOptions)

  await context.addInitScript(({ session, storageKey }) => {
    window.localStorage.setItem(storageKey, JSON.stringify(session))
  }, sessionDetails)

  return context
}

export function collectConsoleProblems(page: Page) {
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
