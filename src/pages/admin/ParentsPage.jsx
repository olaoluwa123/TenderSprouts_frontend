import { useState } from 'react'
import { Link } from 'react-router-dom'
import { parentsApi, studentsApi } from '@/api'
import { useAsync } from '@/hooks/useAsync'
import { useAuth } from '@/hooks/useAuth'
import { useAssignedClasses, useClasses } from '@/hooks/useSchoolData'
import { ClassSelect } from '@/components/ui/SchoolSelects'
import { Alert, Badge, Button, Field, Input, Loading, Modal, PageHeader, Select, Table, Td, Th } from '@/components/ui'

const emptyParent = {
  email: '',
  password: '',
  fullName: '',
  phone: '',
}

export function ParentsPage({ readOnly = false }) {
  const { isTeacher } = useAuth()
  const [classId, setClassId] = useState('')
  const { classes: teacherClasses } = useAssignedClasses()
  const { data: allClasses } = useClasses()
  const classOptions = readOnly || isTeacher ? teacherClasses : (allClasses ?? [])
  const { data, loading, reload } = useAsync(
    () => parentsApi.list({
      size: 50,
      classId: classId ? Number(classId) : undefined,
    }),
    [classId],
  )
  const { data: students } = useAsync(
    () => readOnly ? Promise.resolve([]) : studentsApi.list({ size: 200 }).then((p) => p.content),
    [readOnly],
  )
  const [linkOpen, setLinkOpen] = useState(null)
  const [addOpen, setAddOpen] = useState(false)
  const [parentForm, setParentForm] = useState(emptyParent)
  const [studentId, setStudentId] = useState('')
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const linkingParent = data?.content?.find((p) => p.id === linkOpen)
  const alreadyLinkedToThisParent = new Set((linkingParent?.students ?? []).map((s) => s.id))

  const handleLink = async (e) => {
    e.preventDefault()
    if (!linkOpen) return
    setFormError(null)
    setSubmitting(true)
    try {
      await parentsApi.linkStudent(linkOpen, Number(studentId))
      setLinkOpen(null)
      setStudentId('')
      reload()
    } catch (err) {
      setFormError(err?.message || 'Failed to link pupil')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    setFormError(null)
    setSubmitting(true)
    try {
      await parentsApi.create({
        email: parentForm.email,
        password: parentForm.password,
        fullName: parentForm.fullName,
        phone: parentForm.phone || undefined,
      })
      setAddOpen(false)
      setParentForm(emptyParent)
      reload()
    } catch (err) {
      setFormError(err?.message || 'Failed to add parent')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Parents"
        subtitle="All parents"
        actions={!readOnly ? (
          <Button onClick={() => { setParentForm(emptyParent); setFormError(null); setAddOpen(true) }}>
            Add parent
          </Button>
        ) : undefined}
      />
      {!readOnly && (
        <Alert tone="info" className="mb-4">
          Parents can also be created when you add a pupil. Use this page to add a parent alone, open their profile, check login status, and link multiple pupils under one parent.
        </Alert>
      )}
      {readOnly && (
        <Alert tone="info" className="mb-4">
          Parents of pupils in your assigned classes.
        </Alert>
      )}
      <div className="mb-4 max-w-xs">
        <ClassSelect
          value={classId}
          onChange={setClassId}
          classes={classOptions}
        />
      </div>
      {loading ? <Loading /> : (
        <Table>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Phone</Th>
              <Th>Linked pupils</Th>
              <Th>Login status</Th>
              {(readOnly || isTeacher) && <Th>Children in your classes</Th>}
              {!readOnly && <Th>Actions</Th>}
            </tr>
          </thead>
          <tbody>
            {data?.content.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <Td>{p.fullName}</Td>
                <Td>{p.email}</Td>
                <Td>{p.phone || '—'}</Td>
                <Td className="tabular-nums">{p.students?.length ?? 0}</Td>
                <Td>
                  <Badge tone={p.loginActive === false ? 'danger' : 'success'}>
                    {p.loginActive === false ? 'Disabled' : 'Active'}
                  </Badge>
                </Td>
                {(readOnly || isTeacher) && (
                  <Td>
                    {p.students?.length
                      ? p.students.map((s) => `${s.firstName} ${s.lastName}`).join(', ')
                      : '—'}
                  </Td>
                )}
                {!readOnly && (
                  <Td>
                    <div className="flex flex-wrap gap-2">
                      <Link to={`/admin/parents/${p.id}`}>
                        <Button size="sm" variant="secondary">View</Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => { setLinkOpen(p.id); setFormError(null); setStudentId('') }}
                      >
                        Link pupil
                      </Button>
                    </div>
                  </Td>
                )}
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add parent">
        <form onSubmit={handleAdd} className="space-y-3">
          {formError && <Alert>{formError}</Alert>}
          <Field label="Full name">
            <Input value={parentForm.fullName} onChange={(e) => setParentForm({ ...parentForm, fullName: e.target.value })} required />
          </Field>
          <Field label="Email">
            <Input type="email" value={parentForm.email} onChange={(e) => setParentForm({ ...parentForm, email: e.target.value })} required />
          </Field>
          <Field label="Temporary password">
            <Input type="password" value={parentForm.password} onChange={(e) => setParentForm({ ...parentForm, password: e.target.value })} required minLength={8} />
          </Field>
          <Field label="Phone">
            <Input value={parentForm.phone} onChange={(e) => setParentForm({ ...parentForm, phone: e.target.value })} />
          </Field>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Saving…' : 'Add parent'}
          </Button>
        </form>
      </Modal>

      <Modal open={!!linkOpen} onClose={() => setLinkOpen(null)} title="Link parent to pupil">
        <form onSubmit={handleLink} className="space-y-3">
          {formError && <Alert>{formError}</Alert>}
          <Field label="Pupil">
            <Select value={studentId} onChange={(e) => setStudentId(e.target.value)} required>
              <option value="">Select pupil</option>
              {students?.map((s) => {
                const linkedHere = alreadyLinkedToThisParent.has(s.id)
                const status = linkedHere
                  ? 'already linked to this parent'
                  : s.linkedToParent
                    ? 'has parent'
                    : 'no parent yet'
                return (
                  <option key={s.id} value={s.id} disabled={linkedHere}>
                    {s.firstName} {s.lastName} ({s.admissionNumber}) — {status}
                  </option>
                )
              })}
            </Select>
          </Field>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Linking…' : 'Link pupil'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}
