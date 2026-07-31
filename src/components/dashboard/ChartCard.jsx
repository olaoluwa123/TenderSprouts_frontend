export function ChartCard({ title, subtitle, actions, children, empty, emptyMessage = 'No data available yet' }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
        </div>
        {actions}
      </div>
      {empty ? (
        <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-border bg-slate-50 text-sm text-muted">
          {emptyMessage}
        </div>
      ) : children}
    </div>
  )
}
