import { Link } from 'react-router-dom'
import { PageHeader, Button } from '@/components/ui'

export function TeacherAssignmentsPage() {
  return (
    <div>
      <PageHeader
        title="Assignments"
        subtitle="Homework and class assignments"
        actions={(
          <Link to="/teacher">
            <Button variant="secondary" size="sm">Dashboard</Button>
          </Link>
        )}
      />
      <div className="rounded-2xl border border-dashed border-blossom-200 bg-brand-50/40 px-6 py-12 text-center">
        <p className="text-sm font-medium text-ink">Assignments are coming soon</p>
        <p className="mt-2 text-sm text-muted">
          You&apos;ll be able to create class work, set due dates, and track submissions here.
        </p>
      </div>
    </div>
  )
}
