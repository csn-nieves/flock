import { defineConfig, devices } from '@playwright/test'

const applicationUrl = 'http://localhost:5173'

export default defineConfig({
  forbidOnly: Boolean(process.env.CI),
  fullyParallel: false,
  reporter: 'list',
  retries: process.env.CI ? 1 : 0,
  testDir: './tests/e2e',
  workers: 1,
  projects: [
    {
      name: 'full-stack-chromium',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: applicationUrl,
        serviceWorkers: 'block',
      },
    },
  ],
  webServer: {
    command: 'node scripts/start-local-development.mjs',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    url: applicationUrl,
  },
})
