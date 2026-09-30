import type { Session } from '@supabase/supabase-js'
import { fireEvent, render, screen } from '@testing-library/react'
import { StrictMode } from 'react'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import SignInRoute from './SignInRoute'

const controller = vi.hoisted(() => ({
  changeEmail: vi.fn(),
  email: '',
  isRequesting: false,
  isResending: false,
  isVerifying: false,
  requestCode: vi.fn(),
  requestError: undefined as string | undefined,
  resendAvailableInSeconds: 0,
  resendCode: vi.fn(),
  resendError: undefined as string | undefined,
  step: 'email' as 'email' | 'verification',
  verificationError: undefined as string | undefined,
  verifyCode: vi.fn(),
}))

vi.mock('@src/hooks/useEmailAuthController', () => ({
  useEmailAuthController: () => controller,
}))

const socialController = vi.hoisted(() => ({
  error: undefined as string | undefined,
  pendingProvider: undefined as 'facebook' | 'google' | undefined,
  signIn: vi.fn(),
}))

vi.mock('@src/hooks/useSocialAuthController', () => ({
  useSocialAuthController: () => socialController,
}))

const authSession = vi.hoisted(() => ({
  error: null as Error | null,
  isLoading: false,
  session: null as Session | null,
}))

vi.mock('@src/hooks/useAuthSession', () => ({
  useAuthSession: () => authSession,
}))

const destination = vi.hoisted(() => ({
  consumeAuthDestination: vi.fn(() => '/'),
}))

vi.mock('@src/auth/destination', () => destination)

function renderSignInRoute({ strict = false } = {}) {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: <p>Flock home</p>,
      },
      {
        path: '/sign-in',
        element: <SignInRoute />,
      },
      {
        path: '/flocks/:flockId/events/:eventId',
        element: <p>Run details</p>,
      },
    ],
    { initialEntries: ['/sign-in'] },
  )

  const route = <RouterProvider router={router} />

  render(strict ? <StrictMode>{route}</StrictMode> : route)

  return router
}

describe('SignInRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authSession.error = null
    authSession.isLoading = false
    authSession.session = null
    controller.email = ''
    controller.isRequesting = false
    controller.isResending = false
    controller.isVerifying = false
    controller.requestError = undefined
    controller.resendAvailableInSeconds = 0
    controller.resendError = undefined
    controller.step = 'email'
    controller.verificationError = undefined
    socialController.error = undefined
    socialController.pendingProvider = undefined
    destination.consumeAuthDestination.mockReturnValue('/')
  })

  it('shows an honest loading state while resolving the session', () => {
    authSession.isLoading = true
    renderSignInRoute()

    expect(document.title).toBe('Loading… — Flock')
    expect(
      screen.getByRole('heading', { level: 1, name: 'Getting Flock ready' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Checking your session…',
    )
    expect(
      screen.queryByRole('textbox', { name: 'Email address' }),
    ).not.toBeInTheDocument()
  })

  it('restores a complete saved destination when a session exists', async () => {
    authSession.session = { user: { id: 'runner-id' } } as Session
    destination.consumeAuthDestination.mockReturnValue(
      '/flocks/sunday-runners/events/tempo-run?pace=9%3A00#route-map',
    )
    const router = renderSignInRoute({ strict: true })

    expect(await screen.findByText('Run details')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe(
      '/flocks/sunday-runners/events/tempo-run',
    )
    expect(router.state.location.search).toBe('?pace=9%3A00')
    expect(router.state.location.hash).toBe('#route-map')
    expect(router.state.historyAction).toBe('REPLACE')
    expect(destination.consumeAuthDestination).toHaveBeenCalledOnce()
  })

  it('replaces sign-in with the home fallback without a saved destination', async () => {
    authSession.session = { user: { id: 'runner-id' } } as Session
    const router = renderSignInRoute()

    expect(await screen.findByText('Flock home')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/')
    expect(router.state.historyAction).toBe('REPLACE')
  })

  it('keeps sign-in available after a session check failure', () => {
    authSession.error = new Error('raw provider message')
    renderSignInRoute()

    expect(screen.getByRole('alert')).toHaveTextContent(
      'We could not verify whether you are already signed in. You can still sign in below.',
    )
    expect(screen.queryByText('raw provider message')).not.toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Email address' })).toBeEnabled()
  })

  it('renders email entry and forwards the submitted address', () => {
    renderSignInRoute()

    expect(document.title).toBe('Sign in — Flock')
    expect(
      screen.getByRole('heading', { level: 1, name: 'Sign in to Flock' }),
    ).toBeInTheDocument()

    fireEvent.change(screen.getByRole('textbox', { name: 'Email address' }), {
      target: { value: 'runner@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send code' }))

    expect(controller.requestCode).toHaveBeenCalledWith('runner@example.com')
  })

  it('renders social options and forwards provider intent', () => {
    renderSignInRoute()

    fireEvent.click(
      screen.getByRole('button', { name: 'Continue with Google' }),
    )
    fireEvent.click(
      screen.getByRole('button', { name: 'Continue with Facebook' }),
    )

    expect(socialController.signIn).toHaveBeenNthCalledWith(1, 'google')
    expect(socialController.signIn).toHaveBeenNthCalledWith(2, 'facebook')
  })

  it('locks every sign-in method while a social redirect is pending', () => {
    socialController.pendingProvider = 'google'
    renderSignInRoute()

    expect(
      screen.getByRole('button', { name: 'Continue with Google' }),
    ).toHaveAttribute('aria-busy', 'true')
    expect(
      screen.getByRole('button', { name: 'Continue with Facebook' }),
    ).toBeDisabled()
    expect(
      screen.getByRole('textbox', { name: 'Email address' }),
    ).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Send code' })).toBeDisabled()
  })

  it('shows safe social sign-in recovery without hiding email', () => {
    socialController.error =
      'Google sign-in could not start. Try again or use email.'
    renderSignInRoute()

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Error: Google sign-in could not start. Try again or use email.',
    )
    expect(screen.getByRole('textbox', { name: 'Email address' })).toBeEnabled()
  })

  it('renders verification and connects each available action', () => {
    controller.email = 'runner@example.com'
    controller.resendAvailableInSeconds = 0
    controller.step = 'verification'
    renderSignInRoute()

    expect(
      screen.getByRole('heading', { level: 1, name: 'Check your email' }),
    ).toBeInTheDocument()
    expect(screen.getByText('runner@example.com')).toBeVisible()

    fireEvent.change(screen.getByRole('textbox', { name: 'Six-digit code' }), {
      target: { value: '123456' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Verify code' }))
    fireEvent.click(screen.getByRole('button', { name: 'Send another code' }))
    fireEvent.click(screen.getByRole('button', { name: 'Change email' }))

    expect(controller.verifyCode).toHaveBeenCalledWith('123456')
    expect(controller.resendCode).toHaveBeenCalledOnce()
    expect(controller.changeEmail).toHaveBeenCalledOnce()
  })

  it('passes controller errors and pending state to verification', () => {
    controller.email = 'runner@example.com'
    controller.isVerifying = true
    controller.step = 'verification'
    controller.verificationError =
      'That code is invalid or has expired. Check the code and try again.'
    renderSignInRoute()

    expect(screen.getByRole('alert')).toHaveTextContent(
      'That code is invalid or has expired. Check the code and try again.',
    )
    expect(screen.getByRole('button', { name: 'Verify code' })).toBeDisabled()
    expect(
      screen.getByRole('button', { name: 'Send another code' }),
    ).toBeDisabled()
  })
})
