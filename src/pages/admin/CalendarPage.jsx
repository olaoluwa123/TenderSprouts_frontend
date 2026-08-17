import { useMemo, useState } from 'react'
import { calendarApi } from '@/api'
import { useAsync } from '@/hooks/useAsync'
import { useClasses } from '@/hooks/useSchoolData'
import { ClassSelect } from '@/components/ui/SchoolSelects'
import { Alert, Button, Field, Input, Loading, Modal, PageHeader, Select, Table, Td, Textarea, Th } from '@/components/ui'

const EVENT_TYPES = [
  'RESUMPTION', 'EXAM', 'PTA', 'EVENT', 'HOLIDAY', 'PARENT_MEETING',
  'SPORTS', 'GRADUATION', 'EXCURSION', 'MEETING', 'GENERAL', 'OTHER',
]

const emptyForm = {
  title: '',
  eventType: 'EVENT',
  startDate: '',
  endDate: '',
  classId: '',
  description: '',
}

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

export function CalendarPage() {
  const [anchor, setAnchor] = useState(() => new Date())
  const bounds = useMemo(() => monthBounds(anchor), [anchor])
  const { data: classes } = useClasses()
  const { data: events, loading, error, reload } = useAsync(
    () => calendarApi.list({ from: bounds.from, to: bounds.to }),
    [bounds.from, bounds.to],
  )
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState(null)

  const openCreate = () => {
    setEditing(null)
    setForm({ ...emptyForm, startDate: bounds.from, endDate: bounds.from })
    setFormError(null)
    setOpen(true)
  }

  const openEdit = (event) => {
    setEditing(event)
    setForm({
      title: event.title || '',
      eventType: event.eventType || 'EVENT',
      startDate: event.startDate || '',
      endDate: event.endDate || event.startDate || '',
      classId: event.classId ? String(event.classId) : '',
      description: event.description || '',
    })
    setFormError(null)
    setOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setFormError(null)
    const payload = {
      title: form.title.trim(),
      eventType: form.eventType,
      startDate: form.startDate,
      endDate: form.endDate || form.startDate,
      classId: form.classId ? Number(form.classId) : undefined,
      description: form.description || undefined,
    }
    try {
      if (editing) {
        await calendarApi.update(editing.id, payload)
      } else {
        await calendarApi.create(payload)
      }
      setOpen(false)
      reload()
    } catch (err) {
      setFormError(err?.message || 'Could not save event')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this calendar event?')) return
    try {
      await calendarApi.remove(id)
      reload()
    } catch (err) {
      setFormError(err?.message || 'Could not delete event')
    }
  }

  const daysInMonth = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0).getDate()
  const firstWeekday = new Date(anchor.getFullYear(), anchor.getMonth(), 1).getDay()
  const eventsByDay = useMemo(() => {
    const map = {}
    for (const event of events ?? []) {
      const start = new Date(event.startDate)
      const end = new Date(event.endDate || event.startDate)
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        if (d.getMonth() !== anchor.getMonth() || d.getFullYear() !== anchor.getFullYear()) continue
        const key = d.getDate()
        if (!map[key]) map[key] = []
        map[key].push(event)
      }
    }
    return map
  }, [events, anchor])

  return (
    <div className="space-y-6">
      <PageHeader
        title="School Calendar"
        subtitle={`${bounds.label} · Visible to teachers and parents`}
        actions={(
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() - 1, 1))}
            >
              Previous
            </Button>
            <Button variant="secondary" onClick={() => setAnchor(new Date())}>Today</Button>
            <Button
              variant="secondary"
              onClick={() => setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1))}
            >
              Next
            </Button>
            <Button onClick={openCreate}>Add event</Button>
          </div>
        )}
      />
      {error && <Alert>{error}</Alert>}
      {formError && !open && <Alert>{formError}</Alert>}

      {loading ? <Loading /> : (
        <>
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium uppercase tracking-wide text-muted">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <div key={d} className="py-2">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstWeekday }).map((_, i) => (
              <div key={`pad-${i}`} className="min-h-20 rounded-xl bg-transparent" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const dayEvents = eventsByDay[day] || []
              return (
                <div key={day} className="min-h-20 rounded-xl border border-brand-100 bg-white p-2 text-left">
                  <p className="text-xs font-semibold text-ink">{day}</p>
                  <ul className="mt-1 space-y-0.5">
                    {dayEvents.slice(0, 3).map((ev) => (
                      <li key={`${ev.id}-${day}`}>
                        <button
                          type="button"
                          className="w-full truncate rounded bg-brand-50 px-1 py-0.5 text-left text-[10px] text-brand-800"
                          onClick={() => openEdit(ev)}
                        >
                          {ev.title}
                        </button>
                      </li>
                    ))}
                    {dayEvents.length > 3 && (
                      <li className="text-[10px] text-muted">+{dayEvents.length - 3} more</li>
                    )}
                  </ul>
                </div>
              )
            })}
          </div>

          <div>
            <h2 className="mb-3 font-display text-lg font-semibold text-ink">Events this month</h2>
            <Table>
              <thead>
                <tr>
                  <Th>Title</Th>
                  <Th>Type</Th>
                  <Th>Dates</Th>
                  <Th>Class</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {(events ?? []).map((ev) => (
                  <tr key={ev.id} className="border-t border-border">
                    <Td>{ev.title}</Td>
                    <Td>{ev.eventType}</Td>
                    <Td>
                      {ev.startDate}
                      {ev.endDate && ev.endDate !== ev.startDate ? ` – ${ev.endDate}` : ''}
                    </Td>
                    <Td>{ev.className || '—'}</Td>
                    <Td>
                      <div className="flex gap-2">
                        <Button size="sm" variant="secondary" onClick={() => openEdit(ev)}>Edit</Button>
                        <Button size="sm" variant="danger" onClick={() => handleDelete(ev.id)}>Delete</Button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit event' : 'Add event'}>
        <form onSubmit={handleSave} className="space-y-3">
          {formError && <Alert>{formError}</Alert>}
          <Field label="Title">
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </Field>
          <Field label="Type">
            <Select value={form.eventType} onChange={(e) => setForm({ ...form, eventType: e.target.value })}>
              {EVENT_TYPES.map((t) => <option key={t} value={t}>{t.replaceAll('_', ' ')}</option>)}
            </Select>
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Start date">
              <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
            </Field>
            <Field label="End date">
              <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </Field>
          </div>
          <Field label="Class (optional)">
            <ClassSelect value={form.classId} onChange={(v) => setForm({ ...form, classId: v })} classes={classes ?? []} />
          </Field>
          <Field label="Description">
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
          </Field>
          <Button type="submit" disabled={submitting}>{submitting ? 'Saving…' : 'Save event'}</Button>
        </form>
      </Modal>
    </div>
  )
}
