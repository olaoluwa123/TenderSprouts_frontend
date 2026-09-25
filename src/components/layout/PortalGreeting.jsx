import { parentsApi, teachersApi, usersApi } from '@/api'
import { useAuth } from '@/hooks/useAuth'
import { useAsync } from '@/hooks/useAsync'
import { ROLES, roleLabel } from '@/lib/roles'

function greetingForHour(date = new Date()) {
  const h = date.getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function formatLongDate(date = new Date()) {
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function PortalGreeting() {
  const { user, role } = useAuth()
  const profileId = user?.profileId
  const userId = user?.userId

  const { data: displayName } = useAsync(async () => {
    if (role === ROLES.TEACHER && profileId) {
      const profile = await teachersApi.get(profileId).catch(() => null)
      return profile?.fullName || null
    }
    if (role === ROLES.PARENT) {
      const me = await parentsApi.me().catch(() => null)
      return me?.fullName || null
    }
    if (role === ROLES.ADMIN && userId) {
      const admin = await usersApi.get(userId).catch(() => null)
      return admin?.fullName || admin?.email || null
    }
    return null
  }, [role, profileId, userId])

  const name = displayName
    || (typeof user?.email === 'string' ? user.email.split('@')[0] : null)
    || roleLabel(role)
    || 'there'

  return (
    <div className="mb-6">
      <p className="font-display text-xl font-semibold tracking-tight text-ink sm:text-2xl">
        {greetingForHour()}, {name}
      </p>
      <p className="mt-1 text-sm text-muted">{formatLongDate()}</p>
    </div>
  )
}
