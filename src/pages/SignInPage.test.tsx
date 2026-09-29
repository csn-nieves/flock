import type { Session } from '@supabase/supabase-js'
import { fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import SignInPage from './SignInPage'

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

const authSession = vi.hoisted(() => ({
  error: null as Error | null,
  isLoading: false,
  session: null as Session | null,
}))

vi.mock('@src/hooks/useAuthSession', () => ({
  useAuthSession: () => authSession,
}))

function renderSignInRoute() {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: <p>Flock home</p>,
      },
      {
        path: '/sign-in',
        element: <SignInPage />,
      },
    ],
    { initialEntries: ['/sign-in'] },
  )

  render(<RouterProvider router={router} />)

  return router
}

describe('SignInPage', () => {
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
  })

  it('shows an honest loading state while resolving the session', () => {
    authSession.isLoading = true
    render(<SignInPage />)

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

  it('replaces the sign-in route when a session already exists', async () => {
    authSession.session = { user: { id: 'runner-id' } } as Session
    const router = renderSignInRoute()

    expect(await screen.findByText('Flock home')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/')
    expect(router.state.historyAction).toBe('REPLACE')
  })

  it('keeps sign-in available after a session check failure', () => {
    authSession.error = new Error('raw provider message')
    render(<SignInPage />)

    expect(screen.getByRole('alert')).toHaveTextContent(
      'We could verify whether you are already signed in. You can still sign in below.',
    )
    expect(screen.queryByText('raw provider message')).not.toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Email address' })).toBeEnabled()
  })

  it('renders email entry and forwards the submitted address', () => {
    render(<SignInPage />)

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

  it('renders verification and connects each available action', () => {
    controller.email = 'runner@example.com'
    controller.resendAvailableInSeconds = 0
    controller.step = 'verification'
    render(<SignInPage />)

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
    render(<SignInPage />)

    expect(screen.getByRole('alert')).toHaveTextContent(
      'That code is invalid or has expired. Check the code and try again.',
    )
    expect(screen.getByRole('button', { name: 'Verify code' })).toBeDisabled()
    expect(
      screen.getByRole('button', { name: 'Send another code' }),
    ).toBeDisabled()
  })
})
