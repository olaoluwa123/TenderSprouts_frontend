import { useState } from 'react'
import { classesApi, teachersApi } from '@/api'
import { useAuth } from '@/hooks/useAuth'
import { useAsync } from '@/hooks/useAsync'
import { ClassSelect } from '@/components/ui/SchoolSelects'
import { Alert, Field, Loading, PageHeader, Table, Td, Th } from '@/components/ui'

export function TeacherSubjectsPage() {
  const { user } = useAuth()
  const teacherId = user?.profileId
  const [classId, setClassId] = useState('')
  const { data: assignments, loading: assignmentsLoading, error: assignmentsError } = useAsync(
    () => (teacherId ? teachersApi.classes(teacherId) : Promise.resolve([])),
    [teacherId],
  )
  const classOptions = (assignments ?? []).map((row) => ({
    id: row.classId,
    name: row.className || `Class #${row.classId}`,
  }))
  const selectedClassId = classId || (assignments?.[0]?.classId ? String(assignments[0].classId) : '')
  const selectedClass = (assignments ?? []).find((row) => String(row.classId) === String(selectedClassId))
  const { data: subjects, loading: subjectsLoading, error: subjectsError } = useAsync(
    () => (selectedClassId ? classesApi.subjects(Number(selectedClassId)) : Promise.resolve([])),
    [selectedClassId],
  )

  const loading = assignmentsLoading || subjectsLoading
  const error = assignmentsError || subjectsError

  return (
    <div>
      <PageHeader
        title="Subjects"
        subtitle={selectedClass?.className
          ? `Subjects · ${selectedClass.className}`
          : 'Subjects assigned to your class'}
      />
      {!teacherId && <Alert>Teacher profile missing.</Alert>}
      {error && <Alert>{error}</Alert>}
      {classOptions.length > 1 && (
        <div className="mb-4 max-w-xs">
          <Field label="Class">
            <ClassSelect
              value={selectedClassId}
              onChange={setClassId}
              classes={classOptions}
              alwaysShow
            />
          </Field>
        </div>
      )}
      {loading ? <Loading /> : !selectedClassId ? (
        <p className="text-sm text-muted">You are not assigned to a class yet.</p>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Subject</Th>
              <Th>Class</Th>
            </tr>
          </thead>
          <tbody>
            {(subjects ?? []).length === 0 ? (
              <tr>
                <Td colSpan={2} className="text-muted">
                  No subjects assigned to your class yet. An admin can add them on the class profile.
                </Td>
              </tr>
            ) : (subjects ?? []).map((s) => (
              <tr key={s.subjectId} className="border-t border-border">
                <Td className="font-medium">{s.subjectName || `Subject #${s.subjectId}`}</Td>
                <Td>{selectedClass?.className || `Class #${selectedClassId}`}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  )
}
