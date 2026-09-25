import { useState } from 'react'
import { Link } from 'react-router-dom'
import { announcementsApi, attendanceApi, dashboardApi, teachersApi } from '@/api'
import { useAuth } from '@/hooks/useAuth'
import { DashboardSkeleton } from '@/components/dashboard'
import { ClassSelect } from '@/components/ui/SchoolSelects'
import { Alert, Button, Field, PageHeader } from '@/components/ui'
import { useAsync } from '@/hooks/useAsync'

const WEEKDAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']

function todayIso() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function formatTime(value) {
  if (!value) return '—'
  const text = String(value).slice(0, 5)
  return text
}

function StatCard({ label, value, to }) {
  const body = (
    <div className="rounded-2xl border border-blossom-200/80 bg-white p-4 shadow-sm shadow-blossom-500/5 transition hover:border-brand-200">
      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-ink">{value ?? 0}</p>
    </div>
  )
  return to ? <Link to={to}>{body}</Link> : body
}

export function TeacherDashboard() {
  const { user } = useAuth()
  const teacherId = user?.profileId
  const today = todayIso()
  const [classId, setClassId] = useState('')

  const { data, loading, error, reload } = useAsync(
    () => dashboardApi.teacher(classId ? { classId: Number(classId) } : undefined),
    [classId],
  )
  const { data: assignments } = useAsync(
    () => (teacherId ? teachersApi.classes(teacherId).catch(() => []) : Promise.resolve([])),
    [teacherId],
  )
  const { data: subjects } = useAsync(
    () => (teacherId ? teachersApi.listSubjects(teacherId).catch(() => []) : Promise.resolve([])),
    [teacherId],
  )
  const { data: timetable } = useAsync(
    () => (teacherId ? teachersApi.timetable(teacherId).catch(() => []) : Promise.resolve([])),
    [teacherId],
  )
  const classList = (data?.classes?.length
    ? data.classes
    : (assignments ?? []).length
      ? assignments
      : (data?.classId
        ? [{ classId: data.classId, className: data.className, isActive: true }]
        : []))
  const classOptions = classList.map((row) => ({
    id: row.classId,
    name: row.className || `Class #${row.classId}`,
  }))
  const selectedClassId = classId || (data?.classId ? String(data.classId) : '')
  const { data: attendanceRows } = useAsync(
    () => (selectedClassId
      ? attendanceApi.byClass(Number(selectedClassId), today).catch(() => [])
      : Promise.resolve([])),
    [selectedClassId, today],
  )
  const { data: inbox } = useAsync(() => announcementsApi.inbox().catch(() => []), [])

  if (loading) return <DashboardSkeleton />
  if (error) {
    return (
      <div>
        <PageHeader title="Dashboard" />
        <Alert>{error}</Alert>
        <Button className="mt-3" variant="secondary" onClick={reload}>Retry</Button>
      </div>
    )
  }

  const progress = data?.gradingProgress ?? {}
  const pupilCount = data?.studentCount ?? 0
  const subjectCount = (subjects ?? []).length || progress.subjectCount || 0
  const todayName = WEEKDAYS[new Date().getDay()]
  const todaySlots = (Array.isArray(timetable) ? timetable : [])
    .filter((slot) => slot.dayOfWeek === todayName)
    .slice()
    .sort((a, b) => String(a.startTime || '').localeCompare(String(b.startTime || '')))

  const sheet = Array.isArray(attendanceRows)
    ? attendanceRows
    : (attendanceRows?.pupils ?? [])
  const present = sheet.filter((r) => r.status === 'PRESENT').length
  const absent = sheet.filter((r) => r.status === 'ABSENT').length
  const late = sheet.filter((r) => r.status === 'LATE').length
  const excused = sheet.filter((r) => r.status === 'EXCUSED').length

  const announcements = Array.isArray(inbox) ? inbox : (inbox?.content ?? [])
  const recent = [
    ...announcements.slice(0, 2).map((a) => ({
      id: `a-${a.id}`,
      text: a.title || 'Announcement',
      meta: 'Announcement',
    })),
    ...(data?.upcomingExams ?? []).slice(0, 2).map((e) => ({
      id: `e-${e.id}`,
      text: `${e.subjectName} exam`,
      meta: e.examDate,
    })),
  ].slice(0, 5)

  return (
    <div className="space-y-6">
      {data?.termName && (
        <p className="text-xs text-muted">
          {data.sessionName} · {data.termName}
          {data.className ? ` · ${data.className}` : ''}
        </p>
      )}

      {classOptions.length > 1 && (
        <div className="max-w-xs">
          <Field label="Class">
            <ClassSelect
              value={selectedClassId}
              onChange={setClassId}
              classes={classOptions}
              alwaysShow
            />
          </Field>
        </div>
      )}

      {!data?.classId && classList.length === 0 && (
        <Alert tone="info">Ask an admin to assign you to a class to unlock attendance and grading.</Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Pupils" value={pupilCount} to="/teacher/pupils" />
        <StatCard label="Subjects" value={subjectCount} to="/teacher/subjects" />
      </div>

      <section className="rounded-2xl border border-blossom-200/80 bg-white p-5 shadow-sm shadow-blossom-500/5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold tracking-tight text-ink">Today&apos;s timetable</h2>
          <Link to="/teacher/timetable" className="text-xs font-medium text-brand-700 hover:text-brand-700">
            Edit timetable
          </Link>
        </div>
        {todaySlots.length === 0 ? (
          <p className="py-6 text-sm text-muted">
            {classList.length === 0
              ? 'No class assigned yet.'
              : 'No periods set for today. Add your weekly timetable to see today’s classes here.'}
          </p>
        ) : (
          <ul className="divide-y divide-blossom-100">
            {todaySlots.map((slot) => (
              <li
                key={slot.id}
                className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0"
              >
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">
                    {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                    {slot.room ? ` · ${slot.room}` : ''}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-ink">
                    {slot.subjectName || 'Class session'}
                    {' — '}
                    {slot.className || `Class #${slot.classId}`}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link to="/teacher/attendance">
                    <Button size="sm" variant="secondary">Attendance</Button>
                  </Link>
                  <Link to="/teacher/pupils">
                    <Button size="sm" variant="ghost">View pupils</Button>
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-blossom-200/80 bg-white p-5 shadow-sm shadow-blossom-500/5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold tracking-tight text-ink">Attendance overview</h2>
            <span className="text-xs text-muted">Today</span>
          </div>
          {!selectedClassId ? (
            <p className="py-6 text-sm text-muted">Assign a class to see today’s attendance.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ['Present', present],
                ['Absent', absent],
                ['Late', late],
                ['Excused', excused],
              ].map(([label, count]) => (
                <div key={label} className="rounded-xl bg-brand-50/70 px-3 py-3">
                  <p className="text-[11px] uppercase tracking-wide text-muted">{label}</p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums text-ink">{count}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-blossom-200/80 bg-white p-5 shadow-sm shadow-blossom-500/5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold tracking-tight text-ink">Recent activity</h2>
            <Link to="/teacher/announcements" className="text-xs font-medium text-brand-700 hover:text-brand-700">
              Announcements
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="py-6 text-sm text-muted">No recent activity yet.</p>
          ) : (
            <ul className="space-y-3">
              {recent.map((item) => (
                <li key={item.id} className="rounded-xl bg-brand-50/70 px-3 py-2">
                  <p className="text-sm font-medium text-ink">{item.text}</p>
                  <p className="mt-0.5 text-xs text-muted">{item.meta}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
