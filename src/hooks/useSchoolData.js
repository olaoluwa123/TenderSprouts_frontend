import { useMemo } from 'react'
import { classesApi, parentsApi, sessionsApi, studentsApi, subjectsApi, teachersApi, usersApi } from '@/api'
import { useAuth } from '@/hooks/useAuth'
import { useAsync } from './useAsync'

export function useActiveSession() {
  return useAsync(() => sessionsApi.active(), [])
}

export function useActiveTerm() {
  return useAsync(() => sessionsApi.activeTerm(), [])
}

export function useSessions() {
  return useAsync(() => sessionsApi.list({ size: 100 }).then((p) => p.content), [])
}

export function useTerms(sessionId) {
  return useAsync(
    () => (sessionId ? sessionsApi.terms(sessionId) : Promise.resolve([])),
    [sessionId],
  )
}

export function useClasses() {
  return useAsync(() => classesApi.list({ size: 100 }).then((p) => p.content), [])
}

export function useSubjects() {
  return useAsync(() => subjectsApi.list({ size: 100 }).then((p) => p.content), [])
}

export function useTeachers(enabled = true) {
  return useAsync(
    () => enabled
      ? usersApi.list({ role: 'TEACHER', isActive: true, size: 100 }).then((p) => p.content).catch(() => [])
      : Promise.resolve([]),
    [enabled],
  )
}

export function useParents(enabled = true) {
  const { isAdmin, isTeacher } = useAuth()
  return useAsync(
    () => {
      if (!enabled) return Promise.resolve([])
      if (isAdmin) {
        return usersApi.list({ role: 'PARENT', isActive: true, size: 100 })
          .then((p) => p.content)
          .catch(() => [])
      }
      if (isTeacher) {
        return parentsApi.list({ size: 100 })
          .then((p) => p.content.map((parent) => ({
            id: parent.userId,
            email: parent.email,
            role: 'PARENT',
            profileId: parent.id,
            students: parent.students ?? [],
          })))
          .catch(() => [])
      }
      return Promise.resolve([])
    },
    [enabled, isAdmin, isTeacher],
  )
}

export function useStudents(classId, sessionId) {
  return useAsync(
    () => studentsApi.list({
      classId,
      sessionId,
      size: 200,
    }).then((p) => p.content),
    [classId, sessionId],
  )
}

/** Classes visible to the current user (all for admin, assigned only for teacher). */
export function useAssignedClasses() {
  const { isAdmin, isTeacher, user } = useAuth()
  const { data: allClasses, loading: classesLoading } = useClasses()
  const { data: assignments, loading: assignmentsLoading } = useAsync(
    () => isTeacher && user?.profileId
      ? teachersApi.classes(user.profileId)
      : Promise.resolve([]),
    [isTeacher, user?.profileId],
  )

  const classes = useMemo(() => {
    if (isAdmin) return allClasses ?? []
    if (isTeacher) {
      const allowed = new Set((assignments ?? []).map((a) => a.classId))
      return (allClasses ?? []).filter((c) => allowed.has(c.id))
    }
    return []
  }, [isAdmin, isTeacher, allClasses, assignments])

  return {
    classes,
    loading: classesLoading || (isTeacher && assignmentsLoading),
    isScoped: isTeacher,
  }
}
