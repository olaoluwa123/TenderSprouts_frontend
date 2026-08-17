import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { dashboardApi } from '@/api'
import { ActivityFeed } from '@/components/dashboard'
import { Alert, Button, PageHeader } from '@/components/ui'
import { useAsync } from '@/hooks/useAsync'

export function ActivityLogPage() {
  const { data, loading, error, reload } = useAsync(() => dashboardApi.activity(100), [])
  const items = data ?? []

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Activity log"
        subtitle="Recent admin actions across the portal"
        actions={(
          <Link to="/admin">
            <Button variant="secondary" size="sm">
              <ArrowLeft size={14} />
              Back to dashboard
            </Button>
          </Link>
        )}
      />

      {error && (
        <div className="mb-4">
          <Alert>{error}</Alert>
          <Button className="mt-3" variant="secondary" onClick={reload}>Retry</Button>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted">Loading activity…</p>
      ) : (
        <div className="rounded-2xl border border-blossom-200/80 bg-white p-5 shadow-sm shadow-blossom-500/5">
          <ActivityFeed items={items} />
        </div>
      )}
    </div>
  )
}
