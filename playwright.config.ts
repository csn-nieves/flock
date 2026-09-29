import { defineConfig, devices } from '@playwright/test'

const galleryUrl = 'http://127.0.0.1:4199/playwright/gallery/index.html'
const applicationUrl = 'http://127.0.0.1:4199'

export default defineConfig({
  forbidOnly: Boolean(process.env.CI),
  reporter: 'list',
  retries: process.env.CI ? 2 : 0,
  projects: [
    {
      name: 'components',
      testDir: './tests/components',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: galleryUrl,
        reuseContext: true,
        serviceWorkers: 'block',
      },
    },
    {
      name: 'components-android',
      testDir: './tests/components',
      use: {
        ...devices['Pixel 10'],
        baseURL: galleryUrl,
        reuseContext: true,
        serviceWorkers: 'block',
      },
    },
    {
      name: 'components-iphone',
      testDir: './tests/components',
      use: {
        ...devices['iPhone 17'],
        baseURL: galleryUrl,
        reuseContext: true,
        serviceWorkers: 'block',
      },
    },
    {
      name: 'pages',
      testDir: './tests/pages',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: applicationUrl,
        serviceWorkers: 'block',
      },
    },
    {
      name: 'pages-android',
      testDir: './tests/pages',
      use: {
        ...devices['Pixel 10'],
        baseURL: applicationUrl,
        serviceWorkers: 'block',
      },
    },
    {
      name: 'pages-iphone',
      testDir: './tests/pages',
      use: {
        ...devices['iPhone 17'],
        baseURL: applicationUrl,
        serviceWorkers: 'block',
      },
    },
  ],
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4199 --strictPort',
    reuseExistingServer: !process.env.CI,
    url: galleryUrl,
  },
})
