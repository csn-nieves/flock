import { useState } from 'react'

import { signInAnonymously, signOut } from '@src/data/auth'

function getErrorMessage(error: unknown) {
  if (error instanceof TypeError) {
    return 'We could not start the demo. Check your connection and try again.'
  }

  return 'We could not start the demo. Try again.'
}

export function useDemoAuthController() {
  const [error, setError] = useState<string>()
  const [isPending, setIsPending] = useState(false)

  async function startDemo() {
    if (isPending) return

    setError(undefined)
    setIsPending(true)

    try {
      const { error: signInError } = await signInAnonymously()
      if (signInError) throw signInError
    } catch (nextError) {
      await signOut()
      setError(getErrorMessage(nextError))
    } finally {
      setIsPending(false)
    }
  }

  return { error, isPending, startDemo }
}
