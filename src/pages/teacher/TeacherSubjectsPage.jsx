import { teachersApi } from '@/api'
import { useAuth } from '@/hooks/useAuth'
import { useAsync } from '@/hooks/useAsync'
import { Alert, Badge, Loading, PageHeader, Table, Td, Th } from '@/components/ui'

export function TeacherSubjectsPage() {
  const { user } = useAuth()
  const teacherId = user?.profileId
  const { data, loading, error } = useAsync(
    () => (teacherId ? teachersApi.listSubjects(teacherId) : Promise.resolve([])),
    [teacherId],
  )

  return (
    <div>
      <PageHeader title="Subjects" subtitle="Subjects assigned to you" />
      {!teacherId && <Alert>Teacher profile missing.</Alert>}
      {error && <Alert>{error}</Alert>}
      {loading ? <Loading /> : (
        <Table>
          <thead>
            <tr>
              <Th>Subject</Th>
              <Th>Class</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).length === 0 ? (
              <tr>
                <Td colSpan={3} className="text-muted">
                  No subjects assigned yet. An admin can assign subjects on your teacher profile.
                </Td>
              </tr>
            ) : (data ?? []).map((s) => (
              <tr key={s.id} className="border-t border-border">
                <Td className="font-medium">{s.subjectName || `Subject #${s.subjectId}`}</Td>
                <Td>{s.className || `Class #${s.classId}`}</Td>
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
