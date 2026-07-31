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
  AlertTriangle,
  BookOpen,
  Calendar,
  ClipboardCheck,
  GraduationCap,
  School,
  Users,
} from 'lucide-react'
import { dashboardApi } from '@/api'
import {
  ActivityFeed,
  ChartCard,
  DashboardSkeleton,
  KpiCard,
  StatusPill,
} from '@/components/dashboard'
import { Alert, Button, PageHeader, Table, Td, Th } from '@/components/ui'
import { useAsync } from '@/hooks/useAsync'

const CHART_COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
const GRADE_COLORS = {
  A: '#10b981',
  B: '#0ea5e9',
  C: '#4f46e5',
  D: '#f59e0b',
  E: '#f97316',
  F: '#ef4444',
}

export function AdminDashboard() {
  const { data, loading, error, reload } = useAsync(() => dashboardApi.admin(), [])

  if (loading) return <DashboardSkeleton />
  if (error) {
    return (
      <div>
        <PageHeader title="Operations Dashboard" subtitle="School-wide overview" />
        <Alert>{error}</Alert>
        <Button className="mt-3" variant="secondary" onClick={reload}>Retry</Button>
      </div>
    )
  }

  const kpis = data?.kpis ?? {}
  const funnel = data?.submissionFunnel ?? {}
  const classPerformance = data?.classPerformance ?? []
  const gradeDistribution = data?.gradeDistribution ?? []
  const pending = data?.pendingApprovals ?? []
  const activity = data?.recentActivity ?? []
  const funnelChart = [
    { name: 'Draft / pending', count: funnel.draft ?? 0 },
    { name: 'Submitted', count: funnel.submitted ?? 0 },
    { name: 'Published', count: funnel.published ?? 0 },
  ]
  const needsApproval = (funnel.submitted ?? 0) > 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operations Dashboard"
        subtitle={`${data?.sessionName ?? '—'} · ${data?.termName ?? '—'}`}
        actions={(
          <div className="flex flex-wrap gap-2">
            <Link to="/admin/term-results">
              <Button variant="secondary">Review results</Button>
            </Link>
            <Link to="/admin/students">
              <Button variant="secondary">Students</Button>
            </Link>
            <Link to="/admin/sessions">
              <Button>Sessions & terms</Button>
            </Link>
          </div>
        )}
      />

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-white px-4 py-3 text-sm shadow-sm">
        <span className="inline-flex items-center gap-2 font-medium text-slate-800">
          <Calendar size={16} className="text-primary-600" />
          Active session: {data?.sessionName ?? '—'}
        </span>
        <span className="text-border">|</span>
        <span className="text-muted">Active term: {data?.termName ?? '—'}</span>
        {needsApproval && (
          <>
            <span className="text-border">|</span>
            <Link to="/admin/term-results" className="inline-flex items-center gap-1.5 font-medium text-amber-700 hover:underline">
              <AlertTriangle size={14} />
              {funnel.submitted} submission{funnel.submitted === 1 ? '' : 's'} awaiting approval
            </Link>
          </>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Active students"
          value={kpis.activeStudents ?? 0}
          hint="Enrolled in active session"
          icon={<GraduationCap size={18} />}
        />
        <KpiCard
          label="Teachers"
          value={kpis.activeTeachers ?? 0}
          hint="Active portal accounts"
          icon={<Users size={18} />}
          tone="info"
        />
        <KpiCard
          label="Parents"
          value={kpis.activeParents ?? 0}
          hint="Active portal accounts"
          icon={<Users size={18} />}
          tone="success"
        />
        <KpiCard
          label="Classes"
          value={kpis.classes ?? 0}
          hint="Configured school classes"
          icon={<School size={18} />}
          tone="warning"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard
          title="Result workflow"
          subtitle={`Across ${funnel.totalClasses ?? 0} classes this term`}
          empty={(funnel.totalClasses ?? 0) === 0}
        >
          <div className="mb-4 grid grid-cols-3 gap-3 text-center text-sm">
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-muted">Draft / pending</p>
              <p className="mt-1 text-xl font-bold">{funnel.draft ?? 0}</p>
            </div>
            <div className="rounded-lg bg-amber-50 p-3">
              <p className="text-xs text-amber-700">Submitted</p>
              <p className="mt-1 text-xl font-bold text-amber-800">{funnel.submitted ?? 0}</p>
            </div>
            <div className="rounded-lg bg-emerald-50 p-3">
              <p className="text-xs text-emerald-700">Published</p>
              <p className="mt-1 text-xl font-bold text-emerald-800">{funnel.published ?? 0}</p>
            </div>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {funnelChart.map((entry, index) => (
                    <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="Grade distribution"
          subtitle="Letter grades from computed term averages"
          empty={gradeDistribution.every((b) => !b.count)}
          emptyMessage="No term results computed yet"
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gradeDistribution} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="letter" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {gradeDistribution.map((bucket) => (
                    <Cell key={bucket.letter} fill={GRADE_COLORS[bucket.letter] || '#4f46e5'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <ChartCard
        title="Class performance"
        subtitle="Average scores by class for the active term"
        empty={classPerformance.length === 0}
        emptyMessage="Compute term results to see class averages"
      >
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={classPerformance} margin={{ top: 8, right: 8, left: 0, bottom: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="className" tick={{ fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={50} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => [Number(value).toFixed(2), 'Average']} />
              <Bar dataKey="averageScore" fill="#4f46e5" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <div className="grid gap-4 xl:grid-cols-5">
        <div className="xl:col-span-3 rounded-xl border border-border bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Pending approvals</h3>
              <p className="text-xs text-muted">Submitted term results waiting for publish</p>
            </div>
            <Link to="/admin/term-results">
              <Button size="sm" variant="secondary">
                <ClipboardCheck size={14} /> Open inbox
              </Button>
            </Link>
          </div>
          {pending.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-slate-50 px-4 py-10 text-center text-sm text-muted">
              No submissions awaiting approval
            </div>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Class</Th>
                  <Th>Term</Th>
                  <Th>Teacher</Th>
                  <Th>Results</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {pending.map((item) => (
                  <tr key={item.submissionId} className="border-t border-border">
                    <Td>{item.className}</Td>
                    <Td>{item.termName}</Td>
                    <Td>{item.submittedByTeacherName || '—'}</Td>
                    <Td>{item.resultCount}</Td>
                    <Td><StatusPill status="SUBMITTED" /></Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </div>

        <div className="xl:col-span-2 rounded-xl border border-border bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <BookOpen size={16} className="text-primary-600" />
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Recent activity</h3>
              <p className="text-xs text-muted">Latest admin audit events</p>
            </div>
          </div>
          <ActivityFeed items={activity} />
        </div>
      </div>
    </div>
  )
}
