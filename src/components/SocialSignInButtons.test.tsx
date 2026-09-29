import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import SocialSignInButtons from './SocialSignInButtons'

describe('SocialSignInButtons', () => {
  it('reports the selected provider through its callback', () => {
    const handleFacebookSignIn = vi.fn()
    const handleGoogleSignIn = vi.fn()

    render(
      <SocialSignInButtons
        onFacebookSignIn={handleFacebookSignIn}
        onGoogleSignIn={handleGoogleSignIn}
      />,
    )

    fireEvent.click(
      screen.getByRole('button', { name: 'Continue with Google' }),
    )
    fireEvent.click(
      screen.getByRole('button', { name: 'Continue with Facebook' }),
    )

    expect(handleGoogleSignIn).toHaveBeenCalledOnce()
    expect(handleFacebookSignIn).toHaveBeenCalledOnce()
  })

  it('disables both options when social sign-in is unavailable', () => {
    render(
      <SocialSignInButtons
        disabled
        onFacebookSignIn={vi.fn()}
        onGoogleSignIn={vi.fn()}
      />,
    )

    expect(
      screen.getByRole('button', { name: 'Continue with Google' }),
    ).toBeDisabled()
    expect(
      screen.getByRole('button', { name: 'Continue with Facebook' }),
    ).toBeDisabled()
  })

  it('locks both options and announces the provider while redirecting', () => {
    render(
      <SocialSignInButtons
        pendingProvider="facebook"
        onFacebookSignIn={vi.fn()}
        onGoogleSignIn={vi.fn()}
      />,
    )

    expect(
      screen.getByRole('group', { name: 'Social sign-in options' }),
    ).toHaveAttribute('aria-busy', 'true')
    expect(
      screen.getByRole('button', { name: 'Continue with Google' }),
    ).toBeDisabled()
    expect(
      screen.getByRole('button', { name: 'Continue with Facebook' }),
    ).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByRole('status')).toHaveTextContent(
      'Opening Facebook sign-in.',
    )
  })
})
