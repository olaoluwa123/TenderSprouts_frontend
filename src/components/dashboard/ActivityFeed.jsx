import { activityNote, activityUserName, formatActivityDate } from '@/lib/activityLog'

export function ActivityFeed({ items = [] }) {
  if (!items.length) {
    return (
      <div className="rounded-xl border border-dashed border-blossom-200 bg-cream/50 px-4 py-8 text-center text-sm text-muted">
        No recent activity
      </div>
    )
  }

  return (
    <ul className="divide-y divide-blossom-100">
      {items.map((item) => (
        <li key={item.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
          <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-ink">{activityNote(item)}</p>
            <p className="mt-1 text-xs text-muted">
              {activityUserName(item)}
              {item.createdAt ? ` · ${formatActivityDate(item.createdAt)}` : ''}
            </p>
          </div>
        </li>
      ))}
    </ul>
  )
}
