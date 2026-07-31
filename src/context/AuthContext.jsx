import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AuthContext } from '@/context/auth-context'
import { authApi } from '@/api'
import { configureApiClient } from '@/api/client'
import { parseRoleFromToken, permissionsForRole, normalizeRole } from '@/lib/roles'
import { getAccessTokenExpiryMs, isAccessTokenExpired } from '@/lib/token'

import { loadTokens, saveTokens } from '@/lib/auth-storage'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => loadTokens())
  const refreshInFlight = useRef(null)

  const logout = useCallback(async () => {
    const tokens = loadTokens()
    if (tokens?.refreshToken) {
      try {
        await authApi.logout(tokens.refreshToken)
      } catch {
        // ignore
      }
    }
    saveTokens(null)
    setUser(null)
  }, [])

  const refresh = useCallback(async () => {
    if (refreshInFlight.current) {
      return refreshInFlight.current
    }

    const run = (async () => {
      const tokens = loadTokens()
      if (!tokens?.refreshToken) return null
      try {
        const refreshed = await authApi.refresh(tokens.refreshToken)
        saveTokens(refreshed)
        setUser(refreshed)
        return refreshed
      } catch {
        saveTokens(null)
        setUser(null)
        return null
      }
    })()

    refreshInFlight.current = run
    try {
      return await run
    } finally {
      refreshInFlight.current = null
    }
  }, [])

  const handleSessionExpired = useCallback(() => {
    saveTokens(null)
    setUser(null)
  }, [])

  useEffect(() => {
    configureApiClient({
      getTokens: () => loadTokens(),
      setTokens: (tokens) => {
        saveTokens(tokens)
        setUser(tokens)
      },
      refreshTokens: refresh,
      onSessionExpired: handleSessionExpired,
    })
  }, [refresh, handleSessionExpired])

  const login = useCallback(async (email, password) => {
    const tokens = await authApi.login(email, password)
    saveTokens(tokens)
    setUser(tokens)
    return tokens
  }, [])

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    const tokens = await authApi.changePassword(currentPassword, newPassword)
    saveTokens(tokens)
    setUser(tokens)
    return tokens
  }, [])

  // On load / token change: refresh if access token expired, otherwise schedule expiry handling.
  useEffect(() => {
    const tokens = loadTokens()
    if (!tokens?.accessToken) return

    let expiryTimer

    const handleExpiry = async () => {
      const current = loadTokens()
      if (!current?.accessToken) return
      if (!isAccessTokenExpired(current.accessToken)) return

      const refreshed = await refresh()
      if (!refreshed) {
        await logout()
      }
    }

    if (isAccessTokenExpired(tokens.accessToken)) {
      handleExpiry()
      return undefined
    }

    const expiryMs = getAccessTokenExpiryMs(tokens.accessToken)
    if (expiryMs) {
      expiryTimer = setTimeout(handleExpiry, Math.max(0, expiryMs - Date.now()))
    }

    const onFocus = () => {
      const current = loadTokens()
      if (current?.accessToken && isAccessTokenExpired(current.accessToken)) {
        handleExpiry()
      }
    }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)

    return () => {
      if (expiryTimer) clearTimeout(expiryTimer)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [user?.accessToken, refresh, logout])

  const value = useMemo(() => {
    const accessToken = user?.accessToken
    const sessionActive = !!(accessToken && user?.refreshToken)
    const role = normalizeRole(user?.role ?? parseRoleFromToken(accessToken))
    const perms = permissionsForRole(role)
    return {
      user,
      isAuthenticated: sessionActive,
      passwordChangeRequired: !!user?.passwordChangeRequired,
      login,
      logout,
      refresh,
      changePassword,
      role,
      ...perms,
    }
  }, [user, login, logout, refresh, changePassword])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
