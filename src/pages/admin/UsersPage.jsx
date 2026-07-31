import { useState } from 'react'
import { usersApi } from '@/api'

import { useAsync } from '@/hooks/useAsync'
import { Alert, Badge, Button, Field, Loading, PageHeader, Select, Table, Td, Th } from '@/components/ui'

export function UsersPage() {
  const [role, setRole] = useState('')
  const { data, loading, error, reload } = useAsync(
    () => usersApi.list({ role, size: 50 }),
    [role],
  )

  const toggleStatus = async (id, isActive) => {
    await usersApi.updateStatus(id, !isActive)
    reload()
  }

  const forceReset = async (id) => {
    await usersApi.forcePasswordReset(id)
    alert('Password reset email sent')
  }

  return (
    <div>
      <PageHeader title="User Management" subtitle="Activate, deactivate, and reset passwords" />
      <Field label="Filter by role">
        <Select value={role} onChange={(e) => setRole(e.target.value)} className="max-w-xs">
          <option value="">All roles</option>
          <option value="ADMIN">Admin</option>
          <option value="TEACHER">Teacher</option>
          <option value="PARENT">Parent</option>
        </Select>
      </Field>
      {error && <div className="mt-4"><Alert>{error}</Alert></div>}
      {loading ? <Loading /> : (
        <Table>
          <thead><tr><Th>Name</Th><Th>Email</Th><Th>Role</Th><Th>Status</Th><Th>Actions</Th></tr></thead>
          <tbody>
            {data?.content.map((u) => (
              <tr key={u.id} className="border-t border-border">
                <Td className="font-medium">{u.fullName || '—'}</Td>
                <Td>{u.email}</Td>
                <Td><Badge>{u.role}</Badge></Td>
                <Td><Badge tone={u.isActive ? 'success' : 'danger'}>{u.isActive ? 'Active' : 'Inactive'}</Badge></Td>
                <Td>
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => toggleStatus(u.id, u.isActive)}>
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => forceReset(u.id)}>Reset password</Button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  )
}
