import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  consumeAuthDestination,
  preserveAuthDestination,
  resolveAuthDestination,
} from './destination'

describe('authentication destination', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('preserves a complete deeply nested internal location', () => {
    const destination =
      '/flocks/sunday-runners/events/tempo-run?pace=9%3A00#route-map'

    expect(preserveAuthDestination(destination)).toBe(destination)
    expect(consumeAuthDestination()).toBe(destination)
  })

  it('keeps the first meaningful destination during an auth redirect chain', () => {
    const invitation = '/flocks/sunday-runners/invite?token=abc123'

    expect(preserveAuthDestination(invitation)).toBe(invitation)
    expect(preserveAuthDestination('/flocks/another-flock')).toBe(invitation)
    expect(consumeAuthDestination()).toBe(invitation)
  })

  it('consumes the saved destination only once', () => {
    preserveAuthDestination('/flocks/sunday-runners')

    expect(consumeAuthDestination()).toBe('/flocks/sunday-runners')
    expect(consumeAuthDestination()).toBe('/')
  })

  it('replaces an invalid stored value with a safe destination', () => {
    preserveAuthDestination('/flocks/first-flock')
    const storageKey = window.sessionStorage.key(0)

    expect(storageKey).not.toBeNull()

    if (!storageKey) {
      return
    }

    window.sessionStorage.setItem(storageKey, 'https://attacker.example/path')

    expect(preserveAuthDestination('/flocks/sunday-runners')).toBe(
      '/flocks/sunday-runners',
    )
    expect(consumeAuthDestination()).toBe('/flocks/sunday-runners')
  })

  it.each([
    ['', 'an empty value'],
    ['flocks/sunday-runners', 'a path without a leading slash'],
    ['//attacker.example/path', 'a protocol-relative URL'],
    ['https://attacker.example/path', 'an external URL'],
    [`${window.location.origin}/flocks/sunday-runners`, 'an absolute URL'],
    ['/\\attacker.example/path', 'a path containing a backslash'],
    ['/sign-in', 'the sign-in route'],
    ['/sign-in/again?next=/flocks', 'a nested sign-in route'],
    ['/flocks/../sign-in?next=/flocks', 'a path normalized to sign-in'],
    ['/auth/callback?code=secret', 'the OAuth callback route'],
    [' /flocks/sunday-runners', 'a value with surrounding whitespace'],
  ])('falls back to home for %s (%s)', (destination) => {
    expect(resolveAuthDestination(destination)).toBe('/')
  })

  it('continues safely when session storage cannot be written', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Storage is unavailable', 'SecurityError')
    })

    expect(preserveAuthDestination('/flocks/sunday-runners')).toBe(
      '/flocks/sunday-runners',
    )
  })

  it('falls back to home when session storage cannot be read', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Storage is unavailable', 'SecurityError')
    })

    expect(consumeAuthDestination()).toBe('/')
  })
})
