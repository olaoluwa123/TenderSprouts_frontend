import clsx from 'clsx'

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}) {
  return (
    <button
      className={clsx(
        'inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-4 py-2 text-sm',
        variant === 'primary' && 'bg-primary-600 text-white hover:bg-primary-700',
        variant === 'secondary' && 'border border-border bg-white text-slate-700 hover:bg-slate-50',
        variant === 'danger' && 'bg-red-600 text-white hover:bg-red-700',
        variant === 'ghost' && 'text-slate-600 hover:bg-slate-100',
        className,
      )}
      {...props}
    />
  )
}

export function Input({ className, ...props }) {
  return (
    <input
      className={clsx(
        'w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100',
        className,
      )}
      {...props}
    />
  )
}

export function Select({ className, children, ...props }) {
  return (
    <select
      className={clsx(
        'w-full cursor-pointer rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  )
}

export function Textarea({ className, ...props }) {
  return (
    <textarea
      className={clsx(
        'w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100',
        className,
      )}
      {...props}
    />
  )
}

export function Card({
  children,
  className,
  onClick,
}) {
  return (
    <div
      className={clsx('rounded-xl border border-border bg-card p-5 shadow-sm', onClick && 'cursor-pointer', className)}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  )
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function Badge({ children, tone = 'default' }) {
  const tones = {
    default: 'bg-slate-100 text-slate-700',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-red-100 text-red-700',
  }
  return <span className={clsx('inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium', tones[tone])}>{children}</span>
}

export function Loading({ label = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center py-16 text-sm text-muted">{label}</div>
  )
}

export function EmptyState({ title, description }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-white px-6 py-12 text-center">
      <h3 className="font-medium text-slate-900">{title}</h3>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
    </div>
  )
}

export function Alert({ children, tone = 'error' }) {
  const tones = {
    error: 'border-red-200 bg-red-50 text-red-800',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    info: 'border-blue-200 bg-blue-50 text-blue-800',
    warning: 'border-amber-200 bg-amber-50 text-amber-800',
  }
  return <div className={clsx('rounded-lg border px-4 py-3 text-sm', tones[tone] ?? tones.error)}>{children}</div>
}

export function Table({ children }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-white">
      <table className="min-w-full divide-y divide-border text-sm">{children}</table>
    </div>
  )
}

export function Th({ children }) {
  return <th className="bg-slate-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">{children}</th>
}

export function Td({ children, className }) {
  return <td className={clsx('px-4 py-3 text-slate-700', className)}>{children}</td>
}

export function Modal({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="cursor-pointer text-muted hover:text-slate-900">✕</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

export function Field({ label, children }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  )
}

export function StatCard({ label, value, hint }) {
  return (
    <Card>
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </Card>
  )
}
