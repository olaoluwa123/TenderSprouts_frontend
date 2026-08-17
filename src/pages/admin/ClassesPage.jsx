import { useState } from 'react'
import { Link } from 'react-router-dom'
import { classesApi } from '@/api'
import { useAsync } from '@/hooks/useAsync'
import { Alert, Badge, Button, Field, Input, Loading, Modal, PageHeader, Table, Td, Th } from '@/components/ui'

export function ClassesPage() {
  const { data, loading, error, reload } = useAsync(
    () => classesApi.list({ size: 100 }),
    [],
  )
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState(null)

  const handleCreate = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setFormError(null)
    try {
      await classesApi.create(name.trim())
      setOpen(false)
      setName('')
      reload()
    } catch (err) {
      setFormError(err?.message || 'Could not create class')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Classes"
        subtitle="All classes"
        actions={<Button onClick={() => { setOpen(true); setFormError(null) }}>Add class</Button>}
      />
      {error && <Alert>{error}</Alert>}
      {loading ? <Loading /> : (
        <Table>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Class teacher</Th>
              <Th>Pupils</Th>
              <Th>Subjects</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {(data?.content ?? []).map((c) => (
              <tr key={c.id} className="border-t border-border">
                <Td>{c.name}</Td>
                <Td>{c.teacherName || '—'}</Td>
                <Td>{c.pupilCount ?? 0}</Td>
                <Td>{c.subjectCount ?? 0}</Td>
                <Td>
                  <Badge tone={c.isActive === false ? 'danger' : 'success'}>
                    {c.isActive === false ? 'Inactive' : 'Active'}
                  </Badge>
                </Td>
                <Td>
                  <Link to={`/admin/classes/${c.id}`}>
                    <Button size="sm" variant="secondary">View</Button>
                  </Link>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Add class">
        <form onSubmit={handleCreate} className="space-y-3">
          {formError && <Alert>{formError}</Alert>}
          <Field label="Class name">
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Button type="submit" disabled={submitting || !name.trim()}>
            {submitting ? 'Saving…' : 'Create class'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}
