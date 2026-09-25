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
              {(events ?? []).length === 0 ? (
                <tr>
                  <Td colSpan={5} className="text-muted">No school events this month.</Td>
                </tr>
              ) : (events ?? []).map((ev) => (
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
