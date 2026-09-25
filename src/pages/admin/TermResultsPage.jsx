import { useEffect, useState } from 'react'
import { Check, X } from 'lucide-react'
import { studentsApi, termResultsApi } from '@/api'
import { ReportCardDetail } from '@/components/ReportCardDetail'
import { useAsync } from '@/hooks/useAsync'
import { usePermissions } from '@/hooks/usePermissions'
import { useActiveSession, useActiveTerm, useAssignedClasses, useStudents } from '@/hooks/useSchoolData'
import { ClassSelect } from '@/components/ui/SchoolSelects'
import { Alert, Badge, Button, Card, Loading, Modal, PageHeader, Table, Td, Th } from '@/components/ui'

const submissionLabels = {
  DRAFT: { label: 'Draft', tone: undefined },
  SUBMITTED: { label: 'Awaiting admin approval', tone: 'warning' },
  PUBLISHED: { label: 'Approved for parents', tone: 'success' },
}

function formatDateTime(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}

export function TermResultsPage() {
  const { canSubmitTermResults, canApproveTermResults } = usePermissions()
  const { classes } = useAssignedClasses()
  const { data: session, error: sessionError, loading: sessionLoading } = useActiveSession()
  const { data: activeTerm, error: activeTermError } = useActiveTerm()
  const [classId, setClassId] = useState('')
  const termId = activeTerm?.id ? String(activeTerm.id) : ''
  const sessionId = session?.id
  const { data: pendingSubmissions, reload: reloadPending } = useAsync(
    () => canApproveTermResults
      ? termResultsApi.listSubmissions({ status: 'SUBMITTED', sessionId })
      : Promise.resolve([]),
    [canApproveTermResults, sessionId],
  )
  const { data: students } = useStudents(classId ? Number(classId) : undefined, sessionId)

  useEffect(() => {
    if (canApproveTermResults) return
    if (classes.length === 1 && !classId) {
      setClassId(String(classes[0].id))
    }
  }, [classes, classId, canApproveTermResults])

  const { data, loading, reload } = useAsync(
    () => classId && termId
      ? termResultsApi.list({ classId: Number(classId), termId: Number(termId), size: 100 }).then((p) => p.content)
      : Promise.resolve([]),
    [classId, termId],
  )
  const { data: submission, reload: reloadSubmission } = useAsync(
    () => classId && termId
      ? termResultsApi.submission(Number(classId), Number(termId)).catch((err) => {
        if (err?.status === 404) return null
        throw err
      })
      : Promise.resolve(null),
    [classId, termId],
  )
  const [msg, setMsg] = useState(null)
  const [error, setError] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [detailStudentId, setDetailStudentId] = useState(null)
  const [pdfLoading, setPdfLoading] = useState(false)
  const { data: detailReport, loading: detailLoading, error: detailError } = useAsync(
    () => detailStudentId && termId
      ? studentsApi.reportCard(Number(detailStudentId), Number(termId))
      : Promise.resolve(null),
    [detailStudentId, termId],
  )

  const refresh = () => {
    reload()
    reloadSubmission()
    reloadPending()
  }

  const runAction = async (fn, successMessage) => {
    setError(null)
    setMsg(null)
    if (!classId || !termId) {
      setError('Select a class first. An admin must also configure an active term under Sessions.')
      return
    }
    if (!sessionId) {
      setError(sessionError || 'No active academic session. Activate a session before submitting results.')
      return
    }
    setActionLoading(true)
    try {
      await fn()
      setMsg(successMessage)
      refresh()
    } catch (err) {
      setError(err?.message || 'Request failed')
    } finally {
      setActionLoading(false)
    }
  }

  const submit = () => runAction(
    () => termResultsApi.submit(Number(termId), Number(classId), sessionId),
    'Submitted to admin for review',
  )

  const approve = () => runAction(
    () => termResultsApi.approve(Number(termId), Number(classId)),
    'Approved — parents can now view and download report cards',
  )

  const reject = () => runAction(
    () => termResultsApi.reject(Number(termId), Number(classId)),
    'Sent back to teacher — results are draft again',
  )

  const downloadPdf = async (studentId) => {
    if (!studentId || !termId) return
    setPdfLoading(true)
    setError(null)
    try {
      const blob = await studentsApi.reportCardPdf(Number(studentId), Number(termId))
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `tender-sprouts-report-${studentName(studentId).replace(/\s+/g, '-')}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err?.message || 'Could not download report card')
    } finally {
      setPdfLoading(false)
    }
  }

  const studentName = (id) => {
    const s = students?.find((st) => st.id === id)
    return s ? `${s.firstName} ${s.lastName}` : String(id)
  }

  const className = classes?.find((c) => c.id === Number(classId))?.name
  const termName = activeTerm?.name
  const status = submission?.status
  const statusMeta = status ? submissionLabels[status] : null
  const canSubmit = canSubmitTermResults && (!status || status === 'DRAFT')
  const canApprove = canApproveTermResults && status === 'SUBMITTED' && classId
  const filteredPending = (pendingSubmissions ?? []).filter(
    (item) => !classId || String(item.classId) === classId,
  )

  const reviewSubmission = (submissionClassId) => {
    setClassId(String(submissionClassId))
    setMsg(null)
    setError(null)
  }

  const pageTitle = canApproveTermResults ? 'Review Results' : 'Results'
  const pageSubtitle = canApproveTermResults
    ? 'All submitted class results appear below — filter by class to narrow the list'
    : canSubmitTermResults
      ? 'Submit class results to admin after entering grades'
      : 'Approved results'

  return (
    <div>
      <PageHeader title={pageTitle} subtitle={pageSubtitle} />
      <div className="mb-4 flex flex-wrap gap-3 items-end">
        <ClassSelect
          value={classId}
          onChange={setClassId}
          classes={classes}
          className="max-w-xs"
          allowAll={canApproveTermResults}
          alwaysShow={canApproveTermResults}
        />
        {activeTerm && <Badge tone="success">Current term: {activeTerm.name}</Badge>}
        {classId && statusMeta && (
          <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
        )}
        {canSubmit && (
          <Button disabled={actionLoading || sessionLoading || !classId} onClick={submit}>
            {actionLoading ? 'Submitting…' : 'Submit to admin'}
          </Button>
        )}
      </div>
      {sessionError && !sessionLoading && (
        <Alert tone="info" className="mb-4">
          No active academic session. Activate a session under Sessions before submitting results.
        </Alert>
      )}
      {!termId && (
        <Alert tone="info" className="mb-4">
          {activeTermError || 'No active term configured. An admin must activate a term under Sessions.'}
        </Alert>
      )}
      {error && <Alert className="mb-4">{error}</Alert>}
      {msg && <Alert tone="success" className="mb-4">{msg}</Alert>}

      {canApproveTermResults && (
        <Card className="mb-4">
          <h3 className="font-semibold mb-2">Submitted for review</h3>
          <p className="text-sm text-muted mb-3">
            Teachers submit results here after entering grades. Review any class, or filter by class above.
          </p>
          {filteredPending.length === 0 ? (
            <p className="text-sm text-muted">No class results waiting for review{classId ? ' in this class' : ''}.</p>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Class</Th>
                  <Th>Term</Th>
                  <Th>Teacher</Th>
                  <Th>Students</Th>
                  <Th>Submitted</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {filteredPending.map((item) => (
                  <tr key={item.id} className="border-t border-border">
                    <Td>{item.className ?? `Class #${item.classId}`}</Td>
                    <Td>{item.termName ?? `Term #${item.termId}`}</Td>
                    <Td>{item.submittedByTeacherName ?? '—'}</Td>
                    <Td>{item.resultCount}</Td>
                    <Td>{formatDateTime(item.submittedAt)}</Td>
                    <Td>
                      <Button
                        size="sm"
                        variant={String(item.classId) === classId ? 'primary' : 'secondary'}
                        onClick={() => reviewSubmission(item.classId)}
                      >
                        {String(item.classId) === classId ? 'Reviewing' : 'Review'}
                      </Button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      )}

      {canSubmitTermResults && status === 'SUBMITTED' && (
        <Alert tone="info" className="mb-4">
          Submitted to admin. You will be notified when results are approved for parents.
        </Alert>
      )}
      {canApproveTermResults && status === 'SUBMITTED' && submission && classId && (
        <Card className="mb-4">
          <h3 className="font-semibold mb-2">Review submission</h3>
          <p className="text-sm text-muted">
            {className ?? `Class #${classId}`} · {termName ?? `Term #${termId}`}
            {' · '}Submitted {formatDateTime(submission.submittedAt)}
          </p>
          <p className="text-sm text-muted mt-1">
            Open <strong>View report</strong> on any student, then use the check to approve for parents or the X to send the class back to the teacher.
          </p>
        </Card>
      )}

      {!classId && canApproveTermResults ? (
        <p className="text-sm text-muted">Select a class above or click Review on a submission to see student results.</p>
      ) : loading ? <Loading /> : (
        <>
          {classId && termId && !data?.length && status !== 'SUBMITTED' && (
            <Alert tone="info" className="mb-4">
              No results yet. Results appear here after a teacher submits grades for this class.
            </Alert>
          )}
          {classId && termId && !data?.length && status === 'SUBMITTED' && (
            <Alert tone="warning" className="mb-4">
              Submission received but no student results were found. Ask the teacher to enter grades and submit again.
            </Alert>
          )}

          {classId && (
            <Table>
              <thead>
                <tr>
                  <Th>Student</Th>
                  <Th>Full result</Th>
                  {canApprove && <Th>Actions</Th>}
                  <Th>Parent access</Th>
                </tr>
              </thead>
              <tbody>
                {data?.map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <Td>{studentName(r.studentId)}</Td>
                    <Td>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setDetailStudentId(r.studentId)}
                        >
                          View report
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={pdfLoading}
                          onClick={() => downloadPdf(r.studentId)}
                        >
                          PDF
                        </Button>
                      </div>
                    </Td>
                    {canApprove && (
                      <Td>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="!px-2 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                            disabled={actionLoading}
                            title="Approve for parents"
                            aria-label="Approve for parents"
                            onClick={approve}
                          >
                            <Check size={18} strokeWidth={2.5} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="!px-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                            disabled={actionLoading}
                            title="Send back to teacher"
                            aria-label="Send back to teacher"
                            onClick={reject}
                          >
                            <X size={18} strokeWidth={2.5} />
                          </Button>
                        </div>
                      </Td>
                    )}
                    <Td>
                      {r.publishedAt
                        ? <Badge tone="success">Approved</Badge>
                        : <Badge>Pending approval</Badge>}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </>
      )}
      <Modal
        open={detailStudentId != null}
        onClose={() => setDetailStudentId(null)}
        title="End of term progress report"
        className="max-w-5xl"
        bodyClassName="p-2"
      >
        {detailLoading && <Loading />}
        {detailError && <Alert>{detailError}</Alert>}
        {!detailLoading && !detailError && <ReportCardDetail report={detailReport} />}
        {detailStudentId && (
          <div className="mt-3">
            <Button disabled={pdfLoading} onClick={() => downloadPdf(detailStudentId)}>
              {pdfLoading ? 'Preparing PDF…' : 'Download PDF'}
            </Button>
          </div>
        )}
      </Modal>
    </div>
  )
}
