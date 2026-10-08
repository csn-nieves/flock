import { expect, test } from '@playwright/test'

test('keeps the chat title and composer visible while messages own scrolling', async ({
  mount,
  page,
}) => {
  const component = await mount('pages/ChatsPage/SelectedFlock')
  const viewport = page.viewportSize()
  const title = component.getByRole('heading', { name: 'Morning Runners' })
  const sendButton = component.getByRole('button', { name: 'Send message' })

  await expect(title).toBeVisible()
  await expect(sendButton).toBeVisible()
  await expect(component.getByText('0 / 2,000')).toHaveCSS(
    'text-align',
    'right',
  )
  await expect(component.getByText(/Press Enter to send/)).toHaveCount(0)
  expect(
    await page.evaluate<number>('document.documentElement.scrollHeight'),
  ).toBe(viewport?.height)

  const sendButtonBox = await sendButton.boundingBox()
  expect(
    (sendButtonBox?.y ?? 0) + (sendButtonBox?.height ?? 0),
  ).toBeLessThanOrEqual(viewport?.height ?? 0)
})

test('separates flock chats from private direct messages', async ({
  mount,
}, testInfo) => {
  test.skip((testInfo.project.use.viewport?.width ?? 1280) >= 1024)
  const component = await mount('pages/ChatsPage/SelectedFlock')

  await expect(
    component.getByRole('region', { name: 'Chat workspace' }),
  ).toBeVisible()
  await component.getByRole('button', { name: 'All chats' }).click()
  await expect(
    component.getByRole('heading', { level: 2, name: 'Flock chats' }),
  ).toBeVisible()
  await expect(
    component.getByRole('heading', { level: 2, name: 'Direct messages' }),
  ).toBeVisible()
  await expect(
    component.getByRole('button', { name: /Maya Chen/ }),
  ).toBeVisible()
  const morningRunners = component.getByRole('button', {
    name: /Morning Runners/,
  })
  await expect(morningRunners).not.toHaveAttribute('aria-current', 'page')
  await morningRunners.click()
  await expect(
    component.getByRole('log', { name: 'Flock messages' }),
  ).toContainText('Does 7:00 at the east trailhead work?')

  const composer = component.getByRole('textbox', {
    exact: true,
    name: 'Message',
  })
  await composer.fill('I will bring a headlamp.')
  await component.getByRole('button', { name: 'Send message' }).click()
  await expect(
    component.getByRole('log', { name: 'Flock messages' }),
  ).toContainText('I will bring a headlamp.')
  await expect(composer).toHaveText('')
})

test('renders direct messages with the same fixed chat workspace', async ({
  mount,
  page,
}) => {
  const component = await mount('pages/ChatsPage/SelectedDirectMessage')

  await expect(
    component.getByRole('heading', { name: 'Maya Chen' }),
  ).toBeVisible()
  await expect(
    component.getByRole('log', { name: 'Direct messages with Maya Chen' }),
  ).toContainText('Does 7:00 at the east trailhead work?')
  await expect(
    component.getByRole('button', { name: 'Send message' }),
  ).toBeVisible()
  expect(
    await page.evaluate<number>('document.documentElement.scrollHeight'),
  ).toBe(page.viewportSize()?.height)
})

test('shows runner search results when starting a direct message', async ({
  mount,
}) => {
  const component = await mount('pages/ChatsPage/NewDirectMessage')

  await expect(
    component.getByRole('heading', { name: 'Start a conversation' }),
  ).toBeVisible()
  await expect(
    component.getByRole('searchbox', {
      name: 'Search runners for a direct message',
    }),
  ).toHaveValue('Maya')
  await expect(
    component.getByRole('button', { name: /Maya Chen/ }),
  ).toBeVisible()
})

test('formats selected message text visually without rendering raw HTML', async ({
  mount,
}) => {
  const component = await mount('pages/ChatsPage/SelectedFlock')
  const composer = component.getByRole('textbox', {
    exact: true,
    name: 'Message',
  })

  await composer.fill('Fast miles')
  await composer.evaluate((element) => {
    const range = element.ownerDocument.createRange()
    range.setStart(element.firstChild ?? element, 0)
    range.setEnd(element.firstChild ?? element, 4)
    const selection = element.ownerDocument.defaultView?.getSelection()
    selection?.removeAllRanges()
    selection?.addRange(range)
  })
  await component.getByRole('button', { name: 'Bold' }).click()
  await expect(composer).toHaveText('Fast miles')
  await expect(composer.locator('b, strong')).toHaveText('Fast')
  await expect(component.getByRole('button', { name: 'Bold' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await component.getByRole('button', { name: 'Send message' }).click()
  await expect(
    component.getByRole('log', { name: 'Flock messages' }).locator('strong'),
  ).toHaveText('Fast')

  await composer.fill('Smooth')
  await composer.evaluate((element) => {
    const range = element.ownerDocument.createRange()
    range.selectNodeContents(element)
    const selection = element.ownerDocument.defaultView?.getSelection()
    selection?.removeAllRanges()
    selection?.addRange(range)
  })
  await component.getByRole('button', { name: 'Italic' }).click()
  await expect(composer.locator('i, em')).toHaveText('Smooth')
  await component.getByRole('button', { name: 'Send message' }).click()
  await expect(
    component.getByRole('log', { name: 'Flock messages' }).locator('em'),
  ).toHaveText('Smooth')

  await composer.fill('Steady')
  await composer.evaluate((element) => {
    const range = element.ownerDocument.createRange()
    range.selectNodeContents(element)
    const selection = element.ownerDocument.defaultView?.getSelection()
    selection?.removeAllRanges()
    selection?.addRange(range)
  })
  await component.getByRole('button', { name: 'Underline' }).click()
  await expect(composer.locator('u')).toHaveText('Steady')
  await component.getByRole('button', { name: 'Send message' }).click()
  await expect(
    component.getByRole('log', { name: 'Flock messages' }).locator('u'),
  ).toHaveText('Steady')

  await composer.focus()
  await composer.evaluate((element) => {
    const view = element.ownerDocument.defaultView
    if (!view) return
    const clipboardData = new view.DataTransfer()
    clipboardData.setData('text/plain', '<b>Road closed</b>')
    clipboardData.setData('text/html', '<b>Road closed</b>')
    element.dispatchEvent(
      new view.ClipboardEvent('paste', {
        bubbles: true,
        cancelable: true,
        clipboardData,
      }),
    )
  })
  await expect(composer).toHaveText('<b>Road closed</b>')
  await expect(composer.locator('b')).toHaveCount(0)
})

test('preserves overlapping message formatting after sending', async ({
  mount,
}) => {
  const component = await mount('pages/ChatsPage/SelectedFlock')
  const composer = component.getByRole('textbox', {
    exact: true,
    name: 'Message',
  })
  const selectTextRange = async (start: number, end: number) => {
    await composer.evaluate(
      (element, offsets) => {
        const document = element.ownerDocument
        const walker = document.createTreeWalker(
          element,
          document.defaultView?.NodeFilter.SHOW_TEXT ?? 4,
        )
        const range = document.createRange()
        let cursor = 0
        let current = walker.nextNode()
        let didSetStart = false

        while (current) {
          const nextCursor = cursor + (current.textContent?.length ?? 0)
          if (!didSetStart && offsets.start <= nextCursor) {
            range.setStart(current, Math.max(0, offsets.start - cursor))
            didSetStart = true
          }
          if (didSetStart && offsets.end <= nextCursor) {
            range.setEnd(current, Math.max(0, offsets.end - cursor))
            break
          }
          cursor = nextCursor
          current = walker.nextNode()
        }

        const selection = document.defaultView?.getSelection()
        selection?.removeAllRanges()
        selection?.addRange(range)
      },
      { end, start },
    )
  }

  await composer.fill('Fast steady miles')
  await selectTextRange(0, 11)
  await component.getByRole('button', { name: 'Bold' }).click()
  await selectTextRange(5, 17)
  await component.getByRole('button', { name: 'Italic' }).click()

  await expect
    .poll(async () =>
      (await composer.locator('strong').allTextContents()).join(''),
    )
    .toBe('Fast steady')
  await expect
    .poll(async () => (await composer.locator('em').allTextContents()).join(''))
    .toBe('steady miles')
  await component.getByRole('button', { name: 'Send message' }).click()

  const sentMessage = component
    .getByRole('log', { name: 'Flock messages' })
    .locator('li')
    .last()
  await expect(sentMessage).toContainText('Fast steady miles')
  await expect
    .poll(async () =>
      (await sentMessage.locator('strong').allTextContents()).join(''),
    )
    .toBe('Fast steady')
  await expect
    .poll(async () =>
      (await sentMessage.locator('em').allTextContents()).join(''),
    )
    .toBe('steady miles')
})

test('inserts an emoji at the current composer position', async ({ mount }) => {
  const component = await mount('pages/ChatsPage/SelectedFlock')
  const composer = component.getByRole('textbox', {
    exact: true,
    name: 'Message',
  })

  await composer.fill('Great run ')
  await component.getByRole('button', { name: 'Add emoji' }).click()
  await expect(
    component.getByRole('dialog', { name: 'Choose an emoji' }),
  ).toBeVisible()
  await component
    .getByRole('dialog', { name: 'Choose an emoji' })
    .press('Escape')
  await expect(
    component.getByRole('dialog', { name: 'Choose an emoji' }),
  ).toHaveCount(0)
  await expect(
    component.getByRole('button', { name: 'Add emoji' }),
  ).toBeFocused()

  await component.getByRole('button', { name: 'Add emoji' }).click()
  await component.getByRole('button', { name: 'Add Fire' }).click()
  await expect(composer).toHaveText('Great run 🔥')
  await expect(
    component.getByRole('dialog', { name: 'Choose an emoji' }),
  ).toHaveCount(0)

  await component.getByRole('button', { name: 'Send message' }).click()
  await expect(
    component.getByRole('log', { name: 'Flock messages' }),
  ).toContainText('Great run 🔥')
})

test('loads earlier chat history upward without a visible pagination control', async ({
  mount,
}) => {
  const component = await mount('pages/ChatsPage/ChatHistory')
  const messageLog = component.getByRole('log', { name: 'Flock messages' })

  await expect(messageLog).toContainText('Run planning message 36')
  await expect(messageLog).not.toContainText(
    'Does 7:00 at the east trailhead work?',
  )
  await expect(
    component.getByRole('button', { name: /load more/i }),
  ).toHaveCount(0)

  await messageLog.evaluate((element) => {
    element.scrollTop = 0
    element.dispatchEvent(new Event('scroll'))
  })

  await expect(messageLog).toContainText(
    'Does 7:00 at the east trailhead work?',
  )
  await expect
    .poll(() => messageLog.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(0)
})

test('shows the flock list first on a narrow screen and opens a conversation', async ({
  mount,
}, testInfo) => {
  test.skip((testInfo.project.use.viewport?.width ?? 1280) >= 1024)
  const component = await mount('pages/ChatsPage/SelectedFlock')

  await expect(
    component.getByRole('button', { name: 'All chats' }),
  ).toBeVisible()
  await component.getByRole('button', { name: 'All chats' }).click()
  await expect(
    component.getByRole('list', { name: 'Flock chats' }),
  ).toBeVisible()
  await expect(
    component.getByRole('heading', { level: 2, name: 'Direct messages' }),
  ).toBeVisible()
})

test('covers loading, empty, and recoverable error states', async ({
  mount,
}, testInfo) => {
  test.skip((testInfo.project.use.viewport?.width ?? 1280) >= 1024)
  const loading = await mount('pages/ChatsPage/Loading')
  await expect(loading.getByRole('status')).toContainText(
    'Loading flock chats…',
  )

  await loading.unmount()
  const empty = await mount('pages/ChatsPage/Empty')
  await expect(empty.getByText(/Join a flock/)).toBeVisible()

  await empty.unmount()
  const failed = await mount('pages/ChatsPage/Error')
  await expect(failed.getByRole('alert')).toContainText(
    'We could not load your flock chats.',
  )
  await failed.getByRole('button', { name: 'Try again' }).click()
  await expect(failed.getByTestId('page-intent')).toHaveText('retry')
})
