import { Link } from 'react-router-dom'
import { parentsApi } from '@/api'
import { useAsync } from '@/hooks/useAsync'
import { Card, Loading, PageHeader } from '@/components/ui'

export function ChildrenPage() {
  const { data, loading } = useAsync(() => parentsApi.me(), [])

  return (
    <div>
      <PageHeader title="My children" subtitle="All pupils linked to your account" />
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
              <div className="mt-4 flex flex-wrap gap-3 text-sm font-medium">
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
