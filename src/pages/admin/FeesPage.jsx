import { useEffect, useMemo, useState } from 'react'
import { feesApi } from '@/api'
import { useAsync } from '@/hooks/useAsync'
import { useActiveSession, useActiveTerm, useClasses, useTerms } from '@/hooks/useSchoolData'
import { ClassSelect } from '@/components/ui/SchoolSelects'
import { Alert, Badge, Button, Field, Input, Loading, Modal, PageHeader, Select, Table, Td, Textarea, Th } from '@/components/ui'

function money(value) {
  const n = Number(value ?? 0)
  return n.toLocaleString(undefined, { style: 'currency', currency: 'NGN', minimumFractionDigits: 2 })
}

const emptyTemplateRow = () => ({
  key: crypto.randomUUID?.() || String(Date.now() + Math.random()),
  name: '',
  defaultAmount: '',
  description: '',
  isActive: true,
})

const emptyExtraForm = {
  name: '',
  amount: '',
  description: '',
  dueDate: '',
}

export function FeesPage() {
  const { data: classes } = useClasses()
  const { data: activeSession } = useActiveSession()
  const { data: activeTerm } = useActiveTerm()
  const sessionId = activeSession?.id
  const { data: terms } = useTerms(sessionId)

  const [tab, setTab] = useState('template')
  const [classId, setClassId] = useState('')
  const [termId, setTermId] = useState('')
  const [msg, setMsg] = useState(null)

  const effectiveTermId = termId || (activeTerm?.id ? String(activeTerm.id) : '')

  // --- Template state ---
  const [templateRows, setTemplateRows] = useState([])
  const [templateLoading, setTemplateLoading] = useState(false)
  const [templateSaving, setTemplateSaving] = useState(false)
  const [templateError, setTemplateError] = useState(null)

  // --- Term fees state ---
  const [figureDraft, setFigureDraft] = useState({})
  const [figuresSaving, setFiguresSaving] = useState(false)
  const [extraOpen, setExtraOpen] = useState(false)
  const [extraForm, setExtraForm] = useState(emptyExtraForm)
  const [extraSubmitting, setExtraSubmitting] = useState(false)
  const [extraError, setExtraError] = useState(null)

  const {
    data: structures,
    loading: structuresLoading,
    error: structuresError,
    reload: reloadStructures,
  } = useAsync(
    () => {
      if (!classId || !effectiveTermId || tab === 'template') return Promise.resolve([])
      return feesApi.ensureFromTemplate(Number(classId), Number(effectiveTermId))
    },
    [classId, effectiveTermId, tab],
  )

  const items = Array.isArray(structures) ? structures : []
  const hasPublishedFees = items.some((item) => Boolean(item.publishedAt))

  const {
    data: republishPreview,
    reload: reloadRepublishPreview,
  } = useAsync(
    () => {
      if (!classId || !effectiveTermId || tab !== 'term' || !hasPublishedFees) {
        return Promise.resolve(null)
      }
      return feesApi.republishPreview(Number(classId), Number(effectiveTermId)).catch(() => null)
    },
    [classId, effectiveTermId, tab, hasPublishedFees, items.length],
  )

  const {
    data: invoices,
    loading: invoicesLoading,
    reload: reloadInvoices,
  } = useAsync(
    () => (classId && effectiveTermId && (tab === 'invoices' || tab === 'balances')
      ? feesApi.invoices(Number(classId), Number(effectiveTermId)).catch(() => [])
      : Promise.resolve([])),
    [classId, effectiveTermId, tab],
  )

  const invoiceRows = Array.isArray(invoices) ? invoices : []
  const pupilsMissingInvoices = republishPreview?.pupilsMissingInvoices ?? 0
  const republishPupilNames = (republishPreview?.pupils ?? [])
    .map((p) => p.studentName)
    .filter(Boolean)

  const { paidPupils, owingPupils } = useMemo(() => {
    const byStudent = new Map()
    for (const inv of invoiceRows) {
      if (inv.status === 'CANCELLED') continue
      const key = inv.studentId
      if (!byStudent.has(key)) {
        byStudent.set(key, {
          studentId: key,
          studentName: inv.studentName || `Pupil #${key}`,
          admissionNumber: inv.admissionNumber || '—',
          totalAmount: 0,
          paidAmount: 0,
          outstandingAmount: 0,
        })
      }
      const row = byStudent.get(key)
      const amount = Number(inv.amount || 0)
      row.totalAmount += amount
      if (inv.status === 'PAID') row.paidAmount += amount
      else if (inv.status === 'PENDING') row.outstandingAmount += amount
    }
    const all = [...byStudent.values()].sort((a, b) =>
      String(a.studentName).localeCompare(String(b.studentName)),
    )
    return {
      paidPupils: all.filter((p) => p.outstandingAmount <= 0 && p.totalAmount > 0),
      owingPupils: all.filter((p) => p.outstandingAmount > 0),
    }
  }, [invoiceRows])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      if (tab !== 'template') return
      setTemplateLoading(true)
      setTemplateError(null)
      try {
        const data = await feesApi.schoolTemplate()
        if (cancelled) return
        const rows = (data?.items ?? []).map((item) => ({
          key: String(item.id || crypto.randomUUID?.() || Math.random()),
          name: item.name || '',
          defaultAmount: item.defaultAmount != null ? String(item.defaultAmount) : '',
          description: item.description || '',
          isActive: item.isActive !== false,
        }))
        setTemplateRows(rows.length ? rows : [emptyTemplateRow()])
      } catch (err) {
        if (!cancelled) setTemplateError(err.message || 'Could not load template')
      } finally {
        if (!cancelled) setTemplateLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [tab])

  useEffect(() => {
    const next = {}
    for (const item of items) {
      next[item.id] = {
        amount: item.amount != null ? String(item.amount) : '',
        dueDate: item.dueDate || '',
      }
    }
    setFigureDraft(next)
  }, [items])

  const totalAmount = useMemo(
    () => items.filter((i) => i.isActive !== false).reduce((sum, i) => {
      const draft = figureDraft[i.id]
      const amount = draft?.amount != null && draft.amount !== '' ? Number(draft.amount) : Number(i.amount || 0)
      return sum + (Number.isFinite(amount) ? amount : 0)
    }, 0),
    [items, figureDraft],
  )

  const saveTemplate = async () => {
    setTemplateSaving(true)
    setTemplateError(null)
    try {
      const cleaned = templateRows
        .map((row, index) => ({
          name: row.name.trim(),
          defaultAmount: Number(row.defaultAmount),
          description: row.description.trim() || undefined,
          sortOrder: index,
          isActive: row.isActive !== false,
        }))
        .filter((row) => row.name)
      if (cleaned.some((row) => !Number.isFinite(row.defaultAmount) || row.defaultAmount < 0)) {
        throw new Error('Each template item needs a valid default amount')
      }
      const result = await feesApi.saveSchoolTemplate({ items: cleaned })
      setMsg(
        `School fee template saved for every class`
        + (result?.classesSynced != null ? ` (${result.classesSynced} classes updated).` : '.'),
      )
    } catch (err) {
      setTemplateError(err.message || 'Could not save template')
    } finally {
      setTemplateSaving(false)
    }
  }

  const saveFigures = async () => {
    if (!items.length) return
    setFiguresSaving(true)
    try {
      const payload = items
        .filter((item) => !item.publishedAt)
        .map((item) => ({
          id: item.id,
          amount: Number(figureDraft[item.id]?.amount),
          dueDate: figureDraft[item.id]?.dueDate || undefined,
        }))
      if (!payload.length) {
        setMsg('Published fees cannot have amounts changed. Due dates below are locked for published items in batch save.')
        return
      }
      if (payload.some((row) => !Number.isFinite(row.amount) || row.amount < 0.01)) {
        throw new Error('Enter a valid amount for every draft fee item')
      }
      // Also update due dates on published via individual patch if needed — plan allows due date update
      await feesApi.batchAmounts(payload)
      for (const item of items.filter((i) => i.publishedAt)) {
        const due = figureDraft[item.id]?.dueDate || null
        if ((due || '') !== (item.dueDate || '')) {
          await feesApi.updateStructure(item.id, { dueDate: due || undefined })
        }
      }
      setMsg('Fee figures saved.')
      reloadStructures()
    } catch (err) {
      setMsg(err.message || 'Could not save figures')
    } finally {
      setFiguresSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!window.confirm('Publish these fees to parents of pupils in this class?')) return
    try {
      // Save draft figures first
      const draftItems = items.filter((item) => !item.publishedAt)
      if (draftItems.length) {
        await feesApi.batchAmounts(draftItems.map((item) => ({
          id: item.id,
          amount: Number(figureDraft[item.id]?.amount ?? item.amount),
          dueDate: figureDraft[item.id]?.dueDate || undefined,
        })))
      }
      const result = await feesApi.publish(Number(classId), Number(effectiveTermId))
      setMsg(
        `Published to parents — ${result.invoicesCreated} invoice(s) created`
        + (result.structuresPublished ? `, ${result.structuresPublished} new line item(s) published` : ''),
      )
      reloadStructures()
      reloadInvoices()
      reloadRepublishPreview()
      setTab('invoices')
    } catch (err) {
      setMsg(err.message || 'Could not publish fees')
    }
  }

  const handleRepublish = async () => {
    const count = pupilsMissingInvoices
    const namesHint = republishPupilNames.length
      ? `\n\nPupils: ${republishPupilNames.slice(0, 5).join(', ')}${republishPupilNames.length > 5 ? '…' : ''}`
      : ''
    const confirmText = count > 0
      ? `Create invoices for ${count} pupil(s) added after fees were published? This uses published fee amounts only and does not publish draft items.${namesHint}`
      : 'No pupils are missing invoices for published fees in this class and term.'
    if (!window.confirm(confirmText)) return
    if (count === 0) return
    try {
      const result = await feesApi.republish(Number(classId), Number(effectiveTermId))
      setMsg(
        `Republished fees — ${result.invoicesCreated} invoice(s) created for ${result.pupilsInvoiced} pupil(s)`,
      )
      reloadStructures()
      reloadInvoices()
      reloadRepublishPreview()
      setTab('invoices')
    } catch (err) {
      setMsg(err.message || 'Could not republish fees')
    }
  }

  const handleAddExtra = async (e) => {
    e.preventDefault()
    setExtraSubmitting(true)
    setExtraError(null)
    try {
      await feesApi.createStructure({
        name: extraForm.name.trim(),
        amount: Number(extraForm.amount),
        description: extraForm.description.trim() || undefined,
        dueDate: extraForm.dueDate || undefined,
        classId: Number(classId),
        termId: Number(effectiveTermId),
      })
      setExtraOpen(false)
      setExtraForm(emptyExtraForm)
      setMsg('One-off fee item added for this term.')
      reloadStructures()
    } catch (err) {
      setExtraError(err.message || 'Could not add fee item')
    } finally {
      setExtraSubmitting(false)
    }
  }

  const handleMarkPaid = async (invoice) => {
    try {
      await feesApi.markPaid(invoice.id)
      setMsg(`Marked paid: ${invoice.studentName} · ${invoice.feeName}`)
      reloadInvoices()
    } catch (err) {
      setMsg(err.message || 'Could not mark paid')
    }
  }

  const tabs = [
    { id: 'template', label: 'Template' },
    { id: 'term', label: 'Term fees' },
    { id: 'invoices', label: 'Invoices' },
    { id: 'balances', label: 'Paid / Owing' },
  ]

  return (
    <div>
      <PageHeader
        title="School fees"
        subtitle="One fee template for every class — change figures per class each term"
        actions={tab === 'term' ? (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              disabled={!classId || !effectiveTermId || !items.length || figuresSaving}
              onClick={saveFigures}
            >
              {figuresSaving ? 'Saving…' : 'Save figures'}
            </Button>
            <Button
              variant="secondary"
              disabled={!classId || !effectiveTermId || !items.length}
              onClick={handlePublish}
            >
              Publish to parents
            </Button>
            <Button
              variant="secondary"
              disabled={!classId || !effectiveTermId || !hasPublishedFees || pupilsMissingInvoices === 0}
              onClick={handleRepublish}
            >
              {pupilsMissingInvoices > 0
                ? `Republish for new pupils (${pupilsMissingInvoices})`
                : 'Republish for new pupils'}
            </Button>
            <Button
              disabled={!classId || !effectiveTermId}
              onClick={() => { setExtraOpen(true); setExtraError(null); setExtraForm(emptyExtraForm) }}
            >
              Add one-off item
            </Button>
          </div>
        ) : tab === 'template' ? (
          <Button disabled={templateSaving} onClick={saveTemplate}>
            {templateSaving ? 'Saving…' : 'Save template for all classes'}
          </Button>
        ) : null}
      />

      <div className="mb-4 flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
              tab === t.id ? 'bg-blossom-100 text-blossom-700' : 'bg-white text-muted hover:bg-blossom-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className={`mb-4 grid gap-3 ${tab === 'template' ? '' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
        {tab !== 'template' && (
          <Field label="Class">
            <ClassSelect value={classId} onChange={setClassId} classes={classes ?? []} />
          </Field>
        )}
        {tab !== 'template' && (
          <Field label="Term">
            <Select value={effectiveTermId} onChange={(e) => setTermId(e.target.value)}>
              <option value="">Select term</option>
              {(terms ?? []).map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </Select>
          </Field>
        )}
        {tab === 'term' && (
          <div className="rounded-xl border border-brand-100 bg-white px-4 py-3">
            <p className="text-[11px] uppercase tracking-wide text-muted">Class total</p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-ink">{money(totalAmount)}</p>
          </div>
        )}
      </div>

      {msg && (
        <div className="mb-4">
          <Alert tone="success">{msg}</Alert>
        </div>
      )}

      {tab === 'template' ? (
        <>
          {templateError && <Alert>{templateError}</Alert>}
          {templateLoading ? <Loading /> : (
            <div className="space-y-3">
              <p className="text-sm text-muted">
                Define fee line items once (Tuition, PTA, Books, …). Saving applies this template to every class.
                On Term fees you pick a class and only change the figures.
              </p>
              <Table>
                <thead>
                  <tr>
                    <Th>Fee item</Th>
                    <Th>Default amount</Th>
                    <Th>Description</Th>
                    <Th />
                  </tr>
                </thead>
                <tbody>
                  {templateRows.map((row) => (
                    <tr key={row.key} className="border-t border-border">
                      <Td>
                        <Input
                          value={row.name}
                          onChange={(e) => setTemplateRows((prev) => prev.map((r) => (
                            r.key === row.key ? { ...r, name: e.target.value } : r
                          )))}
                          placeholder="e.g. Tuition"
                        />
                      </Td>
                      <Td>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={row.defaultAmount}
                          onChange={(e) => setTemplateRows((prev) => prev.map((r) => (
                            r.key === row.key ? { ...r, defaultAmount: e.target.value } : r
                          )))}
                        />
                      </Td>
                      <Td>
                        <Input
                          value={row.description}
                          onChange={(e) => setTemplateRows((prev) => prev.map((r) => (
                            r.key === row.key ? { ...r, description: e.target.value } : r
                          )))}
                          placeholder="Optional"
                        />
                      </Td>
                      <Td>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setTemplateRows((prev) => (
                            prev.length <= 1 ? [emptyTemplateRow()] : prev.filter((r) => r.key !== row.key)
                          ))}
                        >
                          Remove
                        </Button>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <Button
                variant="secondary"
                onClick={() => setTemplateRows((prev) => [...prev, emptyTemplateRow()])}
              >
                Add line item
              </Button>
            </div>
          )}
        </>
      ) : !classId ? (
        <p className="text-sm text-muted">Select a class to continue.</p>
      ) : tab === 'term' ? (
        !effectiveTermId ? (
          <p className="text-sm text-muted">Select a term to set figures.</p>
        ) : (
          <>
            {structuresError && <Alert>{structuresError}</Alert>}
            {structuresLoading ? <Loading /> : items.length === 0 ? (
              <div className="rounded-2xl border border-blossom-200/80 bg-white p-5">
                <p className="text-sm text-muted">
                  No fee items yet. Save the school template first (Template tab), then return here — items load for this class so you can edit figures.
                </p>
              </div>
            ) : (
              <>
                {hasPublishedFees && pupilsMissingInvoices > 0 && (
                  <p className="mb-3 text-sm text-muted">
                    {pupilsMissingInvoices} pupil{pupilsMissingInvoices === 1 ? '' : 's'} in this class
                    {' '}still need published fee invoices: {republishPupilNames.slice(0, 3).join(', ')}
                    {republishPupilNames.length > 3 ? ` and ${republishPupilNames.length - 3} more` : ''}.
                    Use Republish for new pupils to create them.
                  </p>
                )}
                <Table>
                <thead>
                  <tr>
                    <Th>Item</Th>
                    <Th>Amount</Th>
                    <Th>Due date</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const published = Boolean(item.publishedAt)
                    const draft = figureDraft[item.id] || { amount: '', dueDate: '' }
                    return (
                      <tr key={item.id} className="border-t border-border">
                        <Td>
                          <p className="font-medium text-ink">{item.name}</p>
                          {item.description && <p className="text-xs text-muted">{item.description}</p>}
                        </Td>
                        <Td>
                          <Input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={draft.amount}
                            disabled={published}
                            onChange={(e) => setFigureDraft((prev) => ({
                              ...prev,
                              [item.id]: { ...draft, amount: e.target.value },
                            }))}
                          />
                          {published && (
                            <p className="mt-1 text-[11px] text-muted">Locked after publish</p>
                          )}
                        </Td>
                        <Td>
                          <Input
                            type="date"
                            value={draft.dueDate}
                            onChange={(e) => setFigureDraft((prev) => ({
                              ...prev,
                              [item.id]: { ...draft, dueDate: e.target.value },
                            }))}
                          />
                        </Td>
                        <Td>
                          <Badge tone={published ? 'success' : 'warning'}>
                            {published ? 'Published' : 'Draft'}
                          </Badge>
                        </Td>
                      </tr>
                    )
                  })}
                </tbody>
              </Table>
              </>
            )}
          </>
        )
      ) : !effectiveTermId ? (
        <p className="text-sm text-muted">
          Select a term to view {tab === 'balances' ? 'balances' : 'invoices'}.
        </p>
      ) : tab === 'balances' ? (
        invoicesLoading ? <Loading /> : (
          <div className="space-y-8">
            <section>
              <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-ink">Pupils owing</h3>
                  <p className="text-xs text-muted">Any unpaid published fee for this class and term</p>
                </div>
                <Badge tone="warning">{owingPupils.length}</Badge>
              </div>
              <Table>
                <thead>
                  <tr>
                    <Th>Pupil</Th>
                    <Th>Admission #</Th>
                    <Th>Billed</Th>
                    <Th>Paid</Th>
                    <Th>Outstanding</Th>
                  </tr>
                </thead>
                <tbody>
                  {owingPupils.length === 0 ? (
                    <tr>
                      <Td colSpan={5} className="text-muted">
                        No pupils owing for this class and term.
                      </Td>
                    </tr>
                  ) : owingPupils.map((p) => (
                    <tr key={p.studentId} className="border-t border-border">
                      <Td className="font-medium">{p.studentName}</Td>
                      <Td>{p.admissionNumber}</Td>
                      <Td className="tabular-nums">{money(p.totalAmount)}</Td>
                      <Td className="tabular-nums">{money(p.paidAmount)}</Td>
                      <Td className="tabular-nums font-medium text-brand-700">{money(p.outstandingAmount)}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </section>

            <section>
              <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-ink">Pupils fully paid</h3>
                  <p className="text-xs text-muted">All published fee items for this class and term are paid</p>
                </div>
                <Badge tone="success">{paidPupils.length}</Badge>
              </div>
              <Table>
                <thead>
                  <tr>
                    <Th>Pupil</Th>
                    <Th>Admission #</Th>
                    <Th>Billed</Th>
                    <Th>Paid</Th>
                  </tr>
                </thead>
                <tbody>
                  {paidPupils.length === 0 ? (
                    <tr>
                      <Td colSpan={4} className="text-muted">
                        No fully paid pupils for this class and term yet.
                      </Td>
                    </tr>
                  ) : paidPupils.map((p) => (
                    <tr key={p.studentId} className="border-t border-border">
                      <Td className="font-medium">{p.studentName}</Td>
                      <Td>{p.admissionNumber}</Td>
                      <Td className="tabular-nums">{money(p.totalAmount)}</Td>
                      <Td className="tabular-nums">{money(p.paidAmount)}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </section>
          </div>
        )
      ) : invoicesLoading ? <Loading /> : (
        <Table>
          <thead>
            <tr>
              <Th>Pupil</Th>
              <Th>Item</Th>
              <Th>Amount</Th>
              <Th>Due</Th>
              <Th>Status</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {invoiceRows.length === 0 ? (
              <tr>
                <Td colSpan={6} className="text-muted">
                  No invoices yet. Publish term fees to create parent-facing invoices.
                </Td>
              </tr>
            ) : invoiceRows.map((inv) => (
              <tr key={inv.id} className="border-t border-border">
                <Td>
                  <p className="font-medium">{inv.studentName}</p>
                  <p className="text-xs text-muted">{inv.admissionNumber}</p>
                </Td>
                <Td>{inv.feeName}</Td>
                <Td className="tabular-nums">{money(inv.amount)}</Td>
                <Td>{inv.dueDate || '—'}</Td>
                <Td>
                  <Badge tone={inv.status === 'PAID' ? 'success' : inv.status === 'CANCELLED' ? 'danger' : 'warning'}>
                    {inv.status}
                  </Badge>
                </Td>
                <Td>
                  {inv.status === 'PENDING' && (
                    <Button size="sm" variant="secondary" onClick={() => handleMarkPaid(inv)}>
                      Mark paid
                    </Button>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <Modal open={extraOpen} onClose={() => setExtraOpen(false)} title="Add one-off fee item">
        <form onSubmit={handleAddExtra} className="space-y-4">
          {extraError && <Alert>{extraError}</Alert>}
          <Field label="Name">
            <Input
              value={extraForm.name}
              onChange={(e) => setExtraForm((prev) => ({ ...prev, name: e.target.value }))}
              required
              maxLength={100}
            />
          </Field>
          <Field label="Amount">
            <Input
              type="number"
              min="0.01"
              step="0.01"
              value={extraForm.amount}
              onChange={(e) => setExtraForm((prev) => ({ ...prev, amount: e.target.value }))}
              required
            />
          </Field>
          <Field label="Due date">
            <Input
              type="date"
              value={extraForm.dueDate}
              onChange={(e) => setExtraForm((prev) => ({ ...prev, dueDate: e.target.value }))}
            />
          </Field>
          <Field label="Description">
            <Textarea
              rows={3}
              value={extraForm.description}
              onChange={(e) => setExtraForm((prev) => ({ ...prev, description: e.target.value }))}
              maxLength={500}
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setExtraOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={extraSubmitting}>
              {extraSubmitting ? 'Saving…' : 'Add item'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
