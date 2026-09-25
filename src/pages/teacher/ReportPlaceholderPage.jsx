import { Link, useLocation } from 'react-router-dom'
import { EmptyState, PageHeader } from '@/components/ui'

const TITLES = {
  '/teacher/reports/behavioural': 'Weekly and end of term behavioural report',
  '/teacher/reports/weekly-tests': 'Weekly test result',
  '/teacher/reports/preschool': 'Preschool report',
  '/teacher/reports/midterm': 'Midterm report',
}

export function ReportPlaceholderPage() {
  const { pathname } = useLocation()
  const title = TITLES[pathname] || 'Report'

  return (
    <div>
      <PageHeader
        title={title}
        subtitle="This report type is not available yet"
        actions={(
          <Link
            to="/teacher/reports"
            className="inline-flex items-center justify-center rounded-full border border-blossom-300 bg-white px-4 py-2 text-sm font-semibold text-blossom-700 transition hover:border-blossom-400 hover:bg-blossom-50"
          >
            Back to Reports
          </Link>
        )}
      />
      <EmptyState
        title="Coming soon"
        description={`${title} entry will be available here in a later update. Use End of term grades for now.`}
      />
      <div className="mt-4">
        <Link to="/teacher/reports" className="text-sm font-medium text-brand-700 hover:text-brand-800">
          ← Back to Reports
        </Link>
      </div>
    </div>
  )
}
