import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

/** The banner is only meaningful where the app talks to the API, not on the public marketing pages. */
const PORTAL_PREFIXES = ['/admin', '/teacher', '/parent', '/login', '/forgot-password', '/reset-password', '/change-password']

export function ApiStatusBanner() {
  const [status, setStatus] = useState('checking')
  const { pathname } = useLocation()
  const onPortalRoute = PORTAL_PREFIXES.some((prefix) => pathname.startsWith(prefix))

  useEffect(() => {
    let cancelled = false
    const check = async () => {
      try {
        const res = await fetch('/actuator/health')
        if (!cancelled) setStatus(res.ok ? 'online' : 'offline')
      } catch {
        if (!cancelled) setStatus('offline')
      }
    }
    check()
    const id = setInterval(check, 30000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  if (!onPortalRoute || status === 'checking' || status === 'online') return null

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-900">
      Backend API is unreachable. Start the server with <code className="rounded bg-amber-100 px-1">mvn spring-boot:run</code> on port 8080.
    </div>
  )
}
