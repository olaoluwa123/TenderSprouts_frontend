import { useEffect, useState } from 'react'
import { parentsApi, gradesApi } from '@/api'
import { useAsync } from '@/hooks/useAsync'
import { useTerms, useActiveSession } from '@/hooks/useSchoolData'
import { TermSelect } from '@/components/ui/SchoolSelects'
import { Loading, PageHeader, Select, Table, Td, Th, Alert } from '@/components/ui'

function childLabel(child) {
  return `${child.firstName || ''} ${child.lastName || ''}`.trim() || child.admissionNumber || `Child #${child.id}`
}

export function ParentGradesPage() {
  const { data: me } = useAsync(() => parentsApi.me(), [])
  const children = me?.children ?? []
  const { data: session } = useActiveSession()
  const { data: terms } = useTerms(session?.id)
  const [studentId, setStudentId] = useState('')
  const [termId, setTermId] = useState('')

  useEffect(() => {
    if (children.length === 1 && !studentId) {
      setStudentId(String(children[0].id))
    }
  }, [children, studentId])

  const { data: grades, loading } = useAsync(
    () => studentId ? gradesApi.byStudent(Number(studentId), termId ? Number(termId) : undefined) : Promise.resolve([]),
    [studentId, termId],
  )

  const selected = children.find((c) => String(c.id) === String(studentId))

  return (
    <div>
      <PageHeader
        title="Results"
        subtitle="Detailed scores appear here after admin approves the teacher's term submission"
      />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {children.length > 1 ? (
          <Select value={studentId} onChange={(e) => setStudentId(e.target.value)} className="max-w-xs">
            <option value="">Select child</option>
            {children.map((c) => (
              <option key={c.id} value={c.id}>{childLabel(c)}</option>
            ))}
          </Select>
        ) : selected ? (
          <p className="text-sm font-medium text-ink">{childLabel(selected)}</p>
        ) : null}
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
