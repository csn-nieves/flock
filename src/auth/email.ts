const EMAIL_ADDRESS_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const EMAIL_OTP_PATTERN = /^\d{6}$/

export function isValidEmailAddress(email: string) {
  return EMAIL_ADDRESS_PATTERN.test(email.trim())
}

export function isValidEmailOtp(code: string) {
  return EMAIL_OTP_PATTERN.test(code.trim())
}
