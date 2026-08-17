import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/ui'

export function ParentAssignmentsPage() {
  return (
    <div>
      <PageHeader
        title="Assignments"
        subtitle="Homework and class assignments for your children"
      />
      <div className="rounded-2xl border border-blossom-200/80 bg-white p-6 shadow-sm">
        <p className="text-sm text-muted">
          Assignments will appear here once teachers start publishing homework for your child&apos;s class.
        </p>
        <p className="mt-3 text-sm text-muted">
          In the meantime you can monitor grades and report cards.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link to="/parent/grades" className="text-sm font-medium text-brand-700 hover:text-brand-700">
            Grades
          </Link>
          <Link to="/parent/results" className="text-sm font-medium text-brand-700 hover:text-brand-700">
            Report cards
          </Link>
        </div>
      </div>
    </div>
  )
}
