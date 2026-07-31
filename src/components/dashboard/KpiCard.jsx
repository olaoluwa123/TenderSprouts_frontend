import clsx from 'clsx'

export function KpiCard({ label, value, hint, icon, tone = 'default' }) {
  const tones = {
    default: 'bg-primary-50 text-primary-700',
    success: 'bg-emerald-50 text-emerald-700',
    warning: 'bg-amber-50 text-amber-700',
    danger: 'bg-red-50 text-red-700',
    info: 'bg-sky-50 text-sky-700',
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value ?? '—'}</p>
          {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
        </div>
        {icon && (
          <div className={clsx('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', tones[tone] ?? tones.default)}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
