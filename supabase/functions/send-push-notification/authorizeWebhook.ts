export function parseWebhookSecretKeys(rawSecretKeys: string | undefined) {
  if (!rawSecretKeys) {
    return []
  }

  try {
    const parsed = JSON.parse(rawSecretKeys) as unknown
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return []
    }

    return [
      ...new Set(
        Object.values(parsed).filter(
          (value): value is string =>
            typeof value === 'string' && value.length > 0,
        ),
      ),
    ]
  } catch {
    return []
  }
}

export function isAuthorizedWebhookRequest(
  headers: Headers,
  configuredSecretKeys: readonly string[],
) {
  const presentedSecretKey = headers.get('apikey')
  return (
    presentedSecretKey !== null &&
    configuredSecretKeys.includes(presentedSecretKey)
  )
}
