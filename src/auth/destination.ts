const AUTH_DESTINATION_STORAGE_KEY = 'flock.auth.destination'
const DEFAULT_AUTH_DESTINATION = '/'
const BLOCKED_AUTH_PATHS = ['/auth/callback', '/sign-in']

function isBlockedAuthPath(pathname: string) {
  return BLOCKED_AUTH_PATHS.some(
    (blockedPath) =>
      pathname === blockedPath || pathname.startsWith(`${blockedPath}/`),
  )
}

function parseAuthDestination(destination: string | null | undefined) {
  if (
    !destination ||
    destination !== destination.trim() ||
    !destination.startsWith('/') ||
    destination.startsWith('//') ||
    destination.includes('\\')
  ) {
    return null
  }

  try {
    const url = new URL(destination, window.location.origin)

    if (
      url.origin !== window.location.origin ||
      isBlockedAuthPath(url.pathname)
    ) {
      return null
    }

    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return null
  }
}

function readStoredDestination() {
  try {
    return window.sessionStorage.getItem(AUTH_DESTINATION_STORAGE_KEY)
  } catch {
    return null
  }
}

function removeStoredDestination() {
  try {
    window.sessionStorage.removeItem(AUTH_DESTINATION_STORAGE_KEY)
  } catch {
    // Storage can be unavailable in restricted browser contexts.
  }
}

function writeStoredDestination(destination: string) {
  try {
    window.sessionStorage.setItem(AUTH_DESTINATION_STORAGE_KEY, destination)
  } catch {
    // Navigation can still use the validated destination for this render.
  }
}

export function resolveAuthDestination(destination: string | null | undefined) {
  return parseAuthDestination(destination) ?? DEFAULT_AUTH_DESTINATION
}

export function preserveAuthDestination(destination: string) {
  const storedDestination = readStoredDestination()
  const safeStoredDestination = parseAuthDestination(storedDestination)

  if (safeStoredDestination) {
    return safeStoredDestination
  }

  if (storedDestination !== null) {
    removeStoredDestination()
  }

  const safeDestination = parseAuthDestination(destination)

  if (!safeDestination) {
    return DEFAULT_AUTH_DESTINATION
  }

  writeStoredDestination(safeDestination)

  return safeDestination
}

export function consumeAuthDestination() {
  const storedDestination = readStoredDestination()

  removeStoredDestination()

  return resolveAuthDestination(storedDestination)
}
