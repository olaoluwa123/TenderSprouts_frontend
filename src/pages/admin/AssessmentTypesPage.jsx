import { useState } from 'react'
import { assessmentTypesApi } from '@/api'
import { useAsync } from '@/hooks/useAsync'
import { Alert, Badge, Button, Field, Input, Loading, Modal, PageHeader, Table, Td, Th } from '@/components/ui'

function isTypeActive(type) {
  return type.active ?? type.isActive ?? false
}

export function AssessmentTypesPage() {
  const { data, loading, reload } = useAsync(() => assessmentTypesApi.list(), [])
  const [open, setOpen] = useState(false)
  const [edit, setEdit] = useState(null)
  const [form, setForm] = useState({
    code: '', name: '', defaultMaxScore: '', weight: '',
  })
  const [error, setError] = useState(null)
  const [actionError, setActionError] = useState(null)

  const resetForm = () => {
    setForm({ code: '', name: '', defaultMaxScore: '', weight: '' })
    setError(null)
  }

  const openCreate = () => {
    resetForm()
    setEdit(null)
    setOpen(true)
  }

  const openEdit = (type) => {
    setEdit(type)
    setForm({
      code: type.code,
      name: type.name,
      defaultMaxScore: String(type.defaultMaxScore ?? ''),
      weight: String(type.weight ?? '0'),
    })
    setError(null)
    setOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    try {
      const payload = {
        name: form.name,
        defaultMaxScore: Number(form.defaultMaxScore),
        weight: Number(form.weight || 0),
      }
      if (edit) {
        await assessmentTypesApi.update(edit.id, {
          ...payload,
          active: isTypeActive(edit),
        })
      } else {
        await assessmentTypesApi.create({
          code: form.code.toUpperCase(),
          ...payload,
        })
      }
      setOpen(false)
      reload()
    } catch (err) {
      setError(err?.message || 'Failed to save')
    }
  }

  const toggleActive = async (type) => {
    setActionError(null)
    try {
      await assessmentTypesApi.update(type.id, {
        active: !isTypeActive(type),
      })
      reload()
    } catch (err) {
      setActionError(err?.message || 'Failed to update status')
    }
  }

  const activeWeightedMaxSum = (data ?? [])
    .filter((t) => isTypeActive(t) && Number(t.weight ?? 0) > 0)
    .reduce((sum, t) => sum + Number(t.defaultMaxScore ?? 0), 0)
  const maxSumMismatch = activeWeightedMaxSum > 0 && activeWeightedMaxSum !== 100

  return (
    <div>
      <PageHeader
        title="Assessment Types"
        subtitle="Active assessment max scores (with weight > 0) should sum to 100 for term grading"
        actions={<Button onClick={openCreate}>Add assessment field</Button>}
      />
      {maxSumMismatch && (
        <div className="mb-4">
          <Alert tone="warning">
            Active weighted assessment max scores currently sum to {activeWeightedMaxSum}, not 100.
            Teachers grade out of 100 per subject when max scores total 100.
          </Alert>
        </div>
      )}
      {actionError && <div className="mb-4"><Alert>{actionError}</Alert></div>}
      {loading ? <Loading /> : (
        <Table>
          <thead>
            <tr>
              <Th>Code</Th>
              <Th>Name</Th>
              <Th>Max score</Th>
              <Th>Weight (%)</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {data?.map((t) => (
              <tr key={t.id} className="border-t border-border">
                <Td>{t.code}</Td>
                <Td>{t.name}</Td>
                <Td>{t.defaultMaxScore}</Td>
                <Td>{t.weight ?? 0}</Td>
                <Td>
                  {isTypeActive(t)
                    ? <Badge tone="success">Active</Badge>
                    : <Badge>Inactive</Badge>}
                </Td>
                <Td>
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => openEdit(t)}>Edit</Button>
                    <Button size="sm" variant="secondary" onClick={() => toggleActive(t)}>
                      {isTypeActive(t) ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title={edit ? 'Edit assessment type' : 'Add assessment type'}>
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && <p className="text-sm text-red-600">{error}</p>}
          {!edit && (
            <Field label="Code (e.g. QUIZ)">
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="QUIZ"
                required
              />
            </Field>
          )}
          <Field label="Display name">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </Field>
          <Field label="Max score (teachers cannot exceed this)">
            <Input
              type="number"
              min="0.01"
              step="0.01"
              value={form.defaultMaxScore}
              onChange={(e) => setForm({ ...form, defaultMaxScore: e.target.value })}
              required
            />
          </Field>
          <Field label="Weight toward term average (%)">
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.weight}
              onChange={(e) => setForm({ ...form, weight: e.target.value })}
            />
          </Field>
          <Button type="submit">{edit ? 'Save changes' : 'Create'}</Button>
        </form>
      </Modal>
    </div>
  )
}
