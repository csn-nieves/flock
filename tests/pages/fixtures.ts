import { test as base, type Route } from '@playwright/test'

export const test = base.extend({
  page: async ({ page }, use) => {
    const failOnUnexpectedRequest = async (route: Route) => {
      const request = route.request()
      throw new Error(
        `Unhandled Supabase request: ${request.method()} ${request.url()}. Add an explicit page.route mock for this request.`,
      )
    }

    await page.route('**/rest/**', failOnUnexpectedRequest)
    await page.route('**/rest/v1/rpc/list_my_flock_chats', async (route) => {
      await route.fulfill({ json: [], status: 200 })
    })
    await page.route(
      '**/rest/v1/rpc/list_my_direct_conversations',
      async (route) => {
        await route.fulfill({ json: [], status: 200 })
      },
    )

    // Playwright's fixture callback is named `use`; it is not a React hook.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(page)
  },
})

export { expect } from '@playwright/test'
