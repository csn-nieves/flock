import { expect, test } from '@playwright/test'

test('exposes both provider actions without changing their labels', async ({
  mount,
}) => {
  const component = await mount('components/SocialSignInButtons/Interactive')
  const googleButton = component.getByRole('button', {
    name: 'Continue with Google',
  })
  const facebookButton = component.getByRole('button', {
    name: 'Continue with Facebook',
  })

  await googleButton.click()
  await expect(component.getByTestId('selected-provider')).toHaveText('google')
  await facebookButton.click()
  await expect(component.getByTestId('selected-provider')).toHaveText(
    'facebook',
  )
  await expect(googleButton).toHaveText('Continue with Google')
  await expect(facebookButton).toHaveText('Continue with Facebook')
})

test('keeps both provider actions usable in a mobile viewport', async ({
  mount,
  page,
}) => {
  const component = await mount('components/SocialSignInButtons/Interactive')
  const viewport = page.viewportSize()

  for (const name of ['Continue with Google', 'Continue with Facebook']) {
    const buttonBox = await component
      .getByRole('button', { name })
      .boundingBox()

    expect(buttonBox).not.toBeNull()
    expect(viewport).not.toBeNull()
    expect(buttonBox?.height).toBeGreaterThanOrEqual(44)
    expect(buttonBox?.x).toBeGreaterThanOrEqual(0)
    expect((buttonBox?.x ?? 0) + (buttonBox?.width ?? 0)).toBeLessThanOrEqual(
      viewport?.width ?? 0,
    )
  }
})

test('shows which provider is opening and prevents another selection', async ({
  mount,
}) => {
  const component = await mount('components/SocialSignInButtons/PendingGoogle')
  const googleButton = component.getByRole('button', {
    name: 'Continue with Google',
  })

  await expect(
    component.getByRole('group', { name: 'Social sign-in options' }),
  ).toHaveAttribute('aria-busy', 'true')
  await expect(googleButton).toBeDisabled()
  await expect(googleButton).toHaveAttribute('aria-busy', 'true')
  await expect(
    component.getByRole('button', { name: 'Continue with Facebook' }),
  ).toBeDisabled()
  await expect(component.getByRole('status')).toHaveText(
    'Opening Google sign-in.',
  )
})
