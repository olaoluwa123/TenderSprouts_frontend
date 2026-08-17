import { useMemo, useState } from 'react'
import { announcementsApi, studentsApi, teachersApi } from '@/api'
import { useAuth } from '@/hooks/useAuth'
import { useAsync } from '@/hooks/useAsync'
import { Alert, Badge, Button, Field, Input, Loading, Modal, PageHeader, Textarea } from '@/components/ui'

function formatWhen(value) {
  if (!value) return ''
  try {
    return new Date(value).toLocaleString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return value
  }
}

const emptyForm = {
  title: '',
  content: '',
  classId: '',
  isImportant: false,
}

export function TeacherAnnouncementsPage() {
  const { user } = useAuth()
  const teacherId = user?.profileId
  const [tab, setTab] = useState('inbox')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState(null)
  const [msg, setMsg] = useState(null)

  const { data: inbox, loading: inboxLoading, error: inboxError, reload: reloadInbox } = useAsync(
    () => announcementsApi.inbox(),
    [],
  )
  const { data: sent, loading: sentLoading, error: sentError, reload: reloadSent } = useAsync(
    () => announcementsApi.mine(),
    [],
  )
  const { data: assignments } = useAsync(
    () => (teacherId ? teachersApi.classes(teacherId).catch(() => []) : Promise.resolve([])),
    [teacherId],
  )
  const classes = assignments ?? []
  const classId = form.classId || (classes[0]?.classId ? String(classes[0].classId) : '')
  const { data: pupilsPage } = useAsync(
    () => (classId ? studentsApi.list({ classId: Number(classId), size: 200 }) : Promise.resolve({ content: [] })),
    [classId],
  )
  const pupilCount = (pupilsPage?.content ?? []).length

  const inboxItems = Array.isArray(inbox) ? inbox : (inbox?.content ?? [])
  const sentItems = Array.isArray(sent) ? sent : (sent?.content ?? [])

  const openCreate = () => {
    setForm({
      ...emptyForm,
      classId: classes[0]?.classId ? String(classes[0].classId) : '',
    })
    setFormError(null)
    setOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!classId) {
      setFormError('No class is assigned to your account')
      return
    }
    setSubmitting(true)
    setFormError(null)
    try {
      await announcementsApi.create({
        audience: 'CLASS',
        title: form.title.trim(),
        content: form.content.trim(),
        classId: Number(classId),
        isImportant: form.isImportant,
      })
      setOpen(false)
      setMsg('Announcement sent to pupils in your class (visible to their parents).')
      setTab('sent')
      reloadSent()
      reloadInbox()
    } catch (err) {
      setFormError(err.message || 'Could not send announcement')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return
    try {
      await announcementsApi.remove(id)
      setMsg('Announcement deleted.')
      reloadSent()
    } catch (err) {
      setMsg(err.message || 'Could not delete')
    }
  }

  const tabs = useMemo(() => [
    { id: 'inbox', label: 'From admin' },
    { id: 'sent', label: 'Sent to class' },
  ], [])

  const listLoading = tab === 'inbox' ? inboxLoading : sentLoading
  const listError = tab === 'inbox' ? inboxError : sentError
  const items = tab === 'inbox' ? inboxItems : sentItems

  return (
    <div>
      <PageHeader
        title="Announcements"
        subtitle="Receive school notices and message pupils in your classes"
        actions={(
          <Button onClick={openCreate} disabled={!classes.length}>
            Announce to class
          </Button>
        )}
      />

      {!classes.length && (
        <div className="mb-4">
          <Alert tone="info">
            Ask an admin to assign you to a class before sending announcements.
          </Alert>
        </div>
      )}
      {msg && (
        <div className="mb-4">
          <Alert tone="success">{msg}</Alert>
        </div>
      )}

      <div className="mb-4 flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
              tab === t.id
                ? 'bg-blossom-100 text-blossom-700'
                : 'bg-white text-muted hover:bg-blossom-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {listError && <Alert>{listError}</Alert>}
      {listLoading ? <Loading /> : items.length === 0 ? (
        <p className="text-sm text-muted">
          {tab === 'inbox' ? 'No announcements from admin yet.' : 'You have not sent any class announcements yet.'}
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="rounded-2xl border border-blossom-200/80 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="font-semibold text-ink">{item.title}</h3>
                <div className="flex items-center gap-2">
                  {item.isImportant && <Badge tone="warning">Important</Badge>}
                  {tab === 'sent' && (
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(item.id)}>Delete</Button>
                  )}
                </div>
              </div>
              {item.content && (
                <p className="mt-2 whitespace-pre-wrap text-sm text-muted">{item.content}</p>
              )}
              <p className="mt-3 text-xs text-muted">
                {item.className || item.audience || 'School'} · {formatWhen(item.createdAt || item.publishedAt)}
              </p>
            </li>
          ))}
        </ul>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Announce to class">
        <form onSubmit={handleSave} className="space-y-4">
          {formError && <Alert>{formError}</Alert>}
          <div>
            <p className="text-xs font-medium text-muted">Class</p>
            <p className="mt-1 text-sm font-medium text-ink">
              {classes[0]?.className || (classId ? `Class #${classId}` : 'No class assigned')}
            </p>
            {classId && (
              <p className="mt-1 text-xs text-muted">
                This reaches parents of {pupilCount} pupil{pupilCount === 1 ? '' : 's'} in the class.
              </p>
            )}
          </div>
          <Field label="Title">
            <Input
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              required
              maxLength={150}
            />
          </Field>
          <Field label="Message">
            <Textarea
              value={form.content}
              onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
              required
              rows={5}
            />
          </Field>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={form.isImportant}
              onChange={(e) => setForm((prev) => ({ ...prev, isImportant: e.target.checked }))}
            />
            Mark as important
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Sending…' : 'Send'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
