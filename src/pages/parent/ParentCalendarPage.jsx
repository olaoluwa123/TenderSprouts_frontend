import { useMemo, useState } from 'react'
import { calendarApi } from '@/api'
import { useAsync } from '@/hooks/useAsync'
import { Alert, Button, Loading, PageHeader, Table, Td, Th } from '@/components/ui'

function monthBounds(anchor) {
  const y = anchor.getFullYear()
  const m = anchor.getMonth()
  const from = new Date(y, m, 1)
  const to = new Date(y, m + 1, 0)
  const pad = (n) => String(n).padStart(2, '0')
  return {
    from: `${from.getFullYear()}-${pad(from.getMonth() + 1)}-${pad(from.getDate())}`,
    to: `${to.getFullYear()}-${pad(to.getMonth() + 1)}-${pad(to.getDate())}`,
    label: from.toLocaleString(undefined, { month: 'long', year: 'numeric' }),
  }
}

export function ParentCalendarPage() {
  const [anchor, setAnchor] = useState(() => new Date())
  const bounds = useMemo(() => monthBounds(anchor), [anchor])
  const { data: events, loading, error } = useAsync(
    () => calendarApi.list({ from: bounds.from, to: bounds.to }),
    [bounds.from, bounds.to],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="School calendar"
        subtitle={`${bounds.label} · Set by school admin`}
        actions={(
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() - 1, 1))}
            >
              Previous
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setAnchor(new Date())}>Today</Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1))}
            >
              Next
            </Button>
          </div>
        )}
      />
      {error && <Alert>{error}</Alert>}
      {loading ? <Loading /> : (
        <Table>
          <thead>
            <tr>
              <Th>Title</Th>
              <Th>Type</Th>
              <Th>Dates</Th>
              <Th>Class</Th>
            </tr>
          </thead>
          <tbody>
            {(events ?? []).length === 0 ? (
              <tr><Td colSpan={4} className="text-muted">No school events this month.</Td></tr>
            ) : (events ?? []).map((ev) => (
              <tr key={ev.id} className="border-t border-border">
                <Td className="font-medium">{ev.title}</Td>
                <Td>{ev.eventType}</Td>
                <Td>
                  {ev.startDate}
                  {ev.endDate && ev.endDate !== ev.startDate ? ` – ${ev.endDate}` : ''}
                </Td>
                <Td>{ev.className || 'Whole school'}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  )
}
