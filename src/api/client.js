const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

let getTokens = () => null
let setTokens = () => {}
let refreshTokens = async () => null
let onSessionExpired = () => {}

let refreshInFlight = null

export function configureApiClient(config) {
  getTokens = config.getTokens
  setTokens = config.setTokens
  refreshTokens = config.refreshTokens
  onSessionExpired = config.onSessionExpired ?? (() => {})
}

function buildUrl(path, params) {
  const url = new URL(`${API_BASE}${path}`, window.location.origin)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value))
      }
    })
  }
  return url.pathname + url.search
}

async function parseError(res) {
  let message = res.statusText
  try {
    const data = await res.json()
    message = data.message || data.detail || data.error || message
  } catch {
    if (res.status === 0 || res.status >= 500) {
      message = 'Cannot reach the backend API. Is the server running on port 8080?'
    }
  }
  return { message, status: res.status }
}

function clearSession() {
  setTokens(null)
  onSessionExpired()
}

async function tryRefresh() {
  if (!refreshInFlight) {
    refreshInFlight = refreshTokens().finally(() => {
      refreshInFlight = null
    })
  }
  return refreshInFlight
}

function shouldAttemptRefresh(res, auth) {
  return auth && res.status === 401
}

export async function apiRequest(path, options = {}) {
  const { params, body, auth = true, headers: customHeaders, ...init } = options
  const headers = new Headers(customHeaders)
  if (body !== undefined && !(body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }
  if (auth) {
    const tokens = getTokens()
    if (tokens?.accessToken) {
      headers.set('Authorization', `Bearer ${tokens.accessToken}`)
    }
  }

  const url = buildUrl(path, params)
  let res = await fetch(url, {
    ...init,
    headers,
    body: body !== undefined
      ? (body instanceof FormData ? body : JSON.stringify(body))
      : undefined,
  })

  if (shouldAttemptRefresh(res, auth)) {
    const refreshed = await tryRefresh()
    if (refreshed?.accessToken) {
      headers.set('Authorization', `Bearer ${refreshed.accessToken}`)
      res = await fetch(url, {
        ...init,
        headers,
        body: body !== undefined
      ? (body instanceof FormData ? body : JSON.stringify(body))
      : undefined,
      })
    } else {
      clearSession()
      throw { message: 'Session expired. Please sign in again.', status: 401 }
    }
  }

  if (auth && res.status === 401) {
    clearSession()
    throw { message: 'Session expired. Please sign in again.', status: 401 }
  }

  if (res.status === 204 || res.status === 202) {
    return undefined
  }

  if (!res.ok) {
    throw await parseError(res)
  }

  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('application/pdf')) {
    return await res.blob()
  }
  if (contentType.includes('application/json')) {
    return await res.json()
  }
  return undefined
}

export const api = {
  get: (path, params, auth = true) =>
    apiRequest(path, { method: 'GET', params, auth }),
  post: (path, body, params, auth = true) =>
    apiRequest(path, { method: 'POST', body, params, auth }),
  put: (path, body, params, auth = true) =>
    apiRequest(path, { method: 'PUT', body, params, auth }),
  patch: (path, body, auth = true) =>
    apiRequest(path, { method: 'PATCH', body, auth }),
  delete: (path, auth = true) =>
    apiRequest(path, { method: 'DELETE', auth }),
}
