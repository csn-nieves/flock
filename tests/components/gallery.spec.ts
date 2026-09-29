import { expect, test } from '@playwright/test'

test('loads the component gallery bridge', async ({ page }) => {
  await page.goto('/playwright/gallery/index.html')

  const bridge = await page.evaluate(() => ({
    mount: typeof Reflect.get(globalThis, 'mount'),
    unmount: typeof Reflect.get(globalThis, 'unmount'),
  }))

  expect(bridge).toEqual({
    mount: 'function',
    unmount: 'function',
  })
})

test('reports an unknown story clearly', async ({ page }) => {
  await page.goto('/playwright/gallery/index.html')

  const message = await page.evaluate(async () => {
    const mount = Reflect.get(globalThis, 'mount') as (parameters: {
      story: string
    }) => Promise<void>

    try {
      await mount({ story: 'missing/Story' })
    } catch (error) {
      return error instanceof Error ? error.message : String(error)
    }

    return ''
  })

  expect(message).toBe('Unknown story: missing/Story')
})
