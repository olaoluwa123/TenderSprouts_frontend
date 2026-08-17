import { useMemo, useState } from 'react'
import { announcementsApi, parentsApi } from '@/api'
import { useAsync } from '@/hooks/useAsync'
import { useClasses, useStudents } from '@/hooks/useSchoolData'
import { ClassSelect } from '@/components/ui/SchoolSelects'
import { Alert, Badge, Button, Field, Input, Loading, Modal, PageHeader, Select, Table, Td, Textarea, Th } from '@/components/ui'

const AUDIENCES = [
  { value: 'ALL_PARENTS', label: 'All parents' },
  { value: 'TEACHERS', label: 'Teachers' },
  { value: 'CLASS', label: 'Class' },
  { value: 'SPECIFIC_PARENTS', label: 'Specific parents' },
  { value: 'SPECIFIC_PUPILS', label: 'Specific pupils' },
]

const emptyForm = {
  title: '',
  content: '',
  audience: 'ALL_PARENTS',
  classId: '',
  recipientIds: [],
  isImportant: false,
}

function formatWhen(value) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString(undefined, {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return value
  }
}

export function AnnouncementsPage() {
  const { data, loading, error, reload } = useAsync(
    () => announcementsApi.list({ size: 100 }),
    [],
  )
  const { data: classes } = useClasses()
  const { data: students } = useStudents()
  const { data: parents } = useAsync(
    () => parentsApi.list({ size: 100 }).then((p) => p.content).catch(() => []),
    [],
  )

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState(null)
  const [msg, setMsg] = useState(null)

  const rows = useMemo(() => {
    if (!data) return []
    return Array.isArray(data) ? data : (data.content ?? [])
  }, [data])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setFormError(null)
    setOpen(true)
  }

  const openEdit = (item) => {
    setEditing(item)
    setForm({
      title: item.title || '',
      content: item.content || '',
      audience: item.audience || 'ALL_PARENTS',
      classId: item.classId ? String(item.classId) : '',
      recipientIds: (item.recipientIds ?? item.recipients?.map((r) => r.recipientId) ?? []).map(String),
      isImportant: Boolean(item.isImportant),
    })
    setFormError(null)
    setOpen(true)
  }

  const toggleRecipient = (id) => {
    const key = String(id)
    setForm((prev) => {
      const set = new Set(prev.recipientIds.map(String))
      if (set.has(key)) set.delete(key)
      else set.add(key)
      return { ...prev, recipientIds: [...set] }
    })
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setFormError(null)
    const payload = {
      title: form.title.trim(),
      content: form.content.trim(),
      audience: form.audience,
      isImportant: form.isImportant,
      classId: form.audience === 'CLASS' && form.classId ? Number(form.classId) : undefined,
      recipientIds: ['SPECIFIC_PARENTS', 'SPECIFIC_PUPILS'].includes(form.audience)
        ? form.recipientIds.map(Number)
        : undefined,
    }
    try {
      if (editing) {
        await announcementsApi.update(editing.id, payload)
        setMsg('Announcement updated')
      } else {
        await announcementsApi.create(payload)
        setMsg('Announcement published')
      }
      setOpen(false)
      reload()
    } catch (err) {
      setFormError(err?.message || 'Could not save announcement')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return
    try {
      await announcementsApi.remove(id)
      setMsg('Announcement deleted')
      reload()
    } catch (err) {
      setMsg(err?.message || 'Could not delete announcement')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Announcements"
        subtitle="Publish notices to parents, teachers, classes, or individuals"
        actions={<Button onClick={openCreate}>Compose</Button>}
      />
      {msg && <Alert tone="success">{msg}</Alert>}
      {error && <Alert>{error}</Alert>}

      {loading ? <Loading /> : (
        <Table>
          <thead>
            <tr>
              <Th>Title</Th>
              <Th>Audience</Th>
              <Th>Important</Th>
              <Th>Created</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr className="border-t border-border">
                <Td className="text-muted">No announcements yet.</Td>
              </tr>
            ) : rows.map((item) => (
              <tr key={item.id} className="border-t border-border">
                <Td className="font-medium">{item.title}</Td>
                <Td>
                  <Badge>
                    {(item.audience || 'ALL_PARENTS').replaceAll('_', ' ')}
                    {item.className ? ` · ${item.className}` : ''}
                  </Badge>
                </Td>
                <Td>
                  {item.isImportant
                    ? <Badge tone="warning">Important</Badge>
                    : <span className="text-muted">—</span>}
                </Td>
                <Td>{formatWhen(item.createdAt || item.publishedAt)}</Td>
                <Td>
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => openEdit(item)}>Edit</Button>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(item.id)}>Delete</Button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit announcement' : 'Compose announcement'}>
        <form onSubmit={handleSave} className="space-y-3">
          {formError && <Alert>{formError}</Alert>}
          <Field label="Title">
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </Field>
          <Field label="Content">
            <Textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={5}
              required
            />
          </Field>
          <Field label="Audience">
            <Select
              value={form.audience}
              onChange={(e) => setForm({
                ...form,
                audience: e.target.value,
                classId: '',
                recipientIds: [],
              })}
            >
              {AUDIENCES.map((a) => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </Select>
          </Field>
          {form.audience === 'CLASS' && (
            <Field label="Class">
              <ClassSelect
                value={form.classId}
                onChange={(v) => setForm({ ...form, classId: v })}
                classes={classes ?? []}
              />
            </Field>
          )}
          {form.audience === 'SPECIFIC_PARENTS' && (
            <Field label="Parents">
              <div className="max-h-40 space-y-1 overflow-y-auto rounded-xl border border-brand-200 p-2">
                {(parents ?? []).map((p) => {
                  const id = String(p.id)
                  const checked = form.recipientIds.map(String).includes(id)
                  return (
                    <label key={id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-blossom-50/70">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleRecipient(id)}
                      />
                      <span>{p.fullName || p.email || `Parent #${id}`}</span>
                    </label>
                  )
                })}
                {(parents ?? []).length === 0 && (
                  <p className="px-2 py-3 text-sm text-muted">No parents available.</p>
                )}
              </div>
            </Field>
          )}
          {form.audience === 'SPECIFIC_PUPILS' && (
            <Field label="Pupils">
              <div className="max-h-40 space-y-1 overflow-y-auto rounded-xl border border-brand-200 p-2">
                {(students ?? []).map((s) => {
                  const id = String(s.id)
                  const checked = form.recipientIds.map(String).includes(id)
                  return (
                    <label key={id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-blossom-50/70">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleRecipient(id)}
                      />
                      <span>
                        {s.fullName || `Pupil #${id}`}
                        {s.admissionNumber ? ` (${s.admissionNumber})` : ''}
                      </span>
                    </label>
                  )
                })}
                {(students ?? []).length === 0 && (
                  <p className="px-2 py-3 text-sm text-muted">No pupils available.</p>
                )}
              </div>
            </Field>
          )}
          <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={form.isImportant}
              onChange={(e) => setForm({ ...form, isImportant: e.target.checked })}
            />
            Mark as important
          </label>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Saving…' : editing ? 'Save changes' : 'Publish'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}
