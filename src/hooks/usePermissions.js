import { useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { permissionsForRole } from '@/lib/roles'

export function usePermissions() {
  const { role } = useAuth()
  return useMemo(() => permissionsForRole(role), [role])
}
