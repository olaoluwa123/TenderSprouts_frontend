import { useMemo, useState } from 'react'
import { feesApi } from '@/api'
import { useAsync } from '@/hooks/useAsync'
import { Alert, Badge, Button, Loading, PageHeader, Table, Td, Th } from '@/components/ui'

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
  const children = data?.children ?? []
  const totalOutstanding = Number(data?.totalOutstanding ?? 0)
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState(null)
  const [payMsg, setPayMsg] = useState(null)
  const [generatingId, setGeneratingId] = useState(null)

  const hasPendingFees = useMemo(
    () => children.some((child) => Number(child.outstandingAmount ?? 0) > 0),
    [children],
  )

  const payAllFees = async () => {
    setPaying(true)
    setPayError(null)
    setPayMsg(null)
    try {
      const init = await feesApi.initializePayment()
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
      setPayMsg('Payment successful. All outstanding fees have been marked as paid.')
      reload()
    } catch (err) {
      if (err?.message !== 'Payment window closed') {
        setPayError(err?.message || 'Payment failed')
      }
    } finally {
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
        subtitle="Published fees for your children"
        actions={hasPendingFees ? (
          <Button disabled={paying} onClick={payAllFees}>
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

      {loading ? <Loading /> : children.length === 0 ? (
        <p className="text-sm text-muted">No children linked to your account.</p>
      ) : (
        <div className="space-y-6">
          {hasPendingFees && (
            <section className="rounded-2xl border border-brand-200 bg-brand-50/60 p-5">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted">Total outstanding</p>
              <p className="mt-1 font-display text-3xl font-semibold tabular-nums text-ink">
                {money(totalOutstanding)}
              </p>
              <p className="mt-2 text-sm text-muted">
                Pay once to settle all published fees across your linked children.
              </p>
            </section>
          )}

          {children.map((child) => {
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
                      : 'No published fees for this child yet.'}
                  </p>
                ) : (
                  <Table>
                    <thead>
                      <tr>
                        <Th>Fee</Th>
                        <Th>Term</Th>
                        <Th>Amount</Th>
                        <Th>Due</Th>
                        <Th>Status</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {child.invoices.map((inv) => (
                        <tr key={inv.id} className="border-t border-border">
                          <Td className="font-medium">{inv.feeName}</Td>
                          <Td>{inv.termName || '—'}</Td>
                          <Td className="tabular-nums">{money(inv.amount)}</Td>
                          <Td>{inv.dueDate || '—'}</Td>
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
    </div>
  )
}
