import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarDays,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Megaphone,
  Wallet,
} from 'lucide-react'
import { announcementsApi, attendanceApi, calendarApi, parentsApi, termResultsApi } from '@/api'
import { useAsync } from '@/hooks/useAsync'
import { useActiveSession, useTerms } from '@/hooks/useSchoolData'
import { Card, Loading, Select } from '@/components/ui'

function monthBounds(anchor = new Date()) {
  const y = anchor.getFullYear()
  const m = anchor.getMonth()
  const pad = (n) => String(n).padStart(2, '0')
  const last = new Date(y, m + 1, 0).getDate()
  return {
    from: `${y}-${pad(m + 1)}-01`,
    to: `${y}-${pad(m + 1)}-${pad(last)}`,
    label: anchor.toLocaleString(undefined, { month: 'long', year: 'numeric' }),
  }
}

function money(value) {
  const n = Number(value ?? 0)
  return n.toLocaleString(undefined, { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 })
}

function formatEventDate(value) {
  if (!value) return ''
  try {
    return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  } catch {
    return value
  }
}

function summarizeAttendance(rows) {
  let present = 0
  let absent = 0
  let late = 0
  let excused = 0
  for (const row of rows ?? []) {
    const status = String(row.status || '').toUpperCase()
    if (status === 'PRESENT') present += 1
    else if (status === 'ABSENT') absent += 1
    else if (status === 'LATE') late += 1
    else if (status === 'EXCUSED') excused += 1
  }
  const total = present + absent + late + excused
  return { present, absent, late, total, rate: total ? Math.round((present / total) * 100) : null }
}

function averageFromGrades(grades) {
  const bySubject = new Map()
  for (const g of grades ?? []) {
    const key = g.subjectId ?? g.subjectName ?? g.id
    if (!bySubject.has(key)) bySubject.set(key, { score: 0, max: 0 })
    const row = bySubject.get(key)
    row.score += Number(g.score ?? 0)
    const max = Number(g.maxScore ?? 0)
    row.max += max > 0 ? max : 0
  }
  const pcts = [...bySubject.values()]
    .filter((row) => row.max > 0)
    .map((row) => Math.round((row.score / row.max) * 100))
  if (!pcts.length) return { average: null, count: 0 }
  return {
    average: Math.round(pcts.reduce((sum, n) => sum + n, 0) / pcts.length),
    count: pcts.length,
  }
}

function StatTile({ icon: Icon, label, value, hint, to }) {
  const content = (
    <div className="h-full rounded-2xl border border-blossom-200/70 bg-white/85 p-4 backdrop-blur transition hover:border-brand-300 hover:shadow-sm">
      <div className="flex items-center gap-2 text-muted">
        <Icon size={15} />
        <span className="text-[11px] font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-2 font-display text-2xl font-semibold tabular-nums text-ink">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
    </div>
  )
  return to ? <Link to={to} className="block h-full">{content}</Link> : content
}

export function ParentDashboard() {
  const bounds = useMemo(() => monthBounds(), [])
  const { data, loading } = useAsync(() => parentsApi.dashboard(), [])
  const children = data?.children ?? []
  const [selectedId, setSelectedId] = useState('')

  useEffect(() => {
    if (!selectedId && children[0]?.studentId) setSelectedId(String(children[0].studentId))
  }, [children, selectedId])

  const child = children.find((c) => String(c.studentId) === String(selectedId)) || children[0]
  const studentId = child?.studentId

  const { data: session } = useActiveSession()
  const { data: terms } = useTerms(session?.id)
  const { data: attendanceRows, loading: attendanceLoading } = useAsync(
    () => (studentId
      ? attendanceApi.byPupil(studentId, bounds.from, bounds.to).catch(() => [])
      : Promise.resolve([])),
    [studentId, bounds.from, bounds.to],
  )
  const { data: results } = useAsync(
    () => (studentId
      ? termResultsApi.list({ studentId, size: 100 }).then((p) => p.content).catch(() => [])
      : Promise.resolve([])),
    [studentId],
  )
  const { data: inbox } = useAsync(() => announcementsApi.inbox().catch(() => []), [])
  const { data: events } = useAsync(
    () => calendarApi.list({ from: bounds.from, to: bounds.to }).catch(() => []),
    [bounds.from, bounds.to],
  )

  if (loading) return <Loading />

  const { average, count: subjectCount } = averageFromGrades(child?.latestGrades)
  const attendance = summarizeAttendance(Array.isArray(attendanceRows) ? attendanceRows : [])
  const outstanding = Number(child?.outstandingFees ?? 0)

  const latestResult = (Array.isArray(results) ? results : [])
    .filter((r) => r.publishedAt)
    .sort((a, b) => String(b.publishedAt).localeCompare(String(a.publishedAt)))[0]
  const latestTermName = latestResult
    ? (terms ?? []).find((t) => t.id === latestResult.termId)?.name || `Term #${latestResult.termId}`
    : null

  const announcements = Array.isArray(inbox) ? inbox : (inbox?.content ?? [])
  const todayIso = new Date().toISOString().slice(0, 10)
  const upcoming = (Array.isArray(events) ? events : [])
    .filter((ev) => String(ev.startDate || '') >= todayIso)
    .sort((a, b) => String(a.startDate || '').localeCompare(String(b.startDate || '')))
    .slice(0, 4)

  if (children.length === 0) {
    return (
      <Card>
        <p className="text-sm text-muted">No children linked to your account yet.</p>
        <Link to="/parent/children" className="mt-3 inline-block text-sm font-medium text-brand-700 hover:text-brand-700">
          My children
        </Link>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-blossom-200/70 bg-gradient-to-br from-brand-50 via-cream to-blossom-50 p-5 shadow-sm shadow-blossom-500/5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/80 font-display text-xl font-semibold text-brand-700 shadow-sm">
              {(child?.studentName || '?').trim().charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              {children.length > 1 ? (
                <Select
                  value={String(child?.studentId || '')}
                  onChange={(e) => setSelectedId(e.target.value)}
                  className="max-w-[15rem] font-display text-lg font-semibold"
                >
                  {children.map((c) => (
                    <option key={c.studentId} value={c.studentId}>{c.studentName}</option>
                  ))}
                </Select>
              ) : (
                <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">
                  {child?.studentName}
                </h2>
              )}
              <p className="mt-1 text-sm text-muted">
                {child?.className || 'Class not assigned'}
                {child?.admissionNumber ? ` · ${child.admissionNumber}` : ''}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/parent/results"
              className="rounded-full border border-brand-300 bg-white px-3.5 py-1.5 text-sm font-semibold text-brand-700 transition hover:bg-blossom-50"
            >
              Report card
            </Link>
            {outstanding > 0 && (
              <Link
                to="/parent/fees"
                className="rounded-full bg-brand-600 px-3.5 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
              >
                Pay fees
              </Link>
            )}
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatTile
            icon={ClipboardCheck}
            label="Attendance"
            value={attendance.rate == null ? '—' : `${attendance.rate}%`}
            hint={attendance.total ? `${attendance.present}/${attendance.total} days present` : bounds.label}
            to="/parent/attendance"
          />
          <StatTile
            icon={GraduationCap}
            label="Average score"
            value={average == null ? '—' : `${average}%`}
            hint={subjectCount ? `Across ${subjectCount} subjects` : 'Awaiting approved results'}
            to="/parent/results"
          />
          <StatTile
            icon={FileText}
            label="Last result"
            value={latestResult?.averageScore != null ? `${Math.round(Number(latestResult.averageScore))}%` : '—'}
            hint={latestResult
              ? `${latestTermName}${latestResult.rankInClass ? ` · Position ${latestResult.rankInClass}` : ''}`
              : 'No published report card yet'}
            to="/parent/results"
          />
          <StatTile
            icon={Wallet}
            label="Outstanding fees"
            value={money(outstanding)}
            hint={outstanding > 0 ? 'Payment pending' : 'All fees settled'}
            to="/parent/fees"
          />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <div className="mb-4 flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-ink">Attendance</h3>
              <p className="text-xs text-muted">{bounds.label}</p>
            </div>
            <Link to="/parent/attendance" className="text-xs font-medium text-brand-700 hover:text-brand-700">
              Details
            </Link>
          </div>
          {attendanceLoading ? <Loading /> : attendance.total === 0 ? (
            <p className="rounded-xl bg-brand-50/70 px-3 py-6 text-center text-sm text-muted">
              No attendance recorded this month.
            </p>
          ) : (
            <>
              <div className="mb-4 h-2 overflow-hidden rounded-full bg-brand-100">
                <div className="h-full rounded-full bg-brand-600" style={{ width: `${attendance.rate}%` }} />
              </div>
              <dl className="grid grid-cols-3 gap-2 text-center">
                {[
                  { label: 'Present', value: attendance.present },
                  { label: 'Absent', value: attendance.absent },
                  { label: 'Late', value: attendance.late },
                ].map((row) => (
                  <div key={row.label} className="rounded-xl bg-brand-50/80 px-2 py-3">
                    <dt className="text-[11px] text-muted">{row.label}</dt>
                    <dd className="mt-1 text-lg font-semibold tabular-nums text-ink">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </>
          )}
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Megaphone size={16} className="text-brand-600" />
              <h3 className="text-sm font-semibold text-ink">Announcements</h3>
            </div>
            <Link to="/parent/announcements" className="text-xs font-medium text-brand-700 hover:text-brand-700">
              View all
            </Link>
          </div>
          {announcements.length === 0 ? (
            <p className="rounded-xl bg-brand-50/70 px-3 py-6 text-center text-sm text-muted">
              No announcements right now.
            </p>
          ) : (
            <ul className="space-y-2">
              {announcements.slice(0, 4).map((item) => (
                <li key={item.id} className="rounded-xl border border-brand-100 bg-white px-3 py-2.5">
                  <p className="text-sm font-medium text-ink">{item.title}</p>
                  {item.content && (
                    <p className="mt-1 line-clamp-2 text-xs text-muted">{item.content}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CalendarDays size={16} className="text-brand-700" />
              <h3 className="text-sm font-semibold text-ink">Upcoming</h3>
            </div>
            <Link to="/parent/calendar" className="text-xs font-medium text-brand-700 hover:text-brand-700">
              Calendar
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="rounded-xl bg-brand-50/70 px-3 py-6 text-center text-sm text-muted">
              No upcoming school events.
            </p>
          ) : (
            <ul className="space-y-2">
              {upcoming.map((ev) => (
                <li key={ev.id} className="flex items-center gap-3 rounded-xl border border-brand-100 bg-white px-3 py-2.5">
                  <span className="flex h-9 w-14 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-xs font-semibold text-brand-700">
                    {formatEventDate(ev.startDate)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-ink">{ev.title}</span>
                    {ev.eventType && <span className="text-xs text-muted">{ev.eventType}</span>}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
