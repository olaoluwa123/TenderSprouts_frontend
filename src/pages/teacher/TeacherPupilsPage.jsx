import { useState } from 'react'
import { studentsApi, teachersApi } from '@/api'
import { useAuth } from '@/hooks/useAuth'
import { useAsync } from '@/hooks/useAsync'
import { ClassSelect } from '@/components/ui/SchoolSelects'
import { Alert, Badge, Field, Loading, PageHeader, Table, Td, Th } from '@/components/ui'

export function TeacherPupilsPage() {
  const { user } = useAuth()
  const teacherId = user?.profileId
  const [classId, setClassId] = useState('')
  const { data: assignments, loading: loadingClasses } = useAsync(
    () => (teacherId ? teachersApi.classes(teacherId) : Promise.resolve([])),
    [teacherId],
  )
  const classes = assignments ?? []
  const classOptions = classes.map((row) => ({
    id: row.classId,
    name: row.className || `Class #${row.classId}`,
  }))
  const effectiveClassId = classId || (classes[0]?.classId ? String(classes[0].classId) : '')
  const selectedClass = classes.find((row) => String(row.classId) === String(effectiveClassId))
  const className = selectedClass?.className || null

  const { data, loading, error } = useAsync(
    () => (effectiveClassId
      ? studentsApi.list({ classId: Number(effectiveClassId), size: 200 })
      : Promise.resolve({ content: [] })),
    [effectiveClassId],
  )

  return (
    <div>
      <PageHeader title="Pupils" subtitle={className ? `Roster · ${className}` : 'Pupils in your class'} />
      {!teacherId && <Alert>Teacher profile missing.</Alert>}
      {error && <Alert>{error}</Alert>}
      {classOptions.length > 1 && (
        <div className="mb-4 max-w-xs">
          <Field label="Class">
            <ClassSelect
              value={effectiveClassId}
              onChange={setClassId}
              classes={classOptions}
              alwaysShow
            />
          </Field>
        </div>
      )}
      {(loading || loadingClasses) ? <Loading /> : (
        <Table>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Admission #</Th>
              <Th>Gender</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {(data?.content ?? []).length === 0 ? (
              <tr><Td colSpan={4} className="text-muted">No pupils found for this class.</Td></tr>
            ) : (data?.content ?? []).map((s) => (
              <tr key={s.id} className="border-t border-border">
                <Td className="font-medium">{s.firstName} {s.lastName}</Td>
                <Td>{s.admissionNumber}</Td>
                <Td>{s.gender || '—'}</Td>
                <Td>
                  <Badge tone={s.isActive === false ? 'danger' : 'success'}>
                    {s.isActive === false ? 'Inactive' : 'Active'}
                  </Badge>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  )
}
