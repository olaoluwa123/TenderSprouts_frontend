import { useMemo, useState } from 'react'
import { parentsApi, studentsApi, termResultsApi } from '@/api'
import {
  ParentAssessmentReportDetail,
  ParentBehaviouralReportDetail,
  ParentPreschoolReportDetail,
} from '@/components/ParentPublishedReportDetail'
import { ReportCardDetail } from '@/components/ReportCardDetail'
import { useAsync } from '@/hooks/useAsync'
import { useSessions, useTerms } from '@/hooks/useSchoolData'
import { Button, EmptyState, Loading, PageHeader, Select } from '@/components/ui'

const KINDS = [
  { id: 'END_OF_TERM', label: 'End of term' },
  { id: 'WEEKLY_TEST', label: 'Weekly test' },
  { id: 'MIDTERM', label: 'Midterm' },
  { id: 'BEHAVIOURAL', label: 'Behavioural' },
  { id: 'PRESCHOOL', label: 'Preschool' },
]

function itemKey(item) {
  return [item.kind, item.termId, item.weekNumber ?? 0, item.periodType ?? ''].join('|')
}

function itemLabel(item) {
  const term = item.termName || `Term ${item.termId}`
  if (item.kind === 'WEEKLY_TEST') return `${term} · Week ${item.weekNumber}`
  if (item.kind === 'MIDTERM' || item.kind === 'PRESCHOOL') return term
  if (item.periodType === 'END_OF_TERM') return `${term} · End of term`
  return `${term} · Week ${item.weekNumber}`
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function ReportCardsPage() {
  const { data: me, loading: meLoading } = useAsync(() => parentsApi.me(), [])
  const { data: sessions } = useSessions()
  const children = me?.children ?? []
  const onlyChildId = children.length === 1 ? String(children[0].id) : ''
  const [selectedId, setSelectedId] = useState('')
  const [kind, setKind] = useState('END_OF_TERM')
  const [sessionId, setSessionId] = useState('')
  const [termId, setTermId] = useState('')
  const [publishedKey, setPublishedKey] = useState('')
  const studentId = onlyChildId || selectedId

  const { data: approvedResults, loading: resultsLoading } = useAsync(
    () => studentId
      ? termResultsApi.list({ studentId: Number(studentId), size: 100 }).then((p) => p.content)
      : Promise.resolve([]),
    [studentId],
  )

  const { data: publishedItems, loading: publishedLoading } = useAsync(
    () => studentId
      ? studentsApi.publishedReports(Number(studentId)).catch(() => [])
      : Promise.resolve([]),
    [studentId],
  )

  const publishedResults = useMemo(
    () => (approvedResults ?? []).filter((r) => r.publishedAt),
    [approvedResults],
  )

  const kindItems = useMemo(
    () => (publishedItems ?? []).filter((item) => item.kind === kind),
    [publishedItems, kind],
  )

  const selectedPublished = kindItems.find((item) => itemKey(item) === publishedKey) ?? null

  const sessionById = useMemo(() => {
    const map = new Map()
    for (const s of sessions ?? []) map.set(s.id, s)
    return map
  }, [sessions])

  const accessibleSessions = useMemo(() => {
    const ids = [...new Set(publishedResults.map((r) => r.sessionId).filter(Boolean))]
    return ids
      .map((id) => sessionById.get(id) ?? { id, name: `Session ${id}` })
      .sort((a, b) => String(b.name ?? '').localeCompare(String(a.name ?? '')))
  }, [publishedResults, sessionById])

  const { data: sessionTerms, loading: termsLoading } = useTerms(sessionId ? Number(sessionId) : null)

  const termsForSession = useMemo(() => {
    if (!sessionId) return []
    const allowedTermIds = new Set(
      publishedResults
        .filter((r) => String(r.sessionId) === String(sessionId))
        .map((r) => r.termId),
    )
    return (sessionTerms ?? [])
      .filter((t) => allowedTermIds.has(t.id))
      .sort((a, b) => String(a.name ?? '').localeCompare(String(b.name ?? '')))
  }, [sessionId, publishedResults, sessionTerms])

  const { data: report, loading, error } = useAsync(
    () => studentId && termId && kind === 'END_OF_TERM'
      ? studentsApi.reportCard(Number(studentId), Number(termId))
      : Promise.resolve(null),
    [studentId, termId, kind],
  )

  const { data: assessmentReport, loading: assessmentLoading, error: assessmentError } = useAsync(
    () => {
      if (!studentId || !selectedPublished || (kind !== 'WEEKLY_TEST' && kind !== 'MIDTERM')) {
        return Promise.resolve(null)
      }
      return studentsApi.publishedAssessment(Number(studentId), {
        type: kind,
        termId: selectedPublished.termId,
        weekNumber: kind === 'WEEKLY_TEST' ? selectedPublished.weekNumber : undefined,
      })
    },
    [studentId, kind, publishedKey],
  )

  const { data: behaviouralReport, loading: behaviouralLoading, error: behaviouralError } = useAsync(
    () => {
      if (!studentId || !selectedPublished || kind !== 'BEHAVIOURAL') {
        return Promise.resolve(null)
      }
      return studentsApi.publishedBehavioural(Number(studentId), {
        termId: selectedPublished.termId,
        periodType: selectedPublished.periodType,
        weekNumber: selectedPublished.periodType === 'WEEKLY' ? selectedPublished.weekNumber : undefined,
      })
    },
    [studentId, kind, publishedKey],
  )

  const { data: preschoolReport, loading: preschoolLoading, error: preschoolError } = useAsync(
    () => {
      if (!studentId || !selectedPublished || kind !== 'PRESCHOOL') {
        return Promise.resolve(null)
      }
      return studentsApi.publishedPreschool(Number(studentId), {
        termId: selectedPublished.termId,
      })
    },
    [studentId, kind, publishedKey],
  )

  const selectedChild = children.find((c) => String(c.id) === studentId)
  const childName = selectedChild
    ? `${selectedChild.firstName} ${selectedChild.lastName}`.trim()
    : null

  const waitingForResults = Boolean(studentId) && resultsLoading
  const hasAnyPublished = publishedResults.length > 0
  const needsSelection = Boolean(studentId) && hasAnyPublished && (!sessionId || !termId)

  const onChildChange = (value) => {
    setSelectedId(value)
    setSessionId('')
    setTermId('')
    setPublishedKey('')
  }

  const onKindChange = (value) => {
    setKind(value)
    setPublishedKey('')
  }

  const onSessionChange = (value) => {
    setSessionId(value)
    setTermId('')
  }

  const downloadPdf = async () => {
    if (!studentId) return
    if (kind === 'END_OF_TERM' && termId) {
      const blob = await studentsApi.reportCardPdf(Number(studentId), Number(termId))
      downloadBlob(blob, `report-card-${studentId}-${termId}.pdf`)
      return
    }
    if (!selectedPublished) return
    if (kind === 'PRESCHOOL') {
      const blob = await studentsApi.publishedPreschoolPdf(Number(studentId), {
        termId: selectedPublished.termId,
      })
      downloadBlob(blob, `preschool-${studentId}-term-${selectedPublished.termId}.pdf`)
      return
    }
    if (kind === 'WEEKLY_TEST' || kind === 'MIDTERM') {
      const blob = await studentsApi.publishedAssessmentPdf(Number(studentId), {
        type: kind,
        termId: selectedPublished.termId,
        weekNumber: kind === 'WEEKLY_TEST' ? selectedPublished.weekNumber : undefined,
      })
      const name = kind === 'MIDTERM'
        ? `midterm-${studentId}-term-${selectedPublished.termId}.pdf`
        : `weekly-test-${studentId}-week-${selectedPublished.weekNumber}.pdf`
      downloadBlob(blob, name)
      return
    }
    const blob = await studentsApi.publishedBehaviouralPdf(Number(studentId), {
      termId: selectedPublished.termId,
      periodType: selectedPublished.periodType,
      weekNumber: selectedPublished.periodType === 'WEEKLY' ? selectedPublished.weekNumber : undefined,
    })
    downloadBlob(
      blob,
      `behavioural-${studentId}-${selectedPublished.periodType.toLowerCase()}${
        selectedPublished.weekNumber ? `-week-${selectedPublished.weekNumber}` : ''
      }.pdf`,
    )
  }

  const canDownload = kind === 'END_OF_TERM'
    ? Boolean(report)
    : kind === 'BEHAVIOURAL'
      ? Boolean(behaviouralReport)
      : kind === 'PRESCHOOL'
        ? Boolean(preschoolReport)
        : Boolean(assessmentReport)

  if (meLoading) return <Loading />

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="View published reports for your children and download a PDF"
        actions={canDownload && <Button onClick={downloadPdf}>Download PDF</Button>}
      />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {children.length > 1 ? (
          <Select value={studentId} onChange={(e) => onChildChange(e.target.value)} className="max-w-xs">
            <option value="">Select child</option>
            {children.map((c) => (
              <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
            ))}
          </Select>
        ) : childName ? (
          <p className="text-sm font-medium text-ink">{childName}</p>
        ) : null}

        {studentId && (
          <Select value={kind} onChange={(e) => onKindChange(e.target.value)} className="max-w-xs">
            {KINDS.map((option) => (
              <option key={option.id} value={option.id}>{option.label}</option>
            ))}
          </Select>
        )}

        {studentId && kind === 'END_OF_TERM' && hasAnyPublished && (
          <>
            <Select
              value={sessionId}
              onChange={(e) => onSessionChange(e.target.value)}
              className="max-w-xs"
            >
              <option value="">Select session</option>
              {accessibleSessions.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Select>
            <Select
              value={termId}
              onChange={(e) => setTermId(e.target.value)}
              className="max-w-xs"
              disabled={!sessionId || termsLoading}
            >
              <option value="">{sessionId ? 'Select term' : 'Select session first'}</option>
              {termsForSession.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </Select>
          </>
        )}

        {studentId && kind !== 'END_OF_TERM' && kindItems.length > 0 && (
          <Select
            value={publishedKey}
            onChange={(e) => setPublishedKey(e.target.value)}
            className="max-w-xs"
          >
            <option value="">Select report</option>
            {kindItems.map((item) => (
              <option key={itemKey(item)} value={itemKey(item)}>{itemLabel(item)}</option>
            ))}
          </Select>
        )}
      </div>

      {!studentId ? (
        <EmptyState
          title="Select a child"
          description="Choose a child to see available reports."
        />
      ) : kind === 'END_OF_TERM' ? (
        waitingForResults ? (
          <Loading />
        ) : !hasAnyPublished ? (
          <EmptyState
            title="No report card yet"
            description={
              childName
                ? `${childName}'s report card will appear here once the school publishes term results.`
                : 'Report cards will appear here once the school publishes term results.'
            }
          />
        ) : needsSelection ? (
          <EmptyState
            title="Select session and term"
            description="Choose a session and term to open the report card. Past sessions stay available when results were published."
          />
        ) : studentId && termId && !loading && error ? (
          <EmptyState
            title="Report card unavailable"
            description="This term's report card could not be opened. Try another published term, or check back after the school republishes results."
          />
        ) : loading || (sessionId && termsLoading) ? (
          <Loading />
        ) : report ? (
          <ReportCardDetail report={report} />
        ) : null
      ) : publishedLoading ? (
        <Loading />
      ) : kindItems.length === 0 ? (
        <EmptyState
          title="No published report yet"
          description={
            childName
              ? `${childName}'s ${KINDS.find((k) => k.id === kind)?.label.toLowerCase() || 'report'} will appear here after the teacher publishes it.`
              : 'This report will appear here after the teacher publishes it.'
          }
        />
      ) : !selectedPublished ? (
        <EmptyState
          title="Select a report"
          description="Choose a published report to view it and download the PDF."
        />
      ) : kind === 'BEHAVIOURAL' ? (
        behaviouralLoading ? <Loading /> : behaviouralError ? (
          <EmptyState title="Report unavailable" description="This behavioural report could not be opened." />
        ) : (
          <ParentBehaviouralReportDetail report={behaviouralReport} />
        )
      ) : kind === 'PRESCHOOL' ? (
        preschoolLoading ? <Loading /> : preschoolError ? (
          <EmptyState title="Report unavailable" description="This preschool report could not be opened." />
        ) : (
          <ParentPreschoolReportDetail report={preschoolReport} />
        )
      ) : assessmentLoading ? (
        <Loading />
      ) : assessmentError ? (
        <EmptyState title="Report unavailable" description="This report could not be opened." />
      ) : (
        <ParentAssessmentReportDetail report={assessmentReport} />
      )}
    </div>
  )
}
