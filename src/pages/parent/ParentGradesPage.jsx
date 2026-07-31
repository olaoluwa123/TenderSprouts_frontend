import { useState } from 'react'
import { parentsApi, gradesApi } from '@/api'
import { useAsync } from '@/hooks/useAsync'
import { useTerms, useActiveSession } from '@/hooks/useSchoolData'
import { TermSelect } from '@/components/ui/SchoolSelects'
import { Loading, PageHeader, Select, Table, Td, Th, Alert } from '@/components/ui'

export function ParentGradesPage() {
  const { data: me } = useAsync(() => parentsApi.me(), [])
  const { data: session } = useActiveSession()
  const { data: terms } = useTerms(session?.id)
  const [studentId, setStudentId] = useState('')
  const [termId, setTermId] = useState('')
  const { data: grades, loading } = useAsync(
    () => studentId ? gradesApi.byStudent(Number(studentId), termId ? Number(termId) : undefined) : Promise.resolve([]),
    [studentId, termId],
  )

  return (
    <div>
      <PageHeader
        title="Grades"
        subtitle="Detailed scores appear here after admin approves the teacher's term submission"
      />
      <div className="mb-4 flex gap-3">
        <Select value={studentId} onChange={(e) => setStudentId(e.target.value)} className="max-w-xs">
          <option value="">Select child</option>
          {me?.children.map((c) => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
        </Select>
        <TermSelect value={termId} onChange={setTermId} terms={terms ?? []} className="max-w-xs" />
      </div>
      {studentId && !loading && (grades?.length ?? 0) === 0 && (
        <Alert tone="info">
          No approved grades yet for this child{termId ? ' and term' : ''}.
          Grades become visible after the teacher submits and admin approves term results.
          Check Report Cards for approved summaries.
        </Alert>
      )}
      {loading ? <Loading /> : (
        <Table>
          <thead><tr><Th>Subject</Th><Th>Type</Th><Th>Score</Th><Th>Remarks</Th></tr></thead>
          <tbody>
            {grades?.map((g) => (
              <tr key={g.id} className="border-t border-border">
                <Td>Subject #{g.subjectId}</Td><Td>{g.assessmentType}</Td>
                <Td>{g.score}/{g.maxScore}</Td><Td>{g.remarks || '—'}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  )
}
