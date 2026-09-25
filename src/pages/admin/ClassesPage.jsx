import { useState } from 'react'
import { Link } from 'react-router-dom'
import { classesApi } from '@/api'
import { useAsync } from '@/hooks/useAsync'
import { Alert, Badge, Button, Field, Input, Loading, Modal, PageHeader, Select, Table, Td, Th } from '@/components/ui'

const CLASS_GROUPS = [
  { value: 'PRE_PRIMARY', label: 'Pre-primary' },
  { value: 'PRIMARY', label: 'Primary' },
]

function groupLabel(value) {
  return CLASS_GROUPS.find((g) => g.value === value)?.label || value || '—'
}

export function ClassesPage() {
  const { data, loading, error, reload } = useAsync(
    () => classesApi.list({ size: 100 }),
    [],
  )
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [name, setName] = useState('')
  const [classGroup, setClassGroup] = useState('PRIMARY')
  const [isActive, setIsActive] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState(null)

  const resetForm = () => {
    setName('')
    setClassGroup('PRIMARY')
    setIsActive(true)
    setFormError(null)
    setEditing(null)
  }

  const openCreate = () => {
    resetForm()
    setOpen(true)
  }

  const openEdit = (c) => {
    setEditing(c)
    setName(c.name || '')
    setClassGroup(c.classGroup || 'PRIMARY')
    setIsActive(c.isActive !== false)
    setFormError(null)
    setOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setFormError(null)
    try {
      if (editing) {
        await classesApi.update(editing.id, {
          name: name.trim(),
          classGroup,
          isActive,
        })
      } else {
        await classesApi.create({ name: name.trim(), classGroup })
      }
      setOpen(false)
      resetForm()
      reload()
    } catch (err) {
      setFormError(err?.message || (editing ? 'Could not update class' : 'Could not create class'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Classes"
        subtitle="Pre-primary and primary classes"
        actions={<Button onClick={openCreate}>Add class</Button>}
      />
      {error && <Alert>{error}</Alert>}
      {loading ? <Loading /> : (
        <Table>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Group</Th>
              <Th>Teachers</Th>
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
                <Td>{groupLabel(c.classGroup)}</Td>
                <Td>{c.teacherName || '—'}</Td>
                <Td>{c.pupilCount ?? 0}</Td>
                <Td>{c.subjectCount ?? 0}</Td>
                <Td>
                  <Badge tone={c.isActive === false ? 'danger' : 'success'}>
                    {c.isActive === false ? 'Inactive' : 'Active'}
                  </Badge>
                </Td>
                <Td>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="secondary" onClick={() => openEdit(c)}>
                      Edit
                    </Button>
                    <Link to={`/admin/classes/${c.id}`}>
                      <Button size="sm" variant="secondary">View</Button>
                    </Link>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <Modal
        open={open}
        onClose={() => { setOpen(false); resetForm() }}
        title={editing ? 'Edit class' : 'Add class'}
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          {formError && <Alert>{formError}</Alert>}
          <Field label="Class name">
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field label="Group">
            <Select value={classGroup} onChange={(e) => setClassGroup(e.target.value)} required>
              {CLASS_GROUPS.map((g) => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </Select>
          </Field>
          {editing && (
            <Field label="Status">
              <Select
                value={isActive ? 'true' : 'false'}
                onChange={(e) => setIsActive(e.target.value === 'true')}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </Select>
            </Field>
          )}
          <Button type="submit" disabled={submitting || !name.trim()}>
            {submitting ? 'Saving…' : editing ? 'Save changes' : 'Create class'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}
