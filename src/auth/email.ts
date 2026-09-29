const EMAIL_ADDRESS_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmailAddress(email: string) {
  return EMAIL_ADDRESS_PATTERN.test(email.trim())
}
