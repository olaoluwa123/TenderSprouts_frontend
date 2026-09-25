import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { classesApi, teachersApi } from '@/api'
import { useAsync } from '@/hooks/useAsync'
import { useSubjects, useTeachers } from '@/hooks/useSchoolData'
import { TeacherSelect } from '@/components/ui/SchoolSelects'
import { Alert, Button, Field, Input, Loading, PageHeader, Table, Td, Th } from '@/components/ui'

function InfoRow({ label, value }) {
  return (
    <div className="grid gap-1 border-b border-brand-100 py-3 sm:grid-cols-[11rem_1fr] sm:gap-4">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted">{label}</dt>
      <dd className="text-sm text-ink whitespace-pre-wrap">{value || '—'}</dd>
    </div>
  )
}

function Section({ title, children, action }) {
  return (
    <section className="rounded-2xl border border-blossom-200/80 bg-white p-5 shadow-sm shadow-blossom-500/5">
      <div className="mb-4 flex items-baseline justify-between gap-3 border-b border-brand-100 pb-3">
        <h2 className="font-display text-lg font-semibold tracking-tight text-ink">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

export function ClassDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const classId = Number(id)
  const [attendanceDate, setAttendanceDate] = useState(() => new Date().toISOString().slice(0, 10))
  const { data: allSubjects } = useSubjects()
  const { data: teachers } = useTeachers()
  const { data, loading, error, reload } = useAsync(
    () => classesApi.get(classId, { date: attendanceDate || undefined }),
    [classId, attendanceDate],
  )

  const [teacherId, setTeacherId] = useState('')
  const [subjectDraft, setSubjectDraft] = useState(new Set())
  const [actionError, setActionError] = useState(null)
  const [msg, setMsg] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!data?.subjects) return
    setSubjectDraft(new Set(data.subjects.map((s) => s.subjectId)))
  }, [data])

  const run = async (fn, successMessage) => {
    setActionError(null)
    setMsg(null)
    setSaving(true)
    try {
      await fn()
      setMsg(successMessage)
      reload()
    } catch (err) {
      setActionError(err?.message || 'Action failed')
    } finally {
      setSaving(false)
    }
  }

  const assignedTeachers = data?.teachers?.length
    ? data.teachers
    : (data?.teacher ? [data.teacher] : [])
  const assignedTeacherIds = new Set(assignedTeachers.map((row) => Number(row.id)))
  const availableTeachers = (teachers ?? []).filter((row) => !assignedTeacherIds.has(Number(row.id)))

  const assignTeacher = async () => {
    const tid = Number(teacherId)
    if (!tid) throw new Error('Select a teacher')
    if (assignedTeacherIds.has(tid)) {
      setTeacherId('')
      return
    }
    await teachersApi.assignClass(tid, classId)
    setTeacherId('')
  }

  const saveSubjects = async () => {
    const desired = subjectDraft
    const current = new Set((data.subjects ?? []).map((s) => s.subjectId))
    for (const subjectId of desired) {
      if (!current.has(subjectId)) {
        await classesApi.assignSubject(classId, subjectId)
      }
    }
    for (const subjectId of current) {
      if (!desired.has(subjectId)) {
        await classesApi.unassignSubject(classId, subjectId)
      }
    }
  }

  const toggleSubject = (subjectId, checked) => {
    setSubjectDraft((prev) => {
      const next = new Set(prev)
      if (checked) next.add(subjectId)
      else next.delete(subjectId)
      return next
    })
  }

  if (loading && !data) return <Loading label="Loading class profile…" />
  if (error && !data) {
    return (
      <div>
        <PageHeader title="Class profile" />
        <Alert>{error}</Alert>
        <Button className="mt-3" variant="secondary" onClick={() => navigate('/admin/classes')}>Back</Button>
      </div>
    )
  }

  const attendance = data?.attendance
  const results = data?.results

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title={data?.name || 'Class'}
        subtitle={data?.classGroup === 'PRE_PRIMARY' ? 'Pre-primary' : data?.classGroup === 'PRIMARY' ? 'Primary' : 'Class profile'}
        actions={(
          <Link to="/admin/classes">
            <Button variant="secondary" size="sm"><ArrowLeft size={14} /> All classes</Button>
          </Link>
        )}
      />

      {actionError && <Alert>{actionError}</Alert>}
      {msg && <Alert tone="success">{msg}</Alert>}

      <Section title="Overview">
        <dl>
          <InfoRow label="Class" value={data.name} />
          <InfoRow
            label="Group"
            value={data.classGroup === 'PRE_PRIMARY' ? 'Pre-primary' : data.classGroup === 'PRIMARY' ? 'Primary' : data.classGroup}
          />
          <InfoRow label="Pupils" value={String(data.pupilCount ?? 0)} />
          <InfoRow
            label="Teachers"
            value={assignedTeachers.length
              ? assignedTeachers.map((row) => [row.fullName, row.phone].filter(Boolean).join(' · ')).join(' / ')
              : 'Not assigned'}
          />
        </dl>
        <div className="mt-4 space-y-2">
          {assignedTeachers.map((row) => (
            <div
              key={row.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-100 bg-brand-50-50 px-4 py-3"
            >
              <p className="text-sm font-medium text-ink">
                {[row.fullName, row.phone].filter(Boolean).join(' · ')}
              </p>
              <Button
                variant="danger"
                size="sm"
                disabled={saving}
                onClick={() => run(
                  () => teachersApi.unassignClass(row.id, classId),
                  'Teacher removed from class',
                )}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
        <div className="mt-4 max-w-md space-y-3 rounded-xl border border-brand-100 p-4">
          <h3 className="text-sm font-semibold text-ink">Add teacher</h3>
          <p className="text-xs text-muted">More than one teacher can be assigned to this class.</p>
          <TeacherSelect value={teacherId} onChange={setTeacherId} teachers={availableTeachers} />
          <Button
            disabled={!teacherId || saving}
            onClick={() => run(assignTeacher, 'Teacher assigned')}
          >
            {saving ? 'Saving…' : 'Add teacher'}
          </Button>
        </div>
      </Section>

      <Section
        title="Subjects"
        action={(
          <Button size="sm" disabled={saving} onClick={() => run(saveSubjects, 'Subjects updated')}>
            Save subjects
          </Button>
        )}
      >
        {(allSubjects ?? []).filter((s) => s.isActive !== false).length === 0 ? (
          <p className="text-sm text-muted">No subjects yet. Add subjects under Subjects.</p>
        ) : (
          <ul className="space-y-2">
            {(allSubjects ?? []).filter((s) => s.isActive !== false).map((s) => (
                <li key={s.id} className="flex flex-wrap items-center gap-2 text-sm">
                  <input
                    id={`class-subj-${s.id}`}
                    type="checkbox"
                    checked={subjectDraft.has(s.id)}
                    onChange={(e) => toggleSubject(s.id, e.target.checked)}
                  />
                  <label htmlFor={`class-subj-${s.id}`}>{s.name}</label>
                </li>
              ))}
          </ul>
        )}
      </Section>

      <Section title="Pupils">
        {(data.pupils ?? []).length === 0 ? (
          <p className="text-sm text-muted">No pupils in this class.</p>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Admission #</Th>
                <Th>Status</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {data.pupils.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <Td>{p.firstName} {p.lastName}</Td>
                  <Td>{p.admissionNumber}</Td>
                  <Td>{p.isActive === false ? 'Inactive' : 'Active'}</Td>
                  <Td>
                    <Link to={`/admin/students/${p.id}`}>
                      <Button size="sm" variant="secondary">View</Button>
                    </Link>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Section>

      <Section title="Academic results">
        <p className="mb-3 text-sm text-muted">
          {results?.termName ? `Active term: ${results.termName}` : 'No active term results.'}
        </p>
        {(results?.items ?? []).length === 0 ? (
          <p className="text-sm text-muted">No term results for this class yet.</p>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Pupil</Th>
                <Th>Admission #</Th>
                <Th>Average</Th>
                <Th>Rank</Th>
                <Th>Published</Th>
              </tr>
            </thead>
            <tbody>
              {results.items.map((r) => (
                <tr key={r.studentId} className="border-t border-border">
                  <Td>
                    <Link className="text-brand-700 underline" to={`/admin/students/${r.studentId}`}>
                      {r.studentName}
                    </Link>
                  </Td>
                  <Td>{r.admissionNumber || '—'}</Td>
                  <Td>{r.averageScore != null ? Number(r.averageScore).toFixed(1) : '—'}</Td>
                  <Td>{r.rankInClass ?? '—'}</Td>
                  <Td>{r.publishedAt ? 'Yes' : 'No'}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Section>

      <Section title="Attendance">
        <div className="mb-4 max-w-xs">
          <Field label="Date">
            <Input
              type="date"
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
            />
          </Field>
        </div>
        {attendance && (
          <div className="mb-4 grid gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-brand-100 p-3 text-sm">
              <p className="text-muted">Present</p>
              <p className="text-lg font-semibold">{attendance.present}</p>
            </div>
            <div className="rounded-xl border border-brand-100 p-3 text-sm">
              <p className="text-muted">Absent</p>
              <p className="text-lg font-semibold">{attendance.absent}</p>
            </div>
            <div className="rounded-xl border border-brand-100 p-3 text-sm">
              <p className="text-muted">Late</p>
              <p className="text-lg font-semibold">{attendance.late}</p>
            </div>
            <div className="rounded-xl border border-brand-100 p-3 text-sm">
              <p className="text-muted">Marked</p>
              <p className="text-lg font-semibold">{attendance.marked}/{attendance.enrolled}</p>
            </div>
          </div>
        )}
        {(attendance?.pupils ?? []).length === 0 ? (
          <p className="text-sm text-muted">No pupils to show.</p>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Pupil</Th>
                <Th>Admission #</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {attendance.pupils.map((p) => (
                <tr key={p.studentId} className="border-t border-border">
                  <Td>{p.fullName}</Td>
                  <Td>{p.admissionNumber || '—'}</Td>
                  <Td>{p.status || '—'}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Section>
    </div>
  )
}
