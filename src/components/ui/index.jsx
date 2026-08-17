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
        'inline-flex cursor-pointer items-center justify-center gap-2 rounded-full font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
        size === 'sm' ? 'px-3.5 py-1.5 text-sm' : 'px-4 py-2 text-sm',
        variant === 'primary' && 'bg-brand-600 text-white shadow-md shadow-brand-600/20 hover:bg-brand-700',
        variant === 'secondary' && 'border border-blossom-300 bg-white text-blossom-700 hover:border-blossom-400 hover:bg-blossom-50',
        variant === 'danger' && 'bg-red-600 text-white hover:bg-red-700',
        variant === 'ghost' && 'text-ink/70 hover:bg-blossom-50 hover:text-blossom-700',
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
        'w-full rounded-xl border border-blossom-200 bg-white px-3 py-2 text-sm text-ink outline-none placeholder:text-muted/70 focus:border-brand-500 focus:ring-2 focus:ring-brand-100',
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
        'w-full cursor-pointer rounded-xl border border-blossom-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100',
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
        'w-full rounded-xl border border-blossom-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100',
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
      className={clsx('rounded-2xl border border-blossom-200/80 bg-card p-5 shadow-sm shadow-blossom-500/5', onClick && 'cursor-pointer', className)}
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
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function Badge({ children, tone = 'default' }) {
  const tones = {
    default: 'bg-brand-50 text-brand-800',
    success: 'bg-brand-100 text-brand-800',
    warning: 'bg-sun/20 text-ink',
    danger: 'bg-blossom-100 text-blossom-700',
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
    <div className="rounded-2xl border border-dashed border-blossom-200 bg-white px-6 py-12 text-center">
      <h3 className="font-medium text-ink">{title}</h3>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
    </div>
  )
}

export function Alert({ children, tone = 'error' }) {
  const tones = {
    error: 'border-blossom-200 bg-blossom-50 text-blossom-700',
    success: 'border-brand-200 bg-brand-50 text-brand-800',
    info: 'border-leaf/30 bg-brand-50/60 text-ink',
    warning: 'border-sun/40 bg-sun/10 text-ink',
  }
  return <div className={clsx('rounded-xl border px-4 py-3 text-sm', tones[tone] ?? tones.error)}>{children}</div>
}

export function Table({ children }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-blossom-200/80 bg-white">
      <table className="min-w-full divide-y divide-blossom-100 text-sm">{children}</table>
    </div>
  )
}

export function Th({ children }) {
  return <th className="bg-cream/60 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">{children}</th>
}

export function Td({ children, className }) {
  return <td className={clsx('px-4 py-3 text-ink/80', className)}>{children}</td>
}

export function Modal({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl shadow-blossom-500/10">
        <div className="flex items-center justify-between border-b border-blossom-100 px-5 py-4">
          <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
          <button type="button" onClick={onClose} className="cursor-pointer text-muted hover:text-ink">✕</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

export function Field({ label, children }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-ink/80">{label}</span>
      {children}
    </label>
  )
}

export function StatCard({ label, value, hint }) {
  return (
    <Card>
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold text-ink">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </Card>
  )
}
