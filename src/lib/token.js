export function parseAccessTokenPayload(accessToken) {
  if (!accessToken) return null
  try {
    return JSON.parse(atob(accessToken.split('.')[1]))
  } catch {
    return null
  }
}

export function getAccessTokenExpiryMs(accessToken) {
  const payload = parseAccessTokenPayload(accessToken)
  if (!payload?.exp) return null
  return payload.exp * 1000
}

export function isAccessTokenExpired(accessToken, skewMs = 0) {
  const expiry = getAccessTokenExpiryMs(accessToken)
  if (!expiry) return true
  return Date.now() >= expiry - skewMs
}
