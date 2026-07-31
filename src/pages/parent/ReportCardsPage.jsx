import { useEffect, useMemo, useState } from 'react'
import { parentsApi, studentsApi, termResultsApi } from '@/api'
import { ReportCardDetail } from '@/components/ReportCardDetail'
import { useAsync } from '@/hooks/useAsync'
import { useActiveSession, useTerms } from '@/hooks/useSchoolData'
import { Alert, Button, Card, Loading, PageHeader, Select } from '@/components/ui'

export function ReportCardsPage() {
  const { data: me } = useAsync(() => parentsApi.me(), [])
  const { data: session } = useActiveSession()
  const { data: terms } = useTerms(session?.id)
  const [studentId, setStudentId] = useState('')
  const [termId, setTermId] = useState('')
  const { data: approvedResults } = useAsync(
    () => studentId
      ? termResultsApi.list({ studentId: Number(studentId), size: 100 }).then((p) => p.content)
      : Promise.resolve([]),
    [studentId],
  )
  const approvedTermIds = useMemo(
    () => new Set((approvedResults ?? []).map((r) => r.termId)),
    [approvedResults],
  )
  const approvedTerms = useMemo(
    () => (terms ?? []).filter((t) => approvedTermIds.has(t.id)),
    [terms, approvedTermIds],
  )

  useEffect(() => {
    if (termId && approvedTermIds.size > 0 && !approvedTermIds.has(Number(termId))) {
      setTermId('')
    }
  }, [studentId, termId, approvedTermIds])

  const { data: report, loading, error } = useAsync(
    () => studentId && termId
      ? studentsApi.reportCard(Number(studentId), Number(termId))
      : Promise.resolve(null),
    [studentId, termId],
  )

  const downloadPdf = async () => {
    if (!studentId || !termId) return
    const blob = await studentsApi.reportCardPdf(Number(studentId), Number(termId))
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `report-card-${studentId}-${termId}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  const selectedChild = me?.children.find((c) => String(c.id) === studentId)

  return (
    <div>
      <PageHeader
        title="Report Cards"
        subtitle="View and download approved term results for your children"
        actions={report && <Button onClick={downloadPdf}>Download PDF</Button>}
      />
      <div className="mb-4 flex flex-wrap gap-3">
        <Select value={studentId} onChange={(e) => setStudentId(e.target.value)} className="max-w-xs">
          <option value="">Select child</option>
          {me?.children.map((c) => (
            <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
          ))}
        </Select>
        <Select
          value={termId}
          onChange={(e) => setTermId(e.target.value)}
          className="max-w-xs"
          disabled={!studentId}
        >
          <option value="">{studentId ? 'Select approved term' : 'Select a child first'}</option>
          {approvedTerms.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </Select>
      </div>
      {studentId && !loading && approvedTerms.length === 0 && (
        <Alert tone="info">
          No approved results for {selectedChild ? `${selectedChild.firstName} ${selectedChild.lastName}` : 'this child'} yet.
          Report cards will appear here after admin approval.
        </Alert>
      )}
      {studentId && termId && !loading && error && (
        <Alert tone="info">
          Results for this term are not available yet. They will appear here after admin approval.
        </Alert>
      )}
      {loading ? <Loading /> : report && (
        <Card>
          <ReportCardDetail report={report} />
        </Card>
      )}
    </div>
  )
}
