import { useState } from 'react'
import { classesApi, subjectsApi, teachersApi } from '@/api'
import { useAsync } from '@/hooks/useAsync'
import { useClasses, useTeachers } from '@/hooks/useSchoolData'
import { ClassSelect, TeacherSelect } from '@/components/ui/SchoolSelects'
import { Alert, Badge, Button, Field, Input, Loading, Modal, PageHeader, Select, Table, Td, Th } from '@/components/ui'

export function SubjectsPage() {
  const { data, loading, error, reload } = useAsync(
    () => subjectsApi.list({ size: 100 }),
    [],
  )
  const { data: classes } = useClasses()
  const { data: teachers } = useTeachers()

  const [addOpen, setAddOpen] = useState(false)
  const [editSubject, setEditSubject] = useState(null)
  const [manageSubject, setManageSubject] = useState(null)
  const [profile, setProfile] = useState(null)
  const [name, setName] = useState('')
  const [editForm, setEditForm] = useState({ name: '', isActive: true })
  const [classId, setClassId] = useState('')
  const [teacherId, setTeacherId] = useState('')
  const [teacherClassId, setTeacherClassId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState(null)
  const [msg, setMsg] = useState(null)

  const openManage = async (subject) => {
    setManageSubject(subject)
    setFormError(null)
    setMsg(null)
    setClassId('')
    setTeacherId('')
    setTeacherClassId('')
    try {
      setProfile(await subjectsApi.get(subject.id))
    } catch (err) {
      setProfile(null)
      setFormError(err?.message || 'Could not load subject')
    }
  }

  const reloadProfile = async () => {
    if (!manageSubject) return
    setProfile(await subjectsApi.get(manageSubject.id))
    reload()
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setFormError(null)
    try {
      await subjectsApi.create(name.trim())
      setAddOpen(false)
      setName('')
      setMsg('Subject added')
      reload()
    } catch (err) {
      setFormError(err?.message || 'Could not add subject')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = async (e) => {
    e.preventDefault()
    if (!editSubject) return
    setSubmitting(true)
    setFormError(null)
    try {
      await subjectsApi.update(editSubject.id, {
        name: editForm.name.trim(),
        isActive: editForm.isActive,
      })
      setEditSubject(null)
      setMsg('Subject updated')
      reload()
    } catch (err) {
      setFormError(err?.message || 'Could not update subject')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRemove = async (subject) => {
    if (!window.confirm(`Deactivate subject “${subject.name}”?`)) return
    try {
      await subjectsApi.remove(subject.id)
      setMsg('Subject deactivated')
      reload()
    } catch (err) {
      setFormError(err?.message || 'Could not remove subject')
    }
  }

  const assignToClass = async () => {
    if (!manageSubject || !classId) return
    setSubmitting(true)
    setFormError(null)
    try {
      await classesApi.assignSubject(Number(classId), manageSubject.id)
      setClassId('')
      setMsg('Subject assigned to class')
      await reloadProfile()
    } catch (err) {
      setFormError(err?.message || 'Could not assign to class')
    } finally {
      setSubmitting(false)
    }
  }

  const unassignFromClass = async (cid) => {
    if (!manageSubject) return
    setSubmitting(true)
    setFormError(null)
    try {
      await classesApi.unassignSubject(cid, manageSubject.id)
      setMsg('Subject removed from class')
      await reloadProfile()
    } catch (err) {
      setFormError(err?.message || 'Could not unassign from class')
    } finally {
      setSubmitting(false)
    }
  }

  const assignToTeacher = async () => {
    if (!manageSubject || !teacherId || !teacherClassId) return
    setSubmitting(true)
    setFormError(null)
    try {
      await teachersApi.assignSubject(Number(teacherId), Number(teacherClassId), manageSubject.id)
      setTeacherId('')
      setMsg('Subject assigned to teacher')
      await reloadProfile()
    } catch (err) {
      setFormError(err?.message || 'Could not assign to teacher')
    } finally {
      setSubmitting(false)
    }
  }

  const unassignFromTeacher = async (tid, cid) => {
    if (!manageSubject) return
    setSubmitting(true)
    setFormError(null)
    try {
      await teachersApi.unassignSubject(tid, cid, manageSubject.id)
      setMsg('Subject unassigned from teacher')
      await reloadProfile()
    } catch (err) {
      setFormError(err?.message || 'Could not unassign from teacher')
    } finally {
      setSubmitting(false)
    }
  }

  const assignedClassIds = new Set((profile?.classes ?? []).map((c) => c.classId))
  const teachersForClass = (teachers ?? []).filter(
    (t) => t.classId && Number(t.classId) === Number(teacherClassId),
  )

  return (
    <div>
      <PageHeader
        title="Subjects"
        subtitle="Manage school subjects"
        actions={<Button onClick={() => { setAddOpen(true); setFormError(null) }}>Add subject</Button>}
      />
      {error && <Alert>{error}</Alert>}
      {formError && !manageSubject && !editSubject && !addOpen && <Alert>{formError}</Alert>}
      {msg && <div className="mb-4"><Alert tone="success">{msg}</Alert></div>}
      {loading ? <Loading /> : (
        <Table>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {(data?.content ?? []).map((s) => (
              <tr key={s.id} className="border-t border-border">
                <Td>{s.name}</Td>
                <Td>
                  <Badge tone={s.isActive === false ? 'danger' : 'success'}>
                    {s.isActive === false ? 'Inactive' : 'Active'}
                  </Badge>
                </Td>
                <Td>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="secondary" onClick={() => openManage(s)}>Manage</Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditSubject(s)
                        setEditForm({ name: s.name || '', isActive: s.isActive !== false })
                        setFormError(null)
                      }}
                    >
                      Edit
                    </Button>
                    {s.isActive !== false && (
                      <Button size="sm" variant="danger" onClick={() => handleRemove(s)}>Remove</Button>
                    )}
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add subject">
        <form onSubmit={handleCreate} className="space-y-3">
          {formError && <Alert>{formError}</Alert>}
          <Field label="Name">
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Button type="submit" disabled={submitting || !name.trim()}>
            {submitting ? 'Saving…' : 'Add subject'}
          </Button>
        </form>
      </Modal>

      <Modal open={Boolean(editSubject)} onClose={() => setEditSubject(null)} title="Edit subject">
        <form onSubmit={handleEdit} className="space-y-3">
          {formError && <Alert>{formError}</Alert>}
          <Field label="Name">
            <Input
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              required
            />
          </Field>
          <Field label="Status">
            <Select
              value={editForm.isActive ? 'true' : 'false'}
              onChange={(e) => setEditForm({ ...editForm, isActive: e.target.value === 'true' })}
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </Select>
          </Field>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save changes'}
          </Button>
        </form>
      </Modal>

      <Modal
        open={Boolean(manageSubject)}
        onClose={() => { setManageSubject(null); setProfile(null) }}
        title={manageSubject ? `Manage · ${manageSubject.name}` : 'Manage subject'}
      >
        <div className="space-y-6">
          {formError && <Alert>{formError}</Alert>}
          {!profile ? <Loading label="Loading…" /> : (
            <>
              <section className="space-y-3">
                <h3 className="font-semibold text-ink">Assign to classes</h3>
                <div className="flex flex-wrap items-end gap-2">
                  <div className="min-w-[12rem] flex-1">
                    <ClassSelect
                      value={classId}
                      onChange={setClassId}
                      classes={(classes ?? []).filter((c) => !assignedClassIds.has(c.id))}
                    />
                  </div>
                  <Button disabled={!classId || submitting} onClick={assignToClass}>Assign</Button>
                </div>
                {(profile.classes ?? []).length === 0 ? (
                  <p className="text-sm text-muted">Not assigned to any class yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {profile.classes.map((c) => (
                      <li key={c.classId} className="flex items-center justify-between gap-2 text-sm">
                        <span>{c.className}</span>
                        <Button size="sm" variant="danger" disabled={submitting} onClick={() => unassignFromClass(c.classId)}>
                          Unassign
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="space-y-3">
                <h3 className="font-semibold text-ink">Assign to teachers</h3>
                <p className="text-xs text-muted">
                  Choose a class that already has this subject, then a teacher assigned to that class.
                </p>
                <Field label="Class">
                  <ClassSelect
                    value={teacherClassId}
                    onChange={(v) => { setTeacherClassId(v); setTeacherId('') }}
                    classes={(classes ?? []).filter((c) => assignedClassIds.has(c.id))}
                  />
                </Field>
                <Field label="Teacher">
                  <TeacherSelect
                    value={teacherId}
                    onChange={setTeacherId}
                    teachers={teachersForClass}
                  />
                </Field>
                <Button disabled={!teacherId || !teacherClassId || submitting} onClick={assignToTeacher}>
                  Assign to teacher
                </Button>
                {(profile.teachers ?? []).length === 0 ? (
                  <p className="text-sm text-muted">No teachers assigned this subject yet.</p>
                ) : (
                  <Table>
                    <thead>
                      <tr>
                        <Th>Teacher</Th>
                        <Th>Class</Th>
                        <Th />
                      </tr>
                    </thead>
                    <tbody>
                      {profile.teachers.map((t) => (
                        <tr key={`${t.teacherId}-${t.classId}`} className="border-t border-border">
                          <Td>{t.teacherName}</Td>
                          <Td>{t.className}</Td>
                          <Td>
                            <Button
                              size="sm"
                              variant="danger"
                              disabled={submitting}
                              onClick={() => unassignFromTeacher(t.teacherId, t.classId)}
                            >
                              Unassign
                            </Button>
                          </Td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </section>
            </>
          )}
        </div>
      </Modal>
    </div>
  )
}
