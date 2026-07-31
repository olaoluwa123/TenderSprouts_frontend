import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { homePathForRole } from '@/lib/roles'

export function ProtectedRoute({ roles }) {
  const { isAuthenticated, passwordChangeRequired, role } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (passwordChangeRequired) {
    return <Navigate to="/change-password" replace />
  }

  if (roles?.length && !roles.includes(role)) {
    return <Navigate to={homePathForRole(role)} replace />
  }

  return <Outlet />
}
