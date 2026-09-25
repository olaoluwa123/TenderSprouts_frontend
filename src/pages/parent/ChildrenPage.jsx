import { Link } from 'react-router-dom'
import { parentsApi } from '@/api'
import { useAsync } from '@/hooks/useAsync'
import { displayAge, formatSex } from '@/lib/studentProfile'
import { Card, Loading, PageHeader } from '@/components/ui'

export function ChildrenPage() {
  const { data, loading } = useAsync(() => parentsApi.me(), [])

  return (
    <div>
      <PageHeader title="My children" subtitle="Open a profile to see all pupil details" />
      {loading ? <Loading /> : (data?.children ?? []).length === 0 ? (
        <p className="text-sm text-muted">No children linked yet. Ask the school office to link your account.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.children.map((child) => (
            <Card key={child.id}>
              <h3 className="font-semibold text-ink">
                {child.firstName} {child.lastName}
              </h3>
              <p className="mt-1 text-sm text-muted">Admission: {child.admissionNumber}</p>
              <p className="text-sm text-muted">Class: {child.className || child.classId || '—'}</p>
              <p className="text-sm text-muted">Age: {displayAge(child) || '—'}</p>
              <p className="text-sm text-muted">Sex: {formatSex(child.gender) || '—'}</p>
              <p className="text-sm text-muted">Height: {child.height || '—'}</p>
              <p className="text-sm text-muted">Weight: {child.weight || '—'}</p>
              <div className="mt-4 flex flex-wrap gap-3 text-sm font-medium">
                <Link to={`/parent/children/${child.id}`} className="text-brand-700 hover:text-brand-700">
                  View profile
                </Link>
                <Link to="/parent/attendance" className="text-brand-700 hover:text-brand-700">Attendance</Link>
                <Link to="/parent/results" className="text-brand-700 hover:text-brand-700">Report card</Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
