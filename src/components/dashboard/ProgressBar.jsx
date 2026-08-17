import clsx from 'clsx'

export function ProgressBar({ label, value, max = 100, hint }) {
  const pct = max <= 0 ? 0 : Math.min(100, Math.round((value / max) * 100))
  const tone = pct >= 80 ? 'bg-brand-600' : pct >= 40 ? 'bg-leaf' : 'bg-sun'

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-ink">{label}</span>
        <span className="tabular-nums text-muted">{pct}%</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-blossom-100">
        <div className={clsx('h-full rounded-full transition-all', tone)} style={{ width: `${pct}%` }} />
      </div>
      {hint && <p className="mt-2 text-xs text-muted">{hint}</p>}
    </div>
  )
}
