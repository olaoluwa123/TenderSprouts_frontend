import { useMemo, useState } from 'react'
import { enrollmentsApi, studentsApi } from '@/api'
import { useAsync } from '@/hooks/useAsync'
import { useClasses, useSessions } from '@/hooks/useSchoolData'
import { ClassSelect, SessionSelect } from '@/components/ui/SchoolSelects'
import { Alert, Button, Card, Field, PageHeader } from '@/components/ui'

function getNextSession(sessions, sourceSessionId) {
  if (!sourceSessionId || !sessions?.length) return null
  const ordered = [...sessions].sort((a, b) => {
    const dateCompare = (a.startDate ?? '').localeCompare(b.startDate ?? '')
    if (dateCompare !== 0) return dateCompare
    return a.id - b.id
  })
  const index = ordered.findIndex((s) => String(s.id) === String(sourceSessionId))
  return index >= 0 ? ordered[index + 1] ?? null : null
}

export function EnrollmentsPage() {
  const { data: classes } = useClasses()
  const { data: sessions } = useSessions()
  const [form, setForm] = useState({
    sourceClassId: '',
    sourceSessionId: '',
    targetClassId: '',
    studentIds: [],
  })
  const targetSession = useMemo(
    () => getNextSession(sessions, form.sourceSessionId),
    [sessions, form.sourceSessionId],
  )
  const { data: students } = useAsync(
    () => {
      if (!form.sourceClassId) return Promise.resolve([])
      return studentsApi.list({
        classId: Number(form.sourceClassId),
        sessionId: form.sourceSessionId ? Number(form.sourceSessionId) : undefined,
        size: 200,
      }).then((p) => p.content)
    },
    [form.sourceClassId, form.sourceSessionId],
  )
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const toggleStudent = (id) => {
    setForm((f) => ({
      ...f,
      studentIds: f.studentIds.includes(id)
        ? f.studentIds.filter((s) => s !== id)
        : [...f.studentIds, id],
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (!targetSession) {
      setError('No next academic session exists after the selected source session.')
      return
    }
    try {
      const res = await enrollmentsApi.bulkPromote({
        sourceClassId: Number(form.sourceClassId),
        sourceSessionId: Number(form.sourceSessionId),
        targetClassId: Number(form.targetClassId),
        studentIds: form.studentIds,
      })
      setResult(`Promoted: ${res.promoted}, Skipped: ${res.skipped}`)
    } catch (err) {
      setError(err?.message || 'Failed')
    }
  }

  return (
    <div>
      <PageHeader title="Bulk Promote" subtitle="Move students to the next class and session" />
      <Card className="max-w-xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <Alert>{error}</Alert>}
          {result && <Alert tone="success">{result}</Alert>}
          <Field label="Source class">
            <ClassSelect
              value={form.sourceClassId}
              onChange={(v) => setForm({ ...form, sourceClassId: v, studentIds: [] })}
              classes={classes ?? []}
            />
          </Field>
          <Field label="Source session">
            <SessionSelect
              value={form.sourceSessionId}
              onChange={(v) => setForm({ ...form, sourceSessionId: v, studentIds: [] })}
              sessions={sessions ?? []}
            />
          </Field>
          <Field label="Target session">
            {form.sourceSessionId ? (
              targetSession ? (
                <p className="rounded-lg border border-border bg-slate-50 px-3 py-2 text-sm">
                  {targetSession.name}
                  <span className="ml-2 text-muted">(next session after source)</span>
                </p>
              ) : (
                <Alert>No next session is configured after the selected source session.</Alert>
              )
            ) : (
              <p className="text-sm text-muted">Select a source session to see the target session.</p>
            )}
          </Field>
          <Field label="Target class">
            <ClassSelect value={form.targetClassId} onChange={(v) => setForm({ ...form, targetClassId: v })} classes={classes ?? []} />
          </Field>
          {form.sourceClassId && (
            <Field label="Students to promote">
              {!form.sourceSessionId ? (
                <p className="text-sm text-muted">Select a source session to list students.</p>
              ) : students?.length ? (
                <div className="max-h-40 overflow-y-auto space-y-2 rounded-lg border border-border p-3">
                  {students.map((s) => (
                    <label key={s.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={form.studentIds.includes(s.id)}
                        onChange={() => toggleStudent(s.id)}
                      />
                      {s.firstName} {s.lastName} ({s.admissionNumber})
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted">No students in this class for the selected session.</p>
              )}
            </Field>
          )}
          <Button type="submit" disabled={form.studentIds.length === 0 || !targetSession}>
            Promote students
          </Button>
        </form>
      </Card>
    </div>
  )
}
