import clsx from 'clsx'

export function KpiCard({ label, value, hint, icon, tone = 'default' }) {
  const tones = {
    default: 'bg-brand-50 text-brand-700',
    success: 'bg-brand-100 text-brand-800',
    warning: 'bg-sun/20 text-ink',
    danger: 'bg-blossom-100 text-blossom-700',
    info: 'bg-leaf/15 text-leaf',
  }

  return (
    <div className="rounded-2xl border border-blossom-200/80 bg-card p-5 shadow-sm shadow-blossom-500/5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-ink">{value ?? '—'}</p>
          {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
        </div>
        {icon && (
          <div className={clsx('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', tones[tone] ?? tones.default)}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
