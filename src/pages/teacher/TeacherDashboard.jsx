import { Link } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  BookOpen,
  Calendar,
  ClipboardList,
  GraduationCap,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { dashboardApi } from '@/api'
import {
  ChartCard,
  DashboardSkeleton,
  KpiCard,
  ProgressBar,
  StatusPill,
} from '@/components/dashboard'
import { Alert, Button, PageHeader, Table, Td, Th } from '@/components/ui'
import { useAsync } from '@/hooks/useAsync'

const GRADE_COLORS = {
  A: '#10b981',
  B: '#0ea5e9',
  C: '#4f46e5',
  D: '#f59e0b',
  E: '#f97316',
  F: '#ef4444',
}

export function TeacherDashboard() {
  const { data, loading, error, reload } = useAsync(() => dashboardApi.teacher(), [])

  if (loading) return <DashboardSkeleton />
  if (error) {
    return (
      <div>
        <PageHeader title="Teaching Dashboard" />
        <Alert>{error}</Alert>
        <Button className="mt-3" variant="secondary" onClick={reload}>Retry</Button>
      </div>
    )
  }

  const progress = data?.gradingProgress ?? {}
  const distribution = data?.gradeDistribution ?? []
  const top = data?.topPerformers ?? []
  const bottom = data?.bottomPerformers ?? []
  const exams = data?.upcomingExams ?? []
  const hasClass = data?.classId != null

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teaching Dashboard"
        subtitle={hasClass
          ? `${data.className} · ${data.sessionName} · ${data.termName}`
          : `${data?.sessionName ?? '—'} · ${data?.termName ?? '—'}`}
        actions={(
          <div className="flex flex-wrap gap-2">
            <Link to="/teacher/grades">
              <Button variant="secondary">Enter grades</Button>
            </Link>
            <Link to="/teacher/term-results">
              <Button>Term results</Button>
            </Link>
          </div>
        )}
      />

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-white px-4 py-3 text-sm shadow-sm">
        <span className="inline-flex items-center gap-2 font-medium text-slate-800">
          <GraduationCap size={16} className="text-primary-600" />
          {hasClass ? data.className : 'No class assigned'}
        </span>
        <span className="text-border">|</span>
        <span className="text-muted">{data?.studentCount ?? 0} students</span>
        <span className="text-border">|</span>
        <span className="text-muted">Term: {data?.termName ?? '—'}</span>
        <span className="text-border">|</span>
        <StatusPill status={data?.submissionStatus} />
      </div>

      {!hasClass && (
        <Alert tone="info">{progress.nextAction || 'Ask an admin to assign you to a class'}</Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Students"
          value={data?.studentCount ?? 0}
          hint="Active enrolments in your class"
          icon={<GraduationCap size={18} />}
        />
        <KpiCard
          label="Subjects"
          value={progress.subjectCount ?? 0}
          hint="Assigned to this class"
          icon={<BookOpen size={18} />}
          tone="info"
        />
        <KpiCard
          label="Class average"
          value={data?.classAverage != null ? Number(data.classAverage).toFixed(1) : '—'}
          hint="From computed term results"
          icon={<TrendingUp size={18} />}
          tone="success"
        />
        <KpiCard
          label="Submission"
          value={formatStatus(data?.submissionStatus)}
          hint={progress.nextAction}
          icon={<ClipboardList size={18} />}
          tone="warning"
        />
      </div>

      {hasClass && (
        <>
          <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-slate-900">Grading progress</h3>
            <ProgressBar
              label={`${progress.studentsWithGrades ?? 0} of ${progress.enrolledStudents ?? 0} students have scores`}
              value={progress.studentsWithGrades ?? 0}
              max={progress.enrolledStudents || 1}
              hint={progress.nextAction}
            />
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to="/teacher/grades">
                <Button size="sm" variant="secondary">Continue grading</Button>
              </Link>
              <Link to="/teacher/term-results">
                <Button size="sm">Compute / submit</Button>
              </Link>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <ChartCard
              title="Grade distribution"
              subtitle="Based on computed class averages"
              empty={distribution.every((b) => !b.count)}
              emptyMessage="Compute term results to see the distribution"
            >
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={distribution} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="letter" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {distribution.map((bucket) => (
                        <Cell key={bucket.letter} fill={GRADE_COLORS[bucket.letter] || '#4f46e5'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard title="Performance snapshot" subtitle="Top and bottom performers this term">
              <div className="grid gap-4 sm:grid-cols-2">
                <PerformerList
                  title="Top performers"
                  icon={<TrendingUp size={14} className="text-emerald-600" />}
                  items={top}
                  empty="No computed results yet"
                />
                <PerformerList
                  title="Needs attention"
                  icon={<TrendingDown size={14} className="text-amber-600" />}
                  items={bottom}
                  empty="No computed results yet"
                />
              </div>
            </ChartCard>
          </div>

          <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-primary-600" />
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Upcoming exams</h3>
                  <p className="text-xs text-muted">From the class exam timetable</p>
                </div>
              </div>
              <Link to="/teacher/exam-timetable">
                <Button size="sm" variant="secondary">Manage timetable</Button>
              </Link>
            </div>
            {exams.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-slate-50 px-4 py-8 text-center text-sm text-muted">
                No upcoming exams scheduled
              </div>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Subject</Th>
                    <Th>Date</Th>
                    <Th>Time</Th>
                    <Th>Room</Th>
                  </tr>
                </thead>
                <tbody>
                  {exams.map((exam) => (
                    <tr key={exam.id} className="border-t border-border">
                      <Td>{exam.subjectName}</Td>
                      <Td>{exam.examDate}</Td>
                      <Td>{exam.startTime} – {exam.endTime}</Td>
                      <Td>{exam.room || '—'}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function formatStatus(status) {
  const labels = {
    DRAFT: 'Draft',
    NOT_STARTED: 'Not started',
    SUBMITTED: 'Submitted',
    PUBLISHED: 'Published',
  }
  return labels[status] || status || '—'
}

function PerformerList({ title, icon, items, empty }) {
  return (
    <div>
      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
        {icon}
        {title}
      </p>
      {items.length === 0 ? (
        <p className="text-sm text-muted">{empty}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.studentId} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900">{item.studentName}</p>
                <p className="text-xs text-muted">{item.admissionNumber}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold tabular-nums">{item.averageScore ?? '—'}</p>
                <p className="text-xs text-muted">{item.letterGrade || '—'}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
