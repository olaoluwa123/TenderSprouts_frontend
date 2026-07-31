export function ActivityFeed({ items = [] }) {
  if (!items.length) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-slate-50 px-4 py-8 text-center text-sm text-muted">
        No recent activity
      </div>
    )
  }

  return (
    <ul className="divide-y divide-border">
      {items.map((item) => (
        <li key={item.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
          <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary-500" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-900">
              {item.action}
              {item.entityType ? (
                <span className="font-normal text-muted"> · {item.entityType}</span>
              ) : null}
            </p>
            {item.details && (
              <p className="mt-0.5 truncate text-xs text-muted">{item.details}</p>
            )}
            <p className="mt-1 text-xs text-muted">
              {item.userRole || 'SYSTEM'}
              {item.createdAt ? ` · ${formatWhen(item.createdAt)}` : ''}
            </p>
          </div>
        </li>
      ))}
    </ul>
  )
}

function formatWhen(value) {
  try {
    return new Date(value).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return value
  }
}
