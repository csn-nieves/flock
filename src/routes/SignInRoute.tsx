import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'

import { consumeAuthDestination } from '@src/auth/destination'
import AuthPageLayout from '@src/components/AuthPageLayout'
import { useAuthSession } from '@src/hooks/useAuthSession'
import { useEmailAuthController } from '@src/hooks/useEmailAuthController'
import { useDemoAuthController } from '@src/hooks/useDemoAuthController'
import { useSocialAuthController } from '@src/hooks/useSocialAuthController'
import SignInPage from '@src/pages/SignInPage'

type SignInWorkflowRouteProps = {
  hasSessionError: boolean
}

function SignInWorkflowRoute({ hasSessionError }: SignInWorkflowRouteProps) {
  const emailAuth = useEmailAuthController()
  const demoAuth = useDemoAuthController()
  const socialAuth = useSocialAuthController()

  return (
    <SignInPage
      emailAuth={{
        changeEmail: emailAuth.changeEmail,
        email: emailAuth.email,
        isRequesting: emailAuth.isRequesting,
        isResending: emailAuth.isResending,
        isVerifying: emailAuth.isVerifying,
        requestCode: (email) => void emailAuth.requestCode(email),
        requestError: emailAuth.requestError,
        resendAvailableInSeconds: emailAuth.resendAvailableInSeconds,
        resendCode: () => void emailAuth.resendCode(),
        resendError: emailAuth.resendError,
        step: emailAuth.step,
        verificationError: emailAuth.verificationError,
        verifyCode: (code) => void emailAuth.verifyCode(code),
      }}
      hasSessionError={hasSessionError}
      demoAuth={demoAuth}
      socialAuth={{
        error: socialAuth.error,
        pendingProvider: socialAuth.pendingProvider,
        signInWithFacebook: () => void socialAuth.signIn('facebook'),
        signInWithGoogle: () => void socialAuth.signIn('google'),
      }}
    />
  )
}

function SignInRoute() {
  const { error, isLoading, session } = useAuthSession()
  const hasRedirectedRef = useRef(false)
  const navigate = useNavigate()
  let title = 'Sign in — Flock'

  if (isLoading) {
    title = 'Loading… — Flock'
  } else if (session) {
    title = 'Returning… — Flock'
  }

  useEffect(() => {
    document.title = title

    return () => {
      document.title = 'Flock'
    }
  }, [title])

  useEffect(() => {
    if (isLoading || !session || hasRedirectedRef.current) {
      return
    }

    hasRedirectedRef.current = true
    navigate(consumeAuthDestination(), { replace: true })
  }, [isLoading, navigate, session])

  if (isLoading) {
    return (
      <AuthPageLayout
        description="Checking your session…"
        heading="Getting Flock ready"
        isStatus
      />
    )
  }

  if (session) {
    return (
      <AuthPageLayout
        description="Taking you back to where you left off…"
        heading="Returning you to Flock"
        isStatus
      />
    )
  }

  return <SignInWorkflowRoute hasSessionError={Boolean(error)} />
}

export default SignInRoute
