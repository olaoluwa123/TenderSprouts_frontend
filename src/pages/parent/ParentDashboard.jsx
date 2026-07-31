import { Link } from 'react-router-dom'
import { parentsApi } from '@/api'
import { useAsync } from '@/hooks/useAsync'
import { Card, Loading, PageHeader, StatCard } from '@/components/ui'

export function ParentDashboard() {
  const { data, loading } = useAsync(() => parentsApi.dashboard(), [])

  if (loading) return <Loading />

  return (
    <div>
      <PageHeader title="Parent Dashboard" subtitle="Overview of your children's progress" />
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <StatCard label="Children" value={data?.children.length ?? 0} />
        <StatCard label="Session" value={data?.sessionId ?? '—'} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {data?.children.map((child) => (
          <Card key={child.studentId}>
            <h3 className="font-semibold text-lg">{child.studentName}</h3>
            <p className="text-sm text-muted">{child.admissionNumber}</p>
            {child.latestGrades.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Latest grades</p>
                <div className="space-y-1">
                  {child.latestGrades.slice(0, 3).map((g) => (
                    <div key={g.id} className="flex justify-between text-sm">
                      <span>{g.subjectName} ({g.assessmentType})</span>
                      <span>{g.score}/{g.maxScore}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-4 flex gap-2">
              <Link to="/parent/grades" className="text-sm text-primary-600 hover:underline">Grades</Link>
              <Link to="/parent/results" className="text-sm text-primary-600 hover:underline">Approved results</Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
