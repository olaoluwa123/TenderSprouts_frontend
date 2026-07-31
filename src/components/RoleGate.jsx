import { useAuth } from '@/hooks/useAuth'
import { hasRole } from '@/lib/roles'

/** Render children only when the current user has one of the allowed roles. */
export function RoleGate({ roles, children, fallback = null }) {
  const { role } = useAuth()
  if (!hasRole(role, roles)) return fallback
  return children
}
