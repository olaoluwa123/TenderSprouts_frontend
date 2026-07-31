import { useState } from 'react'
import { parentsApi, studentsApi } from '@/api'
import { useAsync } from '@/hooks/useAsync'
import { useAuth } from '@/hooks/useAuth'
import { useAssignedClasses, useClasses } from '@/hooks/useSchoolData'
import { ClassSelect } from '@/components/ui/SchoolSelects'
import { Alert, Button, Field, Loading, Modal, PageHeader, Select, Table, Td, Th } from '@/components/ui'

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
    () => readOnly ? Promise.resolve([]) : studentsApi.list({ size: 100 }).then((p) => p.content),
    [readOnly],
  )
  const [linkOpen, setLinkOpen] = useState(null)
  const [studentId, setStudentId] = useState('')
  const [linkError, setLinkError] = useState(null)

  const handleLink = async (e) => {
    e.preventDefault()
    if (!linkOpen) return
    setLinkError(null)
    try {
      await parentsApi.linkStudent(linkOpen, Number(studentId))
      setLinkOpen(null)
      setStudentId('')
      reload()
    } catch (err) {
      setLinkError(err?.message || 'Failed to link student')
    }
  }

  return (
    <div>
      <PageHeader title="Parents" />
      {!readOnly && (
        <Alert className="mb-4">
          New parents are onboarded together with students on the Students page. Use this page to link an existing parent to another child.
        </Alert>
      )}
      {readOnly && (
        <Alert className="mb-4">
          Parents of students in your assigned classes.
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
                {(readOnly || isTeacher) && (
                  <Td>
                    {p.students?.length
                      ? p.students.map((s) => `${s.firstName} ${s.lastName}`).join(', ')
                      : '—'}
                  </Td>
                )}
                {!readOnly && (
                  <Td>
                    <Button size="sm" variant="secondary" onClick={() => { setLinkOpen(p.id); setLinkError(null) }}>
                      Link another child
                    </Button>
                  </Td>
                )}
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      <Modal open={!!linkOpen} onClose={() => setLinkOpen(null)} title="Link student to parent">
        <form onSubmit={handleLink} className="space-y-3">
          {linkError && <Alert>{linkError}</Alert>}
          <Field label="Student">
            <Select value={studentId} onChange={(e) => setStudentId(e.target.value)} required>
              <option value="">Select student</option>
              {students?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.firstName} {s.lastName} ({s.admissionNumber})
                </option>
              ))}
            </Select>
          </Field>
          <Button type="submit">Link</Button>
        </form>
      </Modal>
    </div>
  )
}
