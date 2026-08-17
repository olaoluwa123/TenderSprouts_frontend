import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import {
  BookOpen,
  CalendarDays,
  ClipboardList,
  GraduationCap,
  Megaphone,
  School,
  Users,
} from 'lucide-react'
import { calendarApi, dashboardApi } from '@/api'
import { ActivityFeed, DashboardSkeleton } from '@/components/dashboard'
import { Alert, Button, PageHeader } from '@/components/ui'
import { useAsync } from '@/hooks/useAsync'

function SummaryCard({ label, value, icon, to, tone = 'brand' }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-700',
    blossom: 'bg-blossom-50 text-blossom-700',
    sun: 'bg-sun/15 text-ink',
    leaf: 'bg-leaf/10 text-leaf',
  }
  const body = (
    <div className="rounded-2xl border border-blossom-200/80 bg-white p-5 shadow-sm shadow-blossom-500/5 transition hover:border-brand-200">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">{label}</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-ink">{value ?? 0}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tones[tone] ?? tones.brand}`}>
          {icon}
        </div>
      </div>
    </div>
  )
  return to ? <Link to={to}>{body}</Link> : body
}

function Panel({ title, children, action }) {
  return (
    <section className="rounded-2xl border border-blossom-200/80 bg-white p-5 shadow-sm shadow-blossom-500/5">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold tracking-tight text-ink">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

function EmptyLine({ children }) {
  return <p className="py-6 text-sm text-muted">{children}</p>
}

function formatDate(value) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return value
  }
}

function formatDateTime(value) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString(undefined, {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return value
  }
}

function monthBounds(anchor = new Date()) {
  const y = anchor.getFullYear()
  const m = anchor.getMonth()
  const from = new Date(y, m, 1)
  const to = new Date(y, m + 1, 0)
  const pad = (n) => String(n).padStart(2, '0')
  return {
    from: `${from.getFullYear()}-${pad(from.getMonth() + 1)}-${pad(from.getDate())}`,
    to: `${to.getFullYear()}-${pad(to.getMonth() + 1)}-${pad(to.getDate())}`,
    label: from.toLocaleString(undefined, { month: 'long', year: 'numeric' }),
  }
}

export function AdminDashboard() {
  const bounds = useMemo(() => monthBounds(), [])
  const { data, loading, error, reload } = useAsync(() => dashboardApi.admin(), [])
  const { data: monthEvents } = useAsync(
    () => calendarApi.list({ from: bounds.from, to: bounds.to }),
    [bounds.from, bounds.to],
  )

  if (loading) return <DashboardSkeleton />
  if (error) {
    return (
      <div>
        <PageHeader title="Dashboard Overview" subtitle="School summary" />
        <Alert>{error}</Alert>
        <Button className="mt-3" variant="secondary" onClick={reload}>Retry</Button>
      </div>
    )
  }

  const kpis = data?.kpis ?? {}
  const admissions = data?.newAdmissions ?? []
  const recentPupils = data?.recentPupils ?? []
  const events = data?.upcomingEvents ?? []
  const announcements = data?.announcements ?? []
  const attendance = data?.attendanceSummary ?? {}
  const activity = (data?.recentActivity ?? []).slice(0, 5)
  const marked = attendance.marked ?? 0
  const presentPct = marked > 0 ? Math.round(((attendance.present ?? 0) / marked) * 100) : 0
  const calendarEvents = monthEvents ?? []

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader
        title="Dashboard Overview"
        subtitle={`${data?.sessionName ?? '—'} · ${data?.termName ?? '—'}`}
        actions={(
          <Link to="/admin/students">
            <Button size="sm">Manage pupils</Button>
          </Link>
        )}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          label="Total Pupils"
          value={kpis.activeStudents}
          icon={<GraduationCap size={18} />}
          to="/admin/students"
        />
        <SummaryCard
          label="Teachers"
          value={kpis.activeTeachers}
          icon={<Users size={18} />}
          to="/admin/teachers"
          tone="leaf"
        />
        <SummaryCard
          label="Classes"
          value={kpis.classes}
          icon={<School size={18} />}
          to="/admin/classes"
        />
        <SummaryCard
          label="Subjects"
          value={kpis.subjects}
          icon={<BookOpen size={18} />}
          to="/admin/subjects"
          tone="brand"
        />
        <SummaryCard
          label="Parents"
          value={kpis.activeParents}
          icon={<Users size={18} />}
          to="/admin/parents"
          tone="blossom"
        />
        <SummaryCard
          label="Admission Enquiries"
          value={kpis.pendingApplications}
          icon={<ClipboardList size={18} />}
          to="/admin/admission-enquiries"
          tone="sun"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel
          title="Admission enquiries"
          action={(
            <Link to="/admin/admission-enquiries" className="text-xs font-medium text-brand-700 hover:text-brand-700">
              View all
            </Link>
          )}
        >
          {admissions.length === 0 ? (
            <EmptyLine>No pending admission enquiries.</EmptyLine>
          ) : (
            <ul className="divide-y divide-blossom-100">
              {admissions.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{item.applicantName}</p>
                    <p className="mt-0.5 truncate text-xs text-muted">
                      {item.parentName || 'Parent pending'}
                      {item.prospectiveClassName ? ` · ${item.prospectiveClassName}` : ''}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted">{formatDate(item.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Recently registered pupils"
          action={(
            <Link to="/admin/students" className="text-xs font-medium text-brand-700 hover:text-brand-700">
              View all
            </Link>
          )}
        >
          {recentPupils.length === 0 ? (
            <EmptyLine>No recent registrations.</EmptyLine>
          ) : (
            <ul className="divide-y divide-blossom-100">
              {recentPupils.map((pupil) => (
                <li key={pupil.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{pupil.fullName}</p>
                    <p className="mt-0.5 truncate text-xs text-muted">
                      {pupil.admissionNumber || '—'}
                      {pupil.className ? ` · ${pupil.className}` : ''}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted">{formatDate(pupil.registeredAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title={`Calendar · ${bounds.label}`}
          action={(
            <Link to="/admin/calendar" className="text-xs font-medium text-brand-700 hover:text-brand-700">
              Open calendar
            </Link>
          )}
        >
          {calendarEvents.length === 0 ? (
            <EmptyLine>No events scheduled this month.</EmptyLine>
          ) : (
            <ul className="space-y-3">
              {calendarEvents.slice(0, 6).map((event) => (
                <li key={event.id} className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                    <CalendarDays size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{event.title}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {formatDate(event.startDate)}
                      {event.endDate && event.endDate !== event.startDate ? ` – ${formatDate(event.endDate)}` : ''}
                      {' · '}
                      {event.eventType?.toLowerCase()}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Upcoming events"
          action={(
            <Link to="/admin/calendar" className="text-xs font-medium text-brand-700 hover:text-brand-700">
              View calendar
            </Link>
          )}
        >
          {events.length === 0 ? (
            <EmptyLine>No upcoming events on the calendar.</EmptyLine>
          ) : (
            <ul className="space-y-3">
              {events.map((event) => (
                <li key={event.id} className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                    <CalendarDays size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{event.title}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {formatDate(event.startDate)}
                      {event.endDate && event.endDate !== event.startDate ? ` – ${formatDate(event.endDate)}` : ''}
                      {' · '}
                      {event.eventType?.toLowerCase()}
                      {event.className ? ` · ${event.className}` : ''}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Important announcements"
          action={(
            <Link to="/admin/announcements" className="text-xs font-medium text-brand-700 hover:text-brand-700">
              Manage
            </Link>
          )}
        >
          {announcements.length === 0 ? (
            <EmptyLine>No announcements yet.</EmptyLine>
          ) : (
            <ul className="space-y-4">
              {announcements.map((item) => (
                <li key={item.id} className="rounded-xl bg-brand-50/70 px-4 py-3">
                  <div className="flex items-start gap-2">
                    <Megaphone size={14} className="mt-0.5 shrink-0 text-brand-600" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink">{item.title}</p>
                      {item.content && (
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">{item.content}</p>
                      )}
                      <p className="mt-2 text-[11px] text-muted">
                        {item.className || 'Whole school'} · {formatDateTime(item.createdAt)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Attendance summary"
          action={(
            <Link to="/admin/attendance" className="text-xs font-medium text-brand-700 hover:text-brand-700">
              Open attendance
            </Link>
          )}
        >
          {!marked ? (
            <EmptyLine>No attendance marked yet for the latest school day.</EmptyLine>
          ) : (
            <div className="space-y-4">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs text-muted">Latest day · {formatDate(attendance.date)}</p>
                  <p className="mt-1 text-3xl font-semibold tabular-nums text-ink">{presentPct}%</p>
                  <p className="text-xs text-muted">present of {marked} marked</p>
                </div>
                <p className="text-xs text-muted">{attendance.enrolled ?? 0} enrolled</p>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-brand-100">
                <div className="h-full rounded-full bg-brand-600" style={{ width: `${presentPct}%` }} />
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                {[
                  ['Present', attendance.present],
                  ['Absent', attendance.absent],
                  ['Late', attendance.late],
                  ['Excused', attendance.excused],
                ].map(([label, count]) => (
                  <div key={label} className="rounded-xl bg-brand-50/70 px-3 py-2">
                    <p className="text-[11px] uppercase tracking-wide text-muted">{label}</p>
                    <p className="mt-1 font-semibold tabular-nums text-ink">{count ?? 0}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Panel>

        <Panel
          title="Recent activities"
          action={(
            <Link to="/admin/activity" className="text-xs font-medium text-brand-700 hover:text-brand-700">
              View all
            </Link>
          )}
        >
          <ActivityFeed items={activity} />
        </Panel>
      </div>
    </div>
  )
}
