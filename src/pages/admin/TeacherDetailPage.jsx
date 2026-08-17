import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { classesApi, teachersApi } from '@/api'
import { useAsync } from '@/hooks/useAsync'
import { useClasses, useSubjects } from '@/hooks/useSchoolData'
import { ClassSelect } from '@/components/ui/SchoolSelects'
import { Alert, Button, Field, Input, Loading, Modal, PageHeader, Select, Table, Td, Th } from '@/components/ui'

const DAY_ORDER = { MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3, THURSDAY: 4, FRIDAY: 5 }
const DAY_LABEL = {
  MONDAY: 'Monday',
  TUESDAY: 'Tuesday',
  WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday',
  FRIDAY: 'Friday',
}

function formatTime(value) {
  return value ? String(value).slice(0, 5) : '—'
}

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

export function TeacherDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const teacherId = Number(id)
  const { data: classes } = useClasses()
  const { data: allSubjects } = useSubjects()
  const { data, loading, error, reload } = useAsync(
    () => teachersApi.profile(teacherId),
    [teacherId],
  )
  const { data: timetable, loading: timetableLoading } = useAsync(
    () => teachersApi.timetable(teacherId).catch(() => []),
    [teacherId],
  )

  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState(null)
  const [classId, setClassId] = useState('')
  const [actionError, setActionError] = useState(null)
  const [msg, setMsg] = useState(null)
  const [saving, setSaving] = useState(false)
  const [subjectDraft, setSubjectDraft] = useState({})
  const [curriculumByClass, setCurriculumByClass] = useState({})

  const assignedClasses = data?.classes ?? []
  const currentClass = assignedClasses[0] ?? null
  const timetableRows = useMemo(() => {
    const list = Array.isArray(timetable) ? timetable : []
    return list.slice().sort((a, b) => {
      const dayCmp = (DAY_ORDER[a.dayOfWeek] || 9) - (DAY_ORDER[b.dayOfWeek] || 9)
      if (dayCmp !== 0) return dayCmp
      return String(a.startTime || '').localeCompare(String(b.startTime || ''))
    })
  }, [timetable])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const next = {}
      for (const cls of assignedClasses) {
        try {
          next[cls.classId] = await classesApi.subjects(cls.classId)
        } catch {
          next[cls.classId] = []
        }
      }
      if (!cancelled) setCurriculumByClass(next)
    }
    if (assignedClasses.length) load()
    else setCurriculumByClass({})
    return () => { cancelled = true }
  }, [assignedClasses.map((c) => c.classId).join(',')])

  useEffect(() => {
    if (!data) return
    const draft = {}
    for (const cls of data.classes ?? []) {
      const assigned = new Set(
        (data.subjects ?? [])
          .filter((s) => s.classId === cls.classId)
          .map((s) => s.subjectId),
      )
      draft[cls.classId] = assigned
    }
    setSubjectDraft(draft)
  }, [data])

  const subjectName = (subjectId) =>
    allSubjects?.find((s) => s.id === subjectId)?.name || `Subject #${subjectId}`

  const openEdit = () => {
    if (!data) return
    setEditForm({
      fullName: data.fullName || '',
      phone: data.phone || '',
      isActive: data.isActive !== false,
    })
    setActionError(null)
    setEditOpen(true)
  }

  const handleEdit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setActionError(null)
    try {
      await teachersApi.update(teacherId, {
        fullName: editForm.fullName,
        phone: editForm.phone || undefined,
        isActive: editForm.isActive,
      })
      setEditOpen(false)
      setMsg('Teacher updated')
      reload()
    } catch (err) {
      setActionError(err?.message || 'Could not update teacher')
    } finally {
      setSaving(false)
    }
  }

  const runClassAction = async (fn, successMessage) => {
    setActionError(null)
    setMsg(null)
    setSaving(true)
    try {
      await fn()
      setClassId('')
      setMsg(successMessage)
      reload()
    } catch (err) {
      setActionError(err?.message || 'Action failed')
    } finally {
      setSaving(false)
    }
  }

  const assignOrReassign = async () => {
    const cid = Number(classId)
    if (currentClass) {
      await teachersApi.reassignClass(teacherId, cid)
      return
    }
    await teachersApi.assignClass(teacherId, cid)
  }

  const toggleSubject = (clsId, subjectId, checked) => {
    setSubjectDraft((prev) => {
      const next = new Set(prev[clsId] ?? [])
      if (checked) next.add(subjectId)
      else next.delete(subjectId)
      return { ...prev, [clsId]: next }
    })
  }

  const saveSubjectsForClass = async (clsId) => {
    setActionError(null)
    setMsg(null)
    setSaving(true)
    try {
      const desired = subjectDraft[clsId] ?? new Set()
      const current = new Set(
        (data.subjects ?? [])
          .filter((s) => s.classId === clsId)
          .map((s) => s.subjectId),
      )
      for (const subjectId of desired) {
        if (!current.has(subjectId)) {
          await teachersApi.assignSubject(teacherId, clsId, subjectId)
        }
      }
      for (const subjectId of current) {
        if (!desired.has(subjectId)) {
          await teachersApi.unassignSubject(teacherId, clsId, subjectId)
        }
      }
      setMsg('Subjects updated')
      reload()
    } catch (err) {
      setActionError(err?.message || 'Could not update subjects')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Loading label="Loading teacher profile…" />
  if (error) {
    return (
      <div>
        <PageHeader title="Teacher profile" />
        <Alert>{error}</Alert>
        <Button className="mt-3" variant="secondary" onClick={() => navigate('/admin/teachers')}>Back</Button>
      </div>
    )
  }

  const reassignToSameClass = Boolean(currentClass && classId && Number(classId) === currentClass.classId)

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title={data.fullName || 'Teacher'}
        subtitle="Teacher profile"
        actions={(
          <div className="flex flex-wrap gap-2">
            <Link to="/admin/teachers">
              <Button variant="secondary" size="sm"><ArrowLeft size={14} /> All teachers</Button>
            </Link>
            <Button size="sm" onClick={openEdit}>Edit teacher</Button>
          </div>
        )}
      />

      {actionError && <Alert>{actionError}</Alert>}
      {msg && <Alert tone="success">{msg}</Alert>}

      <Section title="Teacher information">
        <dl>
          <InfoRow label="Name" value={data.fullName} />
          <InfoRow label="Email" value={data.email} />
          <InfoRow label="Phone" value={data.phone} />
          <InfoRow label="Login status" value={data.loginActive === false ? 'Disabled' : 'Active'} />
          <InfoRow label="Active" value={data.isActive === false ? 'Inactive' : 'Active'} />
        </dl>
      </Section>

      <Section title="Classes">
        <div className="mb-4">
          {currentClass ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-100 bg-brand-50-50 px-4 py-3">
              <div>
                <p className="font-medium text-ink">{currentClass.className}</p>
                <p className="text-xs text-muted">
                  Assigned{currentClass.startDate ? ` · since ${currentClass.startDate}` : ''}
                </p>
              </div>
              <Button
                variant="danger"
                size="sm"
                disabled={saving}
                onClick={() => runClassAction(
                  () => teachersApi.unassignClass(teacherId),
                  'Teacher removed from class',
                )}
              >
                Unassign
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted">Not assigned to a class yet.</p>
          )}
        </div>
        <div className="max-w-md space-y-3 rounded-xl border border-brand-100 p-4">
          <h3 className="text-sm font-semibold text-ink">
            {currentClass ? 'Reassign class' : 'Assign class'}
          </h3>
          <p className="text-xs text-muted">Each teacher can only be assigned to one class at a time.</p>
          <ClassSelect value={classId} onChange={setClassId} classes={classes ?? []} />
          <Button
            disabled={!classId || saving || reassignToSameClass}
            onClick={() => runClassAction(
              assignOrReassign,
              currentClass ? 'Teacher reassigned' : 'Class assigned',
            )}
          >
            {saving ? 'Saving…' : currentClass ? 'Reassign to class' : 'Assign class'}
          </Button>
        </div>
      </Section>

      <Section title="Subjects">
        {!assignedClasses.length ? (
          <p className="text-sm text-muted">Assign a class first, then choose subjects from that class curriculum.</p>
        ) : (
          <div className="space-y-6">
            {assignedClasses.map((cls) => {
              const curriculum = curriculumByClass[cls.classId] ?? []
              const selected = subjectDraft[cls.classId] ?? new Set()
              return (
                <div key={cls.classId} className="rounded-xl border border-brand-100 p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-medium text-ink">{cls.className}</h3>
                    <Button
                      size="sm"
                      disabled={saving}
                      onClick={() => saveSubjectsForClass(cls.classId)}
                    >
                      Save subjects
                    </Button>
                  </div>
                  {curriculum.length === 0 ? (
                    <p className="text-sm text-muted">No subjects on this class curriculum yet.</p>
                  ) : (
                    <ul className="space-y-2">
                      {curriculum.map((row) => {
                        const sid = row.subjectId
                        const checked = selected.has(sid)
                        return (
                          <li key={sid} className="flex items-center gap-2 text-sm">
                            <input
                              id={`subj-${cls.classId}-${sid}`}
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => toggleSubject(cls.classId, sid, e.target.checked)}
                              className="rounded border-border"
                            />
                            <label htmlFor={`subj-${cls.classId}-${sid}`}>{subjectName(sid)}</label>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>
              )
            })}
            {(data.subjects ?? []).length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-semibold text-ink">Assigned subjects</h3>
                <Table>
                  <thead>
                    <tr>
                      <Th>Subject</Th>
                      <Th>Class</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.subjects.map((s) => (
                      <tr key={s.id} className="border-t border-border">
                        <Td>{s.subjectName}</Td>
                        <Td>{s.className}</Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </div>
        )}
      </Section>

      <Section title="Weekly timetable">
        {timetableLoading ? (
          <Loading />
        ) : timetableRows.length === 0 ? (
          <p className="text-sm text-muted">
            This teacher has not set a weekly timetable yet.
          </p>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Day</Th>
                <Th>Time</Th>
                <Th>Subject</Th>
                <Th>Class</Th>
                <Th>Room</Th>
              </tr>
            </thead>
            <tbody>
              {timetableRows.map((slot) => (
                <tr key={slot.id} className="border-t border-border">
                  <Td className="font-medium">{DAY_LABEL[slot.dayOfWeek] || slot.dayOfWeek}</Td>
                  <Td>{formatTime(slot.startTime)} – {formatTime(slot.endTime)}</Td>
                  <Td>{slot.subjectName || '—'}</Td>
                  <Td>{slot.className || `Class #${slot.classId}`}</Td>
                  <Td>{slot.room || '—'}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Section>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit teacher">
        <form onSubmit={handleEdit} className="space-y-3">
          {actionError && <Alert>{actionError}</Alert>}
          <Field label="Full name">
            <Input
              value={editForm?.fullName || ''}
              onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
              required
            />
          </Field>
          <Field label="Phone">
            <Input
              value={editForm?.phone || ''}
              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
            />
          </Field>
          <Field label="Status">
            <Select
              value={editForm?.isActive !== false ? 'true' : 'false'}
              onChange={(e) => setEditForm({ ...editForm, isActive: e.target.value === 'true' })}
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </Select>
          </Field>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}
