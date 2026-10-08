import { describe, expect, it } from 'vitest'

import {
  isAuthorizedWebhookRequest,
  parseWebhookSecretKeys,
} from './authorizeWebhook.ts'

describe('push webhook authorization', () => {
  it('reads every non-empty secret from the Supabase key dictionary', () => {
    expect(
      parseWebhookSecretKeys(
        JSON.stringify({
          current: 'sb_secret_current',
          duplicate: 'sb_secret_current',
          next: 'sb_secret_next',
          ignored: null,
        }),
      ),
    ).toEqual(['sb_secret_current', 'sb_secret_next'])
  })

  it.each([undefined, '', 'not-json', '[]', 'null'])(
    'treats %s as missing configuration',
    (configuredValue) => {
      expect(parseWebhookSecretKeys(configuredValue)).toEqual([])
    },
  )

  it('accepts a currently configured secret key from the apikey header', () => {
    const headers = new Headers({ apikey: 'sb_secret_current' })

    expect(
      isAuthorizedWebhookRequest(headers, [
        'sb_secret_current',
        'sb_secret_next',
      ]),
    ).toBe(true)
  })

  it('rejects a missing or unknown secret key', () => {
    expect(
      isAuthorizedWebhookRequest(new Headers(), ['sb_secret_current']),
    ).toBe(false)
    expect(
      isAuthorizedWebhookRequest(new Headers({ apikey: 'sb_secret_unknown' }), [
        'sb_secret_current',
      ]),
    ).toBe(false)
  })

  it('does not accept the legacy service-role bearer header', () => {
    const headers = new Headers({
      authorization: 'Bearer legacy-service-role-key',
    })

    expect(isAuthorizedWebhookRequest(headers, ['sb_secret_current'])).toBe(
      false,
    )
  })
})
