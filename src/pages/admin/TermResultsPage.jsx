import { useEffect, useState } from 'react'
import { studentsApi, termResultsApi } from '@/api'
import { ReportCardDetail } from '@/components/ReportCardDetail'
import { useAsync } from '@/hooks/useAsync'
import { usePermissions } from '@/hooks/usePermissions'
import { useActiveSession, useActiveTerm, useAssignedClasses, useStudents } from '@/hooks/useSchoolData'
import { ClassSelect } from '@/components/ui/SchoolSelects'
import { Alert, Badge, Button, Card, Input, Loading, Modal, PageHeader, Table, Td, Th } from '@/components/ui'

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
  const { canComputeTermResults, canSubmitTermResults, canApproveTermResults } = usePermissions()
  const { classes } = useAssignedClasses()
  const { data: session, error: sessionError, loading: sessionLoading } = useActiveSession()
  const { data: activeTerm, error: activeTermError } = useActiveTerm()
  const [classId, setClassId] = useState('')
  const termId = activeTerm?.id ? String(activeTerm.id) : ''
  const sessionId = session?.id
  const { data: pendingSubmissions, reload: reloadPending } = useAsync(
    () => canApproveTermResults && sessionId
      ? termResultsApi.listSubmissions({ status: 'SUBMITTED', sessionId })
      : Promise.resolve([]),
    [canApproveTermResults, sessionId],
  )
  const { data: students } = useStudents(classId ? Number(classId) : undefined, sessionId)

  useEffect(() => {
    if (classes.length === 1 && !classId) {
      setClassId(String(classes[0].id))
    }
  }, [classes, classId])
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
  const [rowEdits, setRowEdits] = useState({})
  const [savingId, setSavingId] = useState(null)
  const [detailStudentId, setDetailStudentId] = useState(null)
  const { data: detailReport, loading: detailLoading, error: detailError } = useAsync(
    () => detailStudentId && termId
      ? studentsApi.reportCard(Number(detailStudentId), Number(termId))
      : Promise.resolve(null),
    [detailStudentId, termId],
  )

  useEffect(() => {
    const next = {}
    for (const row of data ?? []) {
      next[row.id] = {
        averageScore: row.averageScore ?? '',
        comments: row.comments ?? '',
      }
    }
    setRowEdits(next)
  }, [data])

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
      setError(sessionError || 'No active academic session. Activate a session before computing results.')
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

  const compute = () => runAction(
    () => termResultsApi.compute(Number(termId), Number(classId), sessionId),
    'Results computed from grades',
  )

  const submit = () => runAction(
    () => termResultsApi.submit(Number(termId), Number(classId), sessionId),
    'Submitted to admin for approval',
  )

  const approve = () => runAction(
    () => termResultsApi.approve(Number(termId), Number(classId)),
    'Approved — parents can now view and download report cards',
  )

  const saveRow = async (rowId) => {
    const edit = rowEdits[rowId]
    if (!edit) return
    setSavingId(rowId)
    setError(null)
    try {
      await termResultsApi.update(rowId, {
        averageScore: edit.averageScore !== '' ? Number(edit.averageScore) : null,
        comments: edit.comments || null,
      })
      setMsg('Result updated')
      refresh()
    } catch (err) {
      setError(err?.message || 'Failed to save result')
    } finally {
      setSavingId(null)
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
  const canCompute = canComputeTermResults && (!status || status === 'DRAFT')
  const canSubmit = canSubmitTermResults && status === 'DRAFT' && (data?.length ?? 0) > 0
  const canApprove = canApproveTermResults && status === 'SUBMITTED' && (data?.length ?? 0) > 0
  const canEditRows = canApproveTermResults && status === 'SUBMITTED'

  const reviewSubmission = (submissionClassId) => {
    setClassId(String(submissionClassId))
    setMsg(null)
    setError(null)
  }

  return (
    <div>
      <PageHeader
        title="Term Results"
        subtitle={
          canApproveTermResults
            ? 'Review submitted class results and approve for parents'
            : canSubmitTermResults
              ? 'Compute results from grades, then submit to admin'
              : 'Approved term results'
        }
      />
      <div className="mb-4 flex flex-wrap gap-3 items-end">
        <ClassSelect value={classId} onChange={setClassId} classes={classes} className="max-w-xs" />
        {activeTerm && <Badge tone="success">Current term: {activeTerm.name}</Badge>}
        {statusMeta && (
          <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
        )}
        {canCompute && (
          <Button variant="secondary" disabled={actionLoading || sessionLoading} onClick={compute}>
            {actionLoading ? 'Computing…' : 'Compute from grades'}
          </Button>
        )}
        {canSubmit && (
          <Button disabled={actionLoading} onClick={submit}>
            {actionLoading ? 'Submitting…' : 'Submit to admin'}
          </Button>
        )}
        {canApprove && (
          <Button disabled={actionLoading} onClick={approve}>
            {actionLoading ? 'Approving…' : 'Approve for parents'}
          </Button>
        )}
      </div>
      {sessionError && !sessionLoading && (
        <Alert tone="info" className="mb-4">
          No active academic session. Activate a session under Sessions before computing term results.
        </Alert>
      )}
      {!termId && (
        <Alert tone="info" className="mb-4">
          {activeTermError || 'No active term configured. An admin must activate a term under Sessions.'}
        </Alert>
      )}
      {error && <Alert className="mb-4">{error}</Alert>}
      {msg && <Alert tone="success" className="mb-4">{msg}</Alert>}
      {canApproveTermResults && (pendingSubmissions?.length ?? 0) > 0 && (
        <Card className="mb-4">
          <h3 className="font-semibold mb-2">Submitted for review</h3>
          <p className="text-sm text-muted mb-3">
            Teachers have submitted these class results. Select one to review student averages and approve for parents.
          </p>
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
              {pendingSubmissions.map((item) => (
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
        </Card>
      )}
      {canApproveTermResults && classId && status !== 'SUBMITTED' && (pendingSubmissions?.length ?? 0) > 0 && (
        <Alert tone="info" className="mb-4">
          Pick a class from <strong>Submitted for review</strong> above, or choose a class that has a pending submission.
        </Alert>
      )}
      {canSubmitTermResults && status === 'SUBMITTED' && (
        <Alert tone="info" className="mb-4">
          Submitted to admin. You will be notified when results are approved for parents.
        </Alert>
      )}
      {canApproveTermResults && status === 'SUBMITTED' && submission && (
        <Card className="mb-4">
          <h3 className="font-semibold mb-2">Review submission</h3>
          <p className="text-sm text-muted">
            {className ?? `Class #${classId}`} · {termName ?? `Term #${termId}`}
            {' · '}Submitted {formatDateTime(submission.submittedAt)}
          </p>
          <p className="text-sm text-muted mt-1">
            Open <strong>View full result</strong> on any student to see subject scores and grades before approving.
          </p>
        </Card>
      )}
      {loading ? <Loading /> : (
        <>
          {classId && termId && !data?.length && status !== 'SUBMITTED' && (
            <Alert tone="info" className="mb-4">
              No results yet. Compute from grades after entering scores for students enrolled in this class for the active session.
            </Alert>
          )}
          {classId && termId && !data?.length && status === 'SUBMITTED' && (
            <Alert tone="warning" className="mb-4">
              Submission received but no student results were found. Ask the teacher to compute results before submitting.
            </Alert>
          )}

          <Table>
            <thead>
              <tr>
                <Th>Student</Th>
                <Th>Average</Th>
                <Th>Rank</Th>
                <Th>Comments</Th>
                {canApproveTermResults && <Th>Full result</Th>}
                {canEditRows && <Th>Actions</Th>}
                <Th>Parent access</Th>
              </tr>
            </thead>
            <tbody>
              {data?.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <Td>{studentName(r.studentId)}</Td>
                  <Td>
                    {canEditRows ? (
                      <Input
                        type="number"
                        step="0.01"
                        className="max-w-[100px]"
                        value={rowEdits[r.id]?.averageScore ?? ''}
                        onChange={(e) => setRowEdits({
                          ...rowEdits,
                          [r.id]: { ...rowEdits[r.id], averageScore: e.target.value },
                        })}
                      />
                    ) : (r.averageScore ?? '—')}
                  </Td>
                  <Td>{r.rankInClass ?? '—'}</Td>
                  <Td>
                    {canEditRows ? (
                      <Input
                        value={rowEdits[r.id]?.comments ?? ''}
                        onChange={(e) => setRowEdits({
                          ...rowEdits,
                          [r.id]: { ...rowEdits[r.id], comments: e.target.value },
                        })}
                        placeholder="Comments"
                      />
                    ) : (r.comments || '—')}
                  </Td>
                  {canApproveTermResults && (
                    <Td>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setDetailStudentId(r.studentId)}
                      >
                        View full result
                      </Button>
                    </Td>
                  )}
                  {canEditRows && (
                    <Td>
                      <Button size="sm" variant="secondary" disabled={savingId === r.id} onClick={() => saveRow(r.id)}>
                        {savingId === r.id ? 'Saving…' : 'Save'}
                      </Button>
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
        </>
      )}
      <Modal
        open={detailStudentId != null}
        onClose={() => setDetailStudentId(null)}
        title="Full term result"
      >
        {detailLoading && <Loading />}
        {detailError && <Alert>{detailError}</Alert>}
        {!detailLoading && !detailError && <ReportCardDetail report={detailReport} />}
      </Modal>
    </div>
  )
}
