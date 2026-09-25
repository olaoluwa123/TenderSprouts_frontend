import { roleLabel } from '@/lib/roles'

const ACTION_VERBS = {
  CREATE: 'Created',
  UPDATE: 'Updated',
  DELETE: 'Deleted',
  ACTIVATE: 'Activated',
  DEACTIVATE: 'Deactivated',
  REACTIVATE: 'Reactivated',
  ASSIGN: 'Assigned',
  UNASSIGN: 'Unassigned',
  ENROLL: 'Enrolled a pupil',
  LINK: 'Linked',
  UNLINK: 'Unlinked',
  MARK: 'Marked',
  COMPUTE: 'Computed',
  SUBMIT: 'Submitted',
  PUBLISH: 'Published',
  REPUBLISH: 'Republished',
  GENERATE: 'Generated',
  UPSERT: 'Saved',
  BATCH_AMOUNTS: 'Updated fee amounts',
  ENSURE_FROM_TEMPLATE: 'Applied the fee template',
  ONBOARD_TEACHER: 'Onboarded a teacher',
  ONBOARD_PARENT: 'Onboarded a parent',
  BULK_PROMOTE: 'Promoted pupils',
  FORCE_PASSWORD_RESET: 'Sent a password reset',
  MARK_PAID: 'Marked a fee as paid',
  UPDATE_ROLE: 'Changed a user role',
}

const ACTION_INCLUDES_AREA = new Set([
  'ENROLL',
  'BATCH_AMOUNTS',
  'ENSURE_FROM_TEMPLATE',
  'ONBOARD_TEACHER',
  'ONBOARD_PARENT',
  'BULK_PROMOTE',
  'FORCE_PASSWORD_RESET',
  'MARK_PAID',
  'UPDATE_ROLE',
])

const ENTITY_LABELS = {
  fee_school_template: 'the school fee template',
  fee_template: 'a class fee template',
  fee_structure: 'school fees',
  invoice: 'a fee invoice',
  student: 'a pupil',
  student_enrollment: 'an enrolment',
  grades: 'grades',
  attendance: 'class attendance',
  staff_attendance: 'staff attendance',
  term_results: 'term results',
  term_result: 'a term result',
  academic_session: 'an academic session',
  term: 'a term',
  calendar_event: 'a calendar event',
  teacher_timetable_slot: 'a timetable slot',
  class: 'a class',
  class_subject: 'a class subject',
  subject: 'a subject',
  assessment_type: 'an assessment type',
  announcement: 'an announcement',
  teacher: 'a teacher',
  teacher_subject: 'a teacher subject',
  teacher_class: 'a class teacher',
  exam_timetable_slot: 'an exam slot',
  exam_timetable: 'the exam timetable',
  parent: 'a parent',
  parent_profile: 'a parent profile',
  parent_student: 'a parent to a pupil',
  user: 'a user',
}

function pad(n) {
  return String(n).padStart(2, '0')
}

function toDate(value) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatActivityDate(value) {
  const date = toDate(value)
  if (!date) return '—'
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${String(date.getFullYear()).slice(-2)}`
}

export function formatActivityDateTime(value) {
  const date = toDate(value)
  if (!date) return '—'
  return `${formatActivityDate(value)}, ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function activityUserName(item) {
  const name = item?.userName?.trim()
  if (!name) return 'System'
  const upper = name.toUpperCase()
  if (upper === 'ADMIN' || upper === 'TEACHER' || upper === 'PARENT') {
    return 'Unknown user'
  }
  return name
}

function humanDetails(details) {
  const value = String(details ?? '').trim()
  if (!value) return null
  if (/=/.test(value) || /#\d/.test(value) || /^\d+$/.test(value)) return null
  return value
}

function verbFor(action) {
  if (!action) return 'Recorded an action'
  return ACTION_VERBS[action] || action.replaceAll('_', ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase())
}

function areaFor(entityType) {
  if (!entityType) return null
  return ENTITY_LABELS[entityType] || entityType.replaceAll('_', ' ')
}

export function activityNote(item) {
  const action = item?.action
  const verb = verbFor(action)
  const detail = humanDetails(item?.details)
  const area = ACTION_INCLUDES_AREA.has(action) ? null : areaFor(item?.entityType)

  let note = verb
  if (area) note = `${verb} ${area}`
  if (detail) note = `${note} (${detail})`
  return note
}

export function activityNarrative(item) {
  const name = activityUserName(item)
  const role = roleLabel(item?.userRole)
  const note = activityNote(item)
  const date = formatActivityDate(item?.createdAt)
  const when = formatActivityDateTime(item?.createdAt)
  const sentence = `${name} (${role}) ${note.charAt(0).toLowerCase()}${note.slice(1)} on ${date}.`
  return {
    title: `${name} · ${date}`,
    sentence,
    when,
    name,
    role,
    note,
  }
}
