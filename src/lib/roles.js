export const ROLES = {
  ADMIN: 'ADMIN',
  TEACHER: 'TEACHER',
  PARENT: 'PARENT',
}

export function normalizeRole(role) {
  if (!role) return null
  const upper = String(role).toUpperCase()
  return Object.values(ROLES).includes(upper) ? upper : null
}

export function parseRoleFromToken(accessToken) {
  if (!accessToken) return null
  try {
    const payload = JSON.parse(atob(accessToken.split('.')[1]))
    return normalizeRole(payload.role)
  } catch {
    return null
  }
}

export function homePathForRole(role) {
  const r = normalizeRole(role)
  if (r === ROLES.ADMIN) return '/admin'
  if (r === ROLES.TEACHER) return '/teacher'
  if (r === ROLES.PARENT) return '/parent'
  return '/login'
}

export function roleLabel(role) {
  const r = normalizeRole(role)
  if (r === ROLES.ADMIN) return 'Administrator'
  if (r === ROLES.TEACHER) return 'Teacher'
  if (r === ROLES.PARENT) return 'Parent'
  return 'Unknown'
}

export function hasRole(role, allowed) {
  const r = normalizeRole(role)
  return !!r && allowed.map(normalizeRole).includes(r)
}

/** UI/action permissions derived from the authenticated role. */
export function permissionsForRole(role) {
  const r = normalizeRole(role)
  return {
    role: r,
    isAdmin: r === ROLES.ADMIN,
    isTeacher: r === ROLES.TEACHER,
    isParent: r === ROLES.PARENT,
    canManageUsers: r === ROLES.ADMIN,
    canManageAcademics: r === ROLES.ADMIN,
    canManageAssessmentTypes: r === ROLES.ADMIN,
    canComputeTermResults: r === ROLES.ADMIN || r === ROLES.TEACHER,
    canSubmitTermResults: r === ROLES.TEACHER,
    canApproveTermResults: r === ROLES.ADMIN,
    canPublishTermResults: r === ROLES.ADMIN,
    canPublishExamTimetable: r === ROLES.ADMIN,
    canManageExamTimetable: r === ROLES.ADMIN || r === ROLES.TEACHER,
    canEnterGrades: r === ROLES.ADMIN || r === ROLES.TEACHER,
    usesParentStudentView: r === ROLES.PARENT,
    usesScopedClasses: r === ROLES.TEACHER,
  }
}
