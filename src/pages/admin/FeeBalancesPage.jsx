import { useEffect, useMemo, useState } from 'react'
import { feesApi, parentsApi } from '@/api'
import { useAsync } from '@/hooks/useAsync'
import { money, splitFeeBalances } from '@/lib/feeBalances'
import { useActiveSession, useActiveTerm, useClasses, useSessions, useTerms } from '@/hooks/useSchoolData'
import { FeeTabs } from '@/components/fees/FeeTabs'
import { ClassSelect, SessionSelect, TermSelect } from '@/components/ui/SchoolSelects'
import { Alert, Badge, Field, Loading, PageHeader, Table, Td, Th } from '@/components/ui'

function BalanceTable({ rows, emptyText, showOutstanding, showClass }) {
  const colSpan = 4 + (showOutstanding ? 1 : 0) + (showClass ? 1 : 0)
  return (
    <Table>
      <thead>
        <tr>
          <Th>Parent</Th>
          <Th>Phone</Th>
          {showClass && <Th>Class</Th>}
          <Th>Billed</Th>
          <Th>Paid</Th>
          {showOutstanding && <Th>Outstanding</Th>}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <Td colSpan={colSpan} className="text-muted">
              {emptyText}
            </Td>
          </tr>
        ) : rows.map((p) => (
          <tr key={p.parentId != null ? `p-${p.parentId}` : p.parentName} className="border-t border-border">
            <Td className="font-medium">{p.parentName}</Td>
            <Td>{p.phone}</Td>
            {showClass && <Td>{p.className || '—'}</Td>}
            <Td className="tabular-nums">{money(p.totalAmount)}</Td>
            <Td className="tabular-nums">{money(p.paidAmount)}</Td>
            {showOutstanding && (
              <Td className="tabular-nums font-medium text-brand-700">{money(p.outstandingAmount)}</Td>
            )}
          </tr>
        ))}
      </tbody>
    </Table>
  )
}

export function FeeBalancesPage({ mode = 'owing' }) {
  const { data: classes } = useClasses()
  const { data: activeSession } = useActiveSession()
  const { data: activeTerm } = useActiveTerm()
  const { data: sessions } = useSessions()

  const [classId, setClassId] = useState('')
  const [sessionId, setSessionId] = useState('')
  const [termId, setTermId] = useState('')

  const { data: terms } = useTerms(sessionId ? Number(sessionId) : undefined)

  useEffect(() => {
    if (!sessionId && activeSession?.id) {
      setSessionId(String(activeSession.id))
    }
  }, [sessionId, activeSession?.id])

  useEffect(() => {
    if (!sessionId || !terms) return
    const stillValid = termId && terms.some((t) => String(t.id) === String(termId))
    if (stillValid) return

    const activeTermInSession = String(sessionId) === String(activeSession?.id)
      && activeTerm?.id
      && terms.some((t) => String(t.id) === String(activeTerm.id))
    if (activeTermInSession) {
      setTermId(String(activeTerm.id))
      return
    }
    setTermId(terms[0] ? String(terms[0].id) : '')
  }, [sessionId, terms, termId, activeSession?.id, activeTerm?.id])

  const { data: invoices, loading, error } = useAsync(
    () => (termId
      ? feesApi.invoices({
        termId: Number(termId),
        classId: classId ? Number(classId) : undefined,
      }).catch(() => [])
      : Promise.resolve([])),
    [classId, termId],
  )

  // Resolve parent from linked parent–pupil records (same source as Parents admin pages)
  const { data: parents, loading: parentsLoading } = useAsync(
    () => parentsApi.list({ size: 500 }).then((page) => page.content).catch(() => []),
    [],
  )

  const parentByStudentId = useMemo(() => {
    const map = new Map()
    for (const parent of parents ?? []) {
      for (const student of parent.students ?? []) {
        const studentId = student?.id
        if (studentId == null || map.has(studentId)) continue
        map.set(studentId, {
          parentId: parent.id,
          parentName: parent.fullName || 'Parent',
          parentPhone: parent.phone || '—',
        })
      }
    }
    return map
  }, [parents])

  const enrichedInvoices = useMemo(() => {
    return (Array.isArray(invoices) ? invoices : []).map((inv) => {
      if (inv.parentId != null && inv.parentName) return inv
      const linked = parentByStudentId.get(inv.studentId)
        ?? parentByStudentId.get(Number(inv.studentId))
      if (!linked) return inv
      return {
        ...inv,
        parentId: inv.parentId ?? linked.parentId,
        parentName: inv.parentName || linked.parentName,
        parentPhone: inv.parentPhone || linked.parentPhone,
      }
    })
  }, [invoices, parentByStudentId])

  const { paidParents, owingParents } = splitFeeBalances(enrichedInvoices)
  const rows = mode === 'paid' ? paidParents : owingParents
  const title = mode === 'paid' ? 'Paid school fees' : 'Owing school fees'
  const subtitle = 'Shows the current session and term by default — filter by session, term, or class'
  const pageLoading = loading || parentsLoading

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        subtitle={subtitle}
      />

      <FeeTabs active={mode === 'paid' ? 'paid' : 'owing'} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Session">
          <SessionSelect
            value={sessionId}
            onChange={setSessionId}
            sessions={sessions ?? []}
          />
        </Field>
        <Field label="Term">
          <TermSelect value={termId} onChange={setTermId} terms={terms ?? []} />
        </Field>
        <Field label="Class">
          <ClassSelect
            value={classId}
            onChange={setClassId}
            classes={classes ?? []}
            alwaysShow
            allowAll
          />
        </Field>
        <div className="rounded-xl border border-brand-100 bg-white px-4 py-3">
          <p className="text-[11px] uppercase tracking-wide text-muted">Parents</p>
          <div className="mt-1 flex items-center gap-2">
            <p className="text-xl font-semibold tabular-nums text-ink">{rows.length}</p>
            <Badge tone={mode === 'paid' ? 'success' : 'warning'}>
              {mode === 'paid' ? 'Paid' : 'Owing'}
            </Badge>
          </div>
        </div>
      </div>

      {!sessionId ? (
        <p className="text-sm text-muted">Select a session to continue.</p>
      ) : !termId ? (
        <p className="text-sm text-muted">Select a term to continue.</p>
      ) : pageLoading ? (
        <Loading />
      ) : error ? (
        <Alert>{error}</Alert>
      ) : (
        <BalanceTable
          rows={rows}
          showClass={!classId}
          showOutstanding={mode === 'owing'}
          emptyText={
            mode === 'paid'
              ? 'No fully paid parents for this period yet.'
              : 'No parents owing for this period.'
          }
        />
      )}
    </div>
  )
}
