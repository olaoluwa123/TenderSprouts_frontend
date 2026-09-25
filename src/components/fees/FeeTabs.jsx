import { Link } from 'react-router-dom'
import clsx from 'clsx'

const SETUP_TABS = [
  { id: 'template', label: 'Template' },
  { id: 'term', label: 'Term fees' },
  { id: 'invoices', label: 'Invoices' },
]

function tabClass(active) {
  return clsx(
    'rounded-xl px-3 py-2 text-sm font-medium transition-colors',
    active ? 'bg-blossom-100 text-blossom-700' : 'bg-white text-muted hover:bg-blossom-50',
  )
}

export function FeeTabs({ active, onSelect }) {
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {SETUP_TABS.map((t) => (
        onSelect ? (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelect(t.id)}
            className={tabClass(active === t.id)}
          >
            {t.label}
          </button>
        ) : (
          <Link key={t.id} to="/admin/fees" className={tabClass(false)}>
            {t.label}
          </Link>
        )
      ))}
      <Link to="/admin/fees/owing" className={tabClass(active === 'owing')}>
        Owing
      </Link>
      <Link to="/admin/fees/paid" className={tabClass(active === 'paid')}>
        Paid
      </Link>
    </div>
  )
}
