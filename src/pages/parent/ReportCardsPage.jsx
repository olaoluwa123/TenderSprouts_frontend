import { useEffect, useMemo, useState } from 'react'
import { parentsApi, studentsApi, termResultsApi } from '@/api'
import { ReportCardDetail } from '@/components/ReportCardDetail'
import { useAsync } from '@/hooks/useAsync'
import { useActiveSession, useTerms } from '@/hooks/useSchoolData'
import { Button, Card, EmptyState, Loading, PageHeader, Select } from '@/components/ui'

export function ReportCardsPage() {
  const { data: me, loading: meLoading } = useAsync(() => parentsApi.me(), [])
  const { data: session } = useActiveSession()
  const { data: terms } = useTerms(session?.id)
  const children = me?.children ?? []
  const onlyChildId = children.length === 1 ? String(children[0].id) : ''
  const [selectedId, setSelectedId] = useState('')
  const [termId, setTermId] = useState('')
  const studentId = onlyChildId || selectedId
  const { data: approvedResults, loading: resultsLoading } = useAsync(
    () => studentId
      ? termResultsApi.list({ studentId: Number(studentId), size: 100 }).then((p) => p.content)
      : Promise.resolve([]),
    [studentId],
  )
  const approvedTermIds = useMemo(
    () => new Set(
      (approvedResults ?? [])
        .filter((r) => r.publishedAt)
        .map((r) => r.termId),
    ),
    [approvedResults],
  )
  const approvedTerms = useMemo(
    () => (terms ?? []).filter((t) => approvedTermIds.has(t.id)),
    [terms, approvedTermIds],
  )

  useEffect(() => {
    if (!studentId) return
    if (approvedTerms.length === 0) {
      if (termId) setTermId('')
      return
    }
    if (!termId || !approvedTermIds.has(Number(termId))) {
      setTermId(String(approvedTerms[0].id))
    }
  }, [studentId, approvedTerms, approvedTermIds, termId])

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

  const selectedChild = children.find((c) => String(c.id) === studentId)
  const childName = selectedChild
    ? `${selectedChild.firstName} ${selectedChild.lastName}`.trim()
    : null
  const waitingForResults = Boolean(studentId) && (resultsLoading || terms == null)
  const hasReportCard = approvedTerms.length > 0 || Boolean(report)

  if (meLoading) return <Loading />

  return (
    <div>
      <PageHeader
        title="Report Cards"
        subtitle="View and download approved term results for your children"
        actions={report && <Button onClick={downloadPdf}>Download PDF</Button>}
      />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {children.length > 1 ? (
          <Select value={studentId} onChange={(e) => setSelectedId(e.target.value)} className="max-w-xs">
            <option value="">Select child</option>
            {children.map((c) => (
              <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
            ))}
          </Select>
        ) : childName ? (
          <p className="text-sm font-medium text-ink">{childName}</p>
        ) : null}
        {hasReportCard && (
          <Select
            value={termId}
            onChange={(e) => setTermId(e.target.value)}
            className="max-w-xs"
            disabled={!studentId}
          >
            {approvedTerms.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </Select>
        )}
      </div>
      {waitingForResults ? (
        <Loading />
      ) : !hasReportCard ? (
        <EmptyState
          title="No report card yet"
          description={
            childName
              ? `${childName}'s report card will appear here once the school publishes term results.`
              : 'Report cards will appear here once the school publishes term results.'
          }
        />
      ) : studentId && termId && !loading && error ? (
        <EmptyState
          title="Report card unavailable"
          description="This term's report card could not be opened. Try another published term, or check back after the school republishes results."
        />
      ) : loading ? (
        <Loading />
      ) : report ? (
        <Card>
          <ReportCardDetail report={report} />
        </Card>
      ) : null}
    </div>
  )
}
