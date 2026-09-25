import { useState } from 'react'
import { subjectsApi } from '@/api'
import { useAsync } from '@/hooks/useAsync'
import { Alert, Button, Field, Input, Loading, Modal, PageHeader, Table, Td, Th } from '@/components/ui'

export function SubjectsPage() {
  const { data, loading, error, reload } = useAsync(
    () => subjectsApi.list({ size: 100 }),
    [],
  )

  const [addOpen, setAddOpen] = useState(false)
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState(null)
  const [msg, setMsg] = useState(null)

  const handleCreate = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setFormError(null)
    try {
      await subjectsApi.create(name.trim())
      setAddOpen(false)
      setName('')
      setMsg('Subject added')
      reload()
    } catch (err) {
      setFormError(err?.message || 'Could not add subject')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRemove = async (subject) => {
    if (!window.confirm(`Remove subject “${subject.name}”?`)) return
    try {
      await subjectsApi.remove(subject.id)
      setMsg('Subject removed')
      reload()
    } catch (err) {
      setFormError(err?.message || 'Could not remove subject')
    }
  }

  const subjects = (data?.content ?? []).filter((s) => s.isActive !== false)

  return (
    <div>
      <PageHeader
        title="Subjects"
        subtitle="Add subjects here, then assign them to classes on each class profile"
        actions={<Button onClick={() => { setAddOpen(true); setFormError(null) }}>Add subject</Button>}
      />
      {error && <Alert>{error}</Alert>}
      {formError && !addOpen && <Alert>{formError}</Alert>}
      {msg && <div className="mb-4"><Alert tone="success">{msg}</Alert></div>}
      {loading ? <Loading /> : (
        <Table>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {subjects.length === 0 ? (
              <tr>
                <Td colSpan={2} className="text-muted">No subjects yet.</Td>
              </tr>
            ) : subjects.map((s) => (
              <tr key={s.id} className="border-t border-border">
                <Td>{s.name}</Td>
                <Td>
                  <Button size="sm" variant="danger" onClick={() => handleRemove(s)}>Remove</Button>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add subject">
        <form onSubmit={handleCreate} className="space-y-3">
          {formError && <Alert>{formError}</Alert>}
          <Field label="Name">
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Button type="submit" disabled={submitting || !name.trim()}>
            {submitting ? 'Saving…' : 'Add subject'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}
