import { useState } from 'react'
import { usersApi } from '@/api'
import { useAsync } from '@/hooks/useAsync'
import { roleLabel } from '@/lib/roles'
import { Alert, Badge, Button, Field, Input, Loading, Modal, PageHeader, Select, Table, Td, Th } from '@/components/ui'

const ROLES = ['ADMIN', 'TEACHER', 'PARENT']
const CREATE_ROLES = ['ADMIN', 'TEACHER']

const emptyForm = {
  email: '',
  fullName: '',
  role: 'TEACHER',
  phone: '',
}

export function UsersPage() {
  const [role, setRole] = useState('')
  const { data, loading, error, reload } = useAsync(
    () => usersApi.list({ role, size: 50 }),
    [role],
  )
  const [msg, setMsg] = useState(null)
  const [msgTone, setMsgTone] = useState('success')
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  const showMsg = (text, tone = 'success') => {
    setMsg(text)
    setMsgTone(tone)
  }

  const toggleStatus = async (id, isActive) => {
    try {
      await usersApi.updateStatus(id, !isActive)
      showMsg(`User ${isActive ? 'deactivated' : 'activated'}`)
      reload()
    } catch (err) {
      showMsg(err?.message || 'Could not update status', 'error')
    }
  }

  const openCreate = () => {
    setForm(emptyForm)
    setSubmitError(null)
    setCreateOpen(true)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setSubmitError(null)
    try {
      await usersApi.create({
        email: form.email.trim(),
        fullName: form.fullName.trim(),
        role: form.role,
        phone: form.role === 'TEACHER' && form.phone.trim()
          ? form.phone.trim()
          : undefined,
      })
      setCreateOpen(false)
      setForm(emptyForm)
      showMsg(`Created ${roleLabel(form.role).toLowerCase()} — welcome email queued`)
      reload()
    } catch (err) {
      setSubmitError(err?.message || 'Could not create user')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="User Management"
        subtitle="Create admins and teachers, or activate and deactivate portal users"
        actions={<Button onClick={openCreate}>Create user</Button>}
      />
      <Field label="Filter by role">
        <Select value={role} onChange={(e) => setRole(e.target.value)} className="max-w-xs">
          <option value="">All roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{roleLabel(r)}</option>)}
        </Select>
      </Field>
      {msg && <Alert tone={msgTone}>{msg}</Alert>}
      {error && <Alert>{error}</Alert>}
      {loading ? <Loading /> : (
        <Table>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Role</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {data?.content?.map((u) => (
              <tr key={u.id} className="border-t border-border">
                <Td className="font-medium">{u.fullName || '—'}</Td>
                <Td>{u.email}</Td>
                <Td>{roleLabel(u.role)}</Td>
                <Td>
                  <Badge tone={u.isActive ? 'success' : 'danger'}>
                    {u.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </Td>
                <Td>
                  <Button size="sm" variant="secondary" onClick={() => toggleStatus(u.id, u.isActive)}>
                    {u.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create user">
        <form onSubmit={handleCreate} className="space-y-3">
          {submitError && <Alert>{submitError}</Alert>}
          <Field label="Full name">
            <Input
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              required
            />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </Field>
          <Field label="Role">
            <Select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value, phone: e.target.value === 'TEACHER' ? form.phone : '' })}
            >
              {CREATE_ROLES.map((r) => (
                <option key={r} value={r}>{roleLabel(r)}</option>
              ))}
            </Select>
          </Field>
          {form.role === 'TEACHER' && (
            <Field label="Phone (optional)">
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </Field>
          )}
          <p className="text-xs text-muted">
            Creates the account with a temporary password and queues a welcome email. The user must change their password on first sign-in.
          </p>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create user'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}
