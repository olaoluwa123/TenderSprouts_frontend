import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { dashboardApi } from '@/api'
import { activityNarrative, activityNote, activityUserName, formatActivityDate } from '@/lib/activityLog'
import { roleLabel } from '@/lib/roles'
import { Alert, Button, Loading, Modal, PageHeader, Table, Td, Th } from '@/components/ui'
import { useAsync } from '@/hooks/useAsync'

export function ActivityLogPage() {
  const { data, loading, error, reload } = useAsync(() => dashboardApi.activity(100), [])
  const items = data ?? []
  const [selected, setSelected] = useState(null)
  const narrative = selected ? activityNarrative(selected) : null

  return (
    <div>
      <PageHeader
        title="Activity log"
        subtitle="Admin and teacher actions across the portal"
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
        <Loading label="Loading activity…" />
      ) : items.length === 0 ? (
        <p className="text-sm text-muted">No recent activity.</p>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Date</Th>
              <Th>User</Th>
              <Th>Role</Th>
              <Th>Note</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-border">
                <Td className="whitespace-nowrap text-muted">{formatActivityDate(item.createdAt)}</Td>
                <Td className="font-medium">{activityUserName(item)}</Td>
                <Td>{roleLabel(item.userRole)}</Td>
                <Td className="max-w-xl">{activityNote(item)}</Td>
                <Td className="whitespace-nowrap text-right">
                  <button
                    type="button"
                    className="cursor-pointer text-sm font-medium text-brand-700 hover:text-brand-800"
                    onClick={() => setSelected(item)}
                  >
                    View more
                  </button>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={narrative?.title || 'Activity'}
      >
        {narrative && (
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-ink">{narrative.sentence}</p>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted">When</dt>
                <dd className="mt-0.5 text-ink">{narrative.when}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted">User</dt>
                <dd className="mt-0.5 text-ink">{narrative.name} · {narrative.role}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted">What happened</dt>
                <dd className="mt-0.5 text-ink">{narrative.note}</dd>
              </div>
            </dl>
          </div>
        )}
      </Modal>
    </div>
  )
}
