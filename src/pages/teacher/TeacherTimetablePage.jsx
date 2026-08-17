import { useMemo, useState } from 'react'
import { teachersApi } from '@/api'
import { useAuth } from '@/hooks/useAuth'
import { useAsync } from '@/hooks/useAsync'
import { Alert, Button, Field, Input, Loading, Modal, PageHeader, Select, Table, Td, Th } from '@/components/ui'

const DAYS = [
  { value: 'MONDAY', label: 'Monday' },
  { value: 'TUESDAY', label: 'Tuesday' },
  { value: 'WEDNESDAY', label: 'Wednesday' },
  { value: 'THURSDAY', label: 'Thursday' },
  { value: 'FRIDAY', label: 'Friday' },
]

const emptyForm = {
  dayOfWeek: 'MONDAY',
  startTime: '08:00',
  endTime: '08:40',
  classId: '',
  subjectId: '',
  room: '',
}

function formatTime(value) {
  return value ? String(value).slice(0, 5) : '—'
}

function dayLabel(value) {
  return DAYS.find((d) => d.value === value)?.label || value
}

export function TeacherTimetablePage() {
  const { user } = useAuth()
  const teacherId = user?.profileId
  const [dayFilter, setDayFilter] = useState('ALL')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState(null)
  const [msg, setMsg] = useState(null)

  const { data: slots, loading, error, reload } = useAsync(
    () => (teacherId ? teachersApi.timetable(teacherId) : Promise.resolve([])),
    [teacherId],
  )
  const { data: assignments } = useAsync(
    () => (teacherId ? teachersApi.classes(teacherId).catch(() => []) : Promise.resolve([])),
    [teacherId],
  )
  const { data: subjects } = useAsync(
    () => (teacherId ? teachersApi.listSubjects(teacherId).catch(() => []) : Promise.resolve([])),
    [teacherId],
  )

  const classes = assignments ?? []
  const subjectOptions = subjects ?? []
  const rows = useMemo(() => {
    const order = { MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3, THURSDAY: 4, FRIDAY: 5 }
    const list = Array.isArray(slots) ? slots : []
    return list
      .filter((s) => dayFilter === 'ALL' || s.dayOfWeek === dayFilter)
      .slice()
      .sort((a, b) => {
        const dayCmp = (order[a.dayOfWeek] || 9) - (order[b.dayOfWeek] || 9)
        if (dayCmp !== 0) return dayCmp
        return String(a.startTime || '').localeCompare(String(b.startTime || ''))
      })
  }, [slots, dayFilter])

  const subjectsForClass = useMemo(() => {
    if (!form.classId) return subjectOptions
    return subjectOptions.filter((s) => String(s.classId) === String(form.classId))
  }, [subjectOptions, form.classId])

  const openCreate = () => {
    setEditing(null)
    setForm({
      ...emptyForm,
      classId: classes[0]?.classId ? String(classes[0].classId) : '',
      subjectId: '',
    })
    setFormError(null)
    setOpen(true)
  }

  const openEdit = (slot) => {
    setEditing(slot)
    setForm({
      dayOfWeek: slot.dayOfWeek || 'MONDAY',
      startTime: formatTime(slot.startTime),
      endTime: formatTime(slot.endTime),
      classId: slot.classId ? String(slot.classId) : '',
      subjectId: slot.subjectId ? String(slot.subjectId) : '',
      room: slot.room || '',
    })
    setFormError(null)
    setOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setFormError(null)
    const payload = {
      dayOfWeek: form.dayOfWeek,
      startTime: form.startTime.length === 5 ? `${form.startTime}:00` : form.startTime,
      endTime: form.endTime.length === 5 ? `${form.endTime}:00` : form.endTime,
      classId: Number(form.classId),
      subjectId: form.subjectId ? Number(form.subjectId) : null,
      room: form.room.trim() || null,
    }
    try {
      if (editing) {
        await teachersApi.updateTimetableSlot(teacherId, editing.id, payload)
        setMsg('Period updated.')
      } else {
        await teachersApi.createTimetableSlot(teacherId, payload)
        setMsg('Period added to your timetable.')
      }
      setOpen(false)
      reload()
    } catch (err) {
      setFormError(err.message || 'Could not save period')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (slot) => {
    if (!window.confirm(`Remove ${dayLabel(slot.dayOfWeek)} ${formatTime(slot.startTime)}–${formatTime(slot.endTime)}?`)) {
      return
    }
    try {
      await teachersApi.deleteTimetableSlot(teacherId, slot.id)
      setMsg('Period removed.')
      reload()
    } catch (err) {
      setMsg(err.message || 'Could not delete period')
    }
  }

  return (
    <div>
      <PageHeader
        title="My timetable"
        subtitle="Set your teaching periods for each weekday"
        actions={(
          <Button onClick={openCreate} disabled={!classes.length}>Add period</Button>
        )}
      />

      {!teacherId && <Alert>Teacher profile missing.</Alert>}
      {!classes.length && (
        <div className="mb-4">
          <Alert tone="info">
            Ask an admin to assign you to a class before building your timetable.
          </Alert>
        </div>
      )}
      {msg && (
        <div className="mb-4">
          <Alert tone="success">{msg}</Alert>
        </div>
      )}
      {error && <Alert>{error}</Alert>}

      <div className="mb-4 max-w-xs">
        <Select value={dayFilter} onChange={(e) => setDayFilter(e.target.value)}>
          <option value="ALL">All weekdays</option>
          {DAYS.map((d) => (
            <option key={d.value} value={d.value}>{d.label}</option>
          ))}
        </Select>
      </div>

      {loading ? <Loading /> : (
        <Table>
          <thead>
            <tr>
              <Th>Day</Th>
              <Th>Time</Th>
              <Th>Subject</Th>
              <Th>Class</Th>
              <Th>Room</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <Td colSpan={6} className="text-muted">
                  No periods yet. Add your weekly schedule so today&apos;s classes show on the dashboard.
                </Td>
              </tr>
            ) : rows.map((slot) => (
              <tr key={slot.id} className="border-t border-border">
                <Td className="font-medium">{dayLabel(slot.dayOfWeek)}</Td>
                <Td>{formatTime(slot.startTime)} – {formatTime(slot.endTime)}</Td>
                <Td>{slot.subjectName || '—'}</Td>
                <Td>{slot.className || `Class #${slot.classId}`}</Td>
                <Td>{slot.room || '—'}</Td>
                <Td>
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="secondary" onClick={() => openEdit(slot)}>Edit</Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(slot)}>Remove</Button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit period' : 'Add period'}>
        <form onSubmit={handleSave} className="space-y-4">
          {formError && <Alert>{formError}</Alert>}
          <Field label="Day">
            <Select
              value={form.dayOfWeek}
              onChange={(e) => setForm((prev) => ({ ...prev, dayOfWeek: e.target.value }))}
              required
            >
              {DAYS.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start">
              <Input
                type="time"
                value={form.startTime}
                onChange={(e) => setForm((prev) => ({ ...prev, startTime: e.target.value }))}
                required
              />
            </Field>
            <Field label="End">
              <Input
                type="time"
                value={form.endTime}
                onChange={(e) => setForm((prev) => ({ ...prev, endTime: e.target.value }))}
                required
              />
            </Field>
          </div>
          <Field label="Class">
            <p className="text-sm font-medium text-ink">
              {classes[0]?.className || (form.classId ? `Class #${form.classId}` : 'No class assigned')}
            </p>
          </Field>
          <Field label="Subject (optional)">
            <Select
              value={form.subjectId}
              onChange={(e) => setForm((prev) => ({ ...prev, subjectId: e.target.value }))}
            >
              <option value="">No subject</option>
              {(subjectsForClass.length ? subjectsForClass : subjectOptions).map((s) => (
                <option key={`${s.classId}-${s.subjectId}`} value={s.subjectId}>
                  {s.subjectName || `Subject #${s.subjectId}`}
                  {s.className ? ` (${s.className})` : ''}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Room (optional)">
            <Input
              value={form.room}
              onChange={(e) => setForm((prev) => ({ ...prev, room: e.target.value }))}
              maxLength={100}
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving…' : editing ? 'Save' : 'Add period'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
