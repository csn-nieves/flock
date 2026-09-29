import { describe, expect, it } from 'vitest'

import { isValidEmailAddress, isValidEmailOtp } from './email'

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

  it('accepts a six-digit email code with surrounding whitespace', () => {
    expect(isValidEmailOtp(' 123456 ')).toBe(true)
  })

  it.each(['', '12345', '1234567', '12345a', '12 3456'])(
    'rejects invalid email code %j',
    (code) => {
      expect(isValidEmailOtp(code)).toBe(false)
    },
  )
})
