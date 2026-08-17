import { announcementsApi } from '@/api'
import { useAsync } from '@/hooks/useAsync'
import { Alert, Badge, Loading, PageHeader } from '@/components/ui'

function formatWhen(value) {
  if (!value) return ''
  try {
    return new Date(value).toLocaleString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return value
  }
}

export function ParentAnnouncementsPage() {
  const { data, loading, error } = useAsync(() => announcementsApi.inbox(), [])
  const items = Array.isArray(data) ? data : (data?.content ?? [])

  return (
    <div>
      <PageHeader title="Announcements" subtitle="Messages from the school" />
      {error && <Alert>{error}</Alert>}
      {loading ? <Loading /> : items.length === 0 ? (
        <p className="text-sm text-muted">No announcements right now.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="rounded-2xl border border-blossom-200/80 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="font-semibold text-ink">{item.title}</h3>
                {item.isImportant && <Badge tone="warning">Important</Badge>}
              </div>
              {item.content && (
                <p className="mt-2 whitespace-pre-wrap text-sm text-muted">{item.content}</p>
              )}
              <p className="mt-3 text-xs text-muted">
                {item.className || item.audience || 'School'} · {formatWhen(item.createdAt || item.publishedAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
