import { describe, expect, it } from 'vitest'

import { isValidEmailAddress } from './email'

describe('email authentication', () => {
  it('accepts a valid email address with surrounding whitespace', () => {
    expect(isValidEmailAddress(' runner@example.com ')).toBe(true)
  })

  it.each(['', 'runner', 'runner@', '@example.com', 'runner@example'])(
    'rejects invalid email address %j',
    (email) => {
      expect(isValidEmailAddress(email)).toBe(false)
    },
  )
})
