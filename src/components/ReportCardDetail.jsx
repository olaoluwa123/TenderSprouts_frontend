import { Table, Td, Th } from '@/components/ui'

function assessmentScore(breakdown, type) {
  const row = breakdown?.find((sg) => sg.assessmentType === type)
  if (!row || row.score == null) return '—'
  return row.score
}

function rowsFromSubjectGrades(subjectGrades) {
  const bySubject = new Map()
  for (const sg of subjectGrades ?? []) {
    if (!bySubject.has(sg.subjectId)) {
      bySubject.set(sg.subjectId, {
        subjectId: sg.subjectId,
        subjectName: sg.subjectName,
        breakdown: [],
        subjectTotal: null,
        letterGrade: null,
      })
    }
    bySubject.get(sg.subjectId).breakdown.push(sg)
  }
  return [...bySubject.values()]
}

export function ReportCardDetail({ report }) {
  if (!report) return null

  const summaries = report.subjectSummaries?.length
    ? report.subjectSummaries
    : rowsFromSubjectGrades(report.subjectGrades)

  return (
    <div>
      <h3 className="text-xl font-bold">{report.studentName}</h3>
      <p className="text-muted">{report.className} · {report.termName} · {report.sessionName}</p>
      <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-muted">Average</p>
          <p className="font-bold text-lg">{report.averageScore ?? '—'}</p>
        </div>
        <div>
          <p className="text-muted">Overall grade</p>
          <p className="font-bold text-lg">{report.letterGrade ?? '—'}</p>
        </div>
        <div>
          <p className="text-muted">Rank</p>
          <p className="font-bold text-lg">{report.rankInClass ?? '—'}</p>
        </div>
      </div>
      {report.comments && <p className="mt-4 text-sm italic">{report.comments}</p>}
      <div className="mt-6 overflow-x-auto">
        <Table>
          <thead>
            <tr>
              <Th>Subject</Th>
              <Th>CA</Th>
              <Th>Exam</Th>
              <Th>Total</Th>
              <Th>Grade</Th>
            </tr>
          </thead>
          <tbody>
            {summaries.map((summary) => (
              <tr key={summary.subjectId} className="border-t border-border">
                <Td>{summary.subjectName}</Td>
                <Td>{assessmentScore(summary.breakdown, 'CA')}</Td>
                <Td>{assessmentScore(summary.breakdown, 'EXAM')}</Td>
                <Td>{summary.subjectTotal ?? '—'}</Td>
                <Td>{summary.letterGrade ?? '—'}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  )
}
