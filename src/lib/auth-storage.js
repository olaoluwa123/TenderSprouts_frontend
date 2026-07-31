const STORAGE_KEY = 'school_portal_auth'

export function loadTokens() {
  const raw = localStorage.getItem(STORAGE_KEY)
  return raw ? JSON.parse(raw) : null
}

export function saveTokens(tokens) {
  if (tokens) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens))
  } else {
    localStorage.removeItem(STORAGE_KEY)
  }
}
