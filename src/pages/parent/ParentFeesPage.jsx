import { useMemo, useRef, useState } from 'react'
import { feesApi, sessionsApi } from '@/api'
import { useAsync } from '@/hooks/useAsync'
import { useActiveTerm, useSessions, useTerms } from '@/hooks/useSchoolData'
import {
  Alert,
  Badge,
  Button,
  EmptyState,
  Loading,
  PageHeader,
  Select,
  Table,
  Td,
  Th,
} from '@/components/ui'

function money(value) {
  const n = Number(value ?? 0)
  return n.toLocaleString(undefined, { style: 'currency', currency: 'NGN', minimumFractionDigits: 2 })
}

function loadPaystack() {
  if (typeof window === 'undefined') return Promise.reject(new Error('Paystack unavailable'))
  if (window.PaystackPop) return Promise.resolve(window.PaystackPop)
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-paystack]')
    if (existing) {
      existing.addEventListener('load', () => resolve(window.PaystackPop))
      existing.addEventListener('error', () => reject(new Error('Failed to load Paystack')))
      return
    }
    const script = document.createElement('script')
    script.src = 'https://js.paystack.co/v2/inline.js'
    script.async = true
    script.dataset.paystack = 'true'
    script.onload = () => resolve(window.PaystackPop)
    script.onerror = () => reject(new Error('Failed to load Paystack'))
    document.body.appendChild(script)
  })
}

export function ParentFeesPage() {
  const { data, loading, error, reload } = useAsync(() => feesApi.my(), [])
  const { data: sessions } = useSessions()
  const { data: activeTerm } = useActiveTerm()
  const children = data?.children ?? []
  const [sessionId, setSessionId] = useState('')
  const [termId, setTermId] = useState('')
  const [paying, setPaying] = useState(false)
  const payingRef = useRef(false)
  const [payError, setPayError] = useState(null)
  const [payMsg, setPayMsg] = useState(null)
  const [generatingId, setGeneratingId] = useState(null)

  const allInvoices = useMemo(
    () => children.flatMap((child) => child.invoices ?? []),
    [children],
  )

  const canGenerateAny = useMemo(
    () => children.some((child) => Boolean(child.canGenerateFees)),
    [children],
  )

  const sessionById = useMemo(() => {
    const map = new Map()
    for (const s of sessions ?? []) map.set(s.id, s)
    return map
  }, [sessions])

  // Map termId → session so fees work even when invoices omit sessionId
  const { data: termSessionRows, loading: catalogLoading } = useAsync(async () => {
    const list = sessions ?? []
    if (!list.length) return []
    const rows = await Promise.all(
      list.map(async (s) => {
        const terms = await sessionsApi.terms(s.id).catch(() => [])
        return (terms ?? []).map((t) => ({
          termId: t.id,
          sessionId: s.id,
          sessionName: s.name,
        }))
      }),
    )
    return rows.flat()
  }, [sessions])

  const sessionIdByTermId = useMemo(() => {
    const map = new Map()
    for (const row of termSessionRows ?? []) {
      if (row.termId != null) map.set(String(row.termId), row.sessionId)
    }
    return map
  }, [termSessionRows])

  const invoiceSessionId = (inv) => {
    if (inv?.sessionId != null) return inv.sessionId
    if (inv?.termId == null) return null
    return sessionIdByTermId.get(String(inv.termId)) ?? null
  }

  const accessibleSessions = useMemo(() => {
    const ids = new Set()
    for (const inv of allInvoices) {
      const sid = invoiceSessionId(inv)
      if (sid != null) ids.add(sid)
    }
    if (canGenerateAny && activeTerm?.sessionId) {
      ids.add(activeTerm.sessionId)
    }
    return [...ids]
      .map((id) => sessionById.get(id) ?? { id, name: `Session ${id}` })
      .sort((a, b) => String(b.name ?? '').localeCompare(String(a.name ?? '')))
  }, [allInvoices, canGenerateAny, activeTerm, sessionById, sessionIdByTermId])

  const { data: sessionTerms, loading: termsLoading } = useTerms(
    sessionId ? Number(sessionId) : null,
  )

  const termsForSession = useMemo(() => {
    if (!sessionId) return []
    const allowedTermIds = new Set(
      allInvoices
        .filter((inv) => String(invoiceSessionId(inv)) === String(sessionId))
        .map((inv) => inv.termId)
        .filter(Boolean),
    )
    if (
      canGenerateAny
      && activeTerm
      && String(activeTerm.sessionId) === String(sessionId)
    ) {
      allowedTermIds.add(activeTerm.id)
    }
    return (sessionTerms ?? [])
      .filter((t) => allowedTermIds.has(t.id))
      .sort((a, b) => String(a.name ?? '').localeCompare(String(b.name ?? '')))
  }, [sessionId, allInvoices, sessionTerms, canGenerateAny, activeTerm, sessionIdByTermId])

  const filteredChildren = useMemo(() => {
    if (!termId) return []
    return children.map((child) => {
      const invoices = (child.invoices ?? []).filter(
        (inv) => String(inv.termId) === String(termId),
      )
      const totalAmount = invoices.reduce((sum, inv) => sum + Number(inv.amount ?? 0), 0)
      const outstandingAmount = invoices
        .filter((inv) => inv.status === 'PENDING')
        .reduce((sum, inv) => sum + Number(inv.amount ?? 0), 0)
      const isActiveSelected =
        activeTerm && String(activeTerm.id) === String(termId)
      return {
        ...child,
        invoices,
        totalAmount,
        outstandingAmount,
        canGenerateFees: Boolean(child.canGenerateFees) && isActiveSelected,
        missingInvoiceCount: isActiveSelected ? Number(child.missingInvoiceCount ?? 0) : 0,
      }
    })
  }, [children, termId, activeTerm])

  const totalOutstanding = useMemo(
    () => filteredChildren.reduce((sum, child) => sum + Number(child.outstandingAmount ?? 0), 0),
    [filteredChildren],
  )

  const hasPendingFees = totalOutstanding > 0
  const hasAnyFeesAccess = allInvoices.length > 0 || canGenerateAny
  const needsSelection = hasAnyFeesAccess && (!sessionId || !termId)
  const waitingForSessions =
    hasAnyFeesAccess
    && accessibleSessions.length === 0
    && (catalogLoading || sessions == null)

  const onSessionChange = (value) => {
    setSessionId(value)
    setTermId('')
  }

  const paySelectedFees = async () => {
    if (!sessionId || !termId || payingRef.current) return
    payingRef.current = true
    setPaying(true)
    setPayError(null)
    setPayMsg(null)
    try {
      const init = await feesApi.initializePayment({
        sessionId: Number(sessionId),
        termId: Number(termId),
      })
      if (!init?.accessCode) throw new Error('Payment could not be started')
      const PaystackPop = await loadPaystack()
      if (!PaystackPop) throw new Error('Paystack popup failed to load')

      await new Promise((resolve, reject) => {
        const popup = new PaystackPop()
        popup.resumeTransaction(init.accessCode, {
          onSuccess: () => resolve(),
          onCancel: () => reject(new Error('Payment window closed')),
          onError: (err) => reject(new Error(err?.message || 'Payment failed')),
        })
      })

      await feesApi.verifyPayment(init.reference)
      setPayMsg('Payment successful. Outstanding fees for this term have been marked as paid.')
      reload()
    } catch (err) {
      if (err?.message !== 'Payment window closed') {
        setPayError(err?.message || 'Payment failed')
      }
    } finally {
      payingRef.current = false
      setPaying(false)
    }
  }

  const handleGenerateFees = async (child) => {
    setGeneratingId(child.studentId)
    setPayError(null)
    setPayMsg(null)
    try {
      const result = await feesApi.generateForStudent(child.studentId)
      const count = result?.invoicesCreated ?? 0
      setPayMsg(
        count > 0
          ? `Generated ${count} fee invoice(s) for ${child.studentName}.`
          : `No new invoices were needed for ${child.studentName}.`,
      )
      reload()
    } catch (err) {
      setPayError(err?.message || 'Could not generate fees')
    } finally {
      setGeneratingId(null)
    }
  }

  return (
    <div>
      <PageHeader
        title="School fees"
        subtitle="Select a session and term to view published fees for your children"
        actions={hasPendingFees ? (
          <Button disabled={paying} onClick={paySelectedFees}>
            {paying ? 'Paying…' : `Pay ${money(totalOutstanding)}`}
          </Button>
        ) : null}
      />

      {error && <Alert>{error}</Alert>}
      {payError && (
        <div className="mb-4">
          <Alert>{payError}</Alert>
        </div>
      )}
      {payMsg && (
        <div className="mb-4">
          <Alert tone="success">{payMsg}</Alert>
        </div>
      )}

      {loading || waitingForSessions ? (
        <Loading />
      ) : children.length === 0 ? (
        <p className="text-sm text-muted">No children linked to your account.</p>
      ) : (
        <>
          {hasAnyFeesAccess && (
            <div className="mb-4 flex flex-wrap items-center gap-3">
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
            </div>
          )}

          {!hasAnyFeesAccess ? (
            <EmptyState
              title="No school fees yet"
              description="Fees will appear here once the school publishes fee structures for your children’s classes."
            />
          ) : needsSelection ? (
            <EmptyState
              title="Select session and term"
              description="Choose a session and term to view fees. Past sessions stay available when invoices were issued."
            />
          ) : termsLoading ? (
            <Loading />
          ) : (
            <div className="space-y-6">
              {hasPendingFees && (
                <section className="rounded-2xl border border-brand-200 bg-brand-50/60 p-5">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
                    Outstanding this term
                  </p>
                  <p className="mt-1 font-display text-3xl font-semibold tabular-nums text-ink">
                    {money(totalOutstanding)}
                  </p>
                  <p className="mt-2 text-sm text-muted">
                    Pay once to settle published fees for the selected term across your linked children.
                  </p>
                </section>
              )}

              {filteredChildren.map((child) => {
                const canGenerate = Boolean(child.canGenerateFees)
                const missingCount = Number(child.missingInvoiceCount ?? 0)
                const invoiceCount = (child.invoices ?? []).length
                const generating = generatingId === child.studentId

                return (
                  <section
                    key={child.studentId}
                    className="rounded-2xl border border-blossom-200/80 bg-white p-5 shadow-sm shadow-blossom-500/5"
                  >
                    <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-brand-100 pb-3">
                      <div className="flex min-w-0 flex-wrap items-center gap-3">
                        <div>
                          <h2 className="font-display text-lg font-semibold text-ink">{child.studentName}</h2>
                          <p className="text-sm text-muted">
                            {child.admissionNumber}
                            {child.className ? ` · ${child.className}` : ''}
                          </p>
                        </div>
                        {canGenerate && (
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={generating}
                            onClick={() => handleGenerateFees(child)}
                          >
                            {generating
                              ? 'Generating…'
                              : missingCount > 0
                                ? `Generate fees (${missingCount})`
                                : 'Generate fees'}
                          </Button>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] uppercase tracking-wide text-muted">Outstanding</p>
                        <p className="text-xl font-semibold tabular-nums text-ink">
                          {money(child.outstandingAmount)}
                        </p>
                        <p className="text-xs text-muted">Total billed {money(child.totalAmount)}</p>
                      </div>
                    </div>

                    {invoiceCount === 0 ? (
                      <p className="text-sm text-muted">
                        {canGenerate
                          ? 'Class fees are published for this term. Generate fees to create invoices for this pupil.'
                          : 'No published fees for this child for the selected term.'}
                      </p>
                    ) : (
                      <Table>
                        <thead>
                          <tr>
                            <Th>Fee</Th>
                            <Th>Amount</Th>
                            <Th>Status</Th>
                          </tr>
                        </thead>
                        <tbody>
                          {child.invoices.map((inv) => (
                            <tr key={inv.id} className="border-t border-border">
                              <Td className="font-medium">{inv.feeName}</Td>
                              <Td className="tabular-nums">{money(inv.amount)}</Td>
                              <Td>
                                <Badge tone={inv.status === 'PAID' ? 'success' : 'warning'}>
                                  {inv.status}
                                </Badge>
                              </Td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    )}
                  </section>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
