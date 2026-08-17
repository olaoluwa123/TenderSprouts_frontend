import { useState } from 'react'
import { usersApi } from '@/api'
import { useAsync } from '@/hooks/useAsync'
import { Alert, Badge, Button, Field, Loading, Modal, PageHeader, Select, Table, Td, Th } from '@/components/ui'

const ROLES = ['ADMIN', 'TEACHER', 'PARENT']

function formatWhen(value) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return value
  }
}

export function UsersPage() {
  const [role, setRole] = useState('')
  const { data, loading, error, reload } = useAsync(
    () => usersApi.list({ role, size: 50 }),
    [role],
  )
  const [msg, setMsg] = useState(null)
  const [msgTone, setMsgTone] = useState('success')
  const [activityUser, setActivityUser] = useState(null)
  const [activity, setActivity] = useState([])
  const [activityLoading, setActivityLoading] = useState(false)
  const [activityError, setActivityError] = useState(null)

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

  const forceReset = async (id) => {
    try {
      await usersApi.forcePasswordReset(id)
      showMsg('Password reset email sent')
    } catch (err) {
      showMsg(err?.message || 'Could not send password reset', 'error')
    }
  }

  const changeRole = async (id, nextRole) => {
    try {
      await usersApi.updateRole(id, nextRole)
      showMsg(`Role updated to ${nextRole}`)
      reload()
    } catch (err) {
      showMsg(err?.message || 'Could not change role', 'error')
      reload()
    }
  }

  const openActivity = async (user) => {
    setActivityUser(user)
    setActivity([])
    setActivityError(null)
    setActivityLoading(true)
    try {
      const rows = await usersApi.activity(user.id)
      setActivity(Array.isArray(rows) ? rows : (rows?.content ?? []))
    } catch (err) {
      setActivityError(err?.message || 'Could not load activity')
    } finally {
      setActivityLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader title="User Management" subtitle="Activate, deactivate, roles, and activity" />
      <Field label="Filter by role">
        <Select value={role} onChange={(e) => setRole(e.target.value)} className="max-w-xs">
          <option value="">All roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
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
              <Th>Last login</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {data?.content?.map((u) => (
              <tr key={u.id} className="border-t border-border">
                <Td className="font-medium">{u.fullName || '—'}</Td>
                <Td>{u.email}</Td>
                <Td>
                  <Select
                    value={u.role}
                    onChange={(e) => changeRole(u.id, e.target.value)}
                    className="min-w-[8rem]"
                  >
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </Select>
                </Td>
                <Td>{formatWhen(u.lastLoginAt)}</Td>
                <Td>
                  <Badge tone={u.isActive ? 'success' : 'danger'}>
                    {u.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </Td>
                <Td>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="secondary" onClick={() => toggleStatus(u.id, u.isActive)}>
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => forceReset(u.id)}>Reset password</Button>
                    <Button size="sm" variant="ghost" onClick={() => openActivity(u)}>Activity</Button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <Modal
        open={Boolean(activityUser)}
        onClose={() => setActivityUser(null)}
        title={activityUser ? `Activity · ${activityUser.fullName || activityUser.email}` : 'Activity'}
      >
        {activityLoading ? <Loading /> : (
          <div className="space-y-3">
            {activityError && <Alert>{activityError}</Alert>}
            {!activityError && activity.length === 0 && (
              <p className="text-sm text-muted">No activity recorded for this user.</p>
            )}
            {activity.length > 0 && (
              <ul className="divide-y divide-blossom-100">
                {activity.map((item, idx) => (
                  <li key={item.id ?? idx} className="py-3 first:pt-0 last:pb-0">
                    <p className="text-sm font-medium text-ink">
                      {item.action || item.eventType || item.description || 'Action'}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {[item.entityType, item.entityId].filter(Boolean).join(' #')}
                      {item.details ? ` · ${item.details}` : ''}
                      {' · '}
                      {formatWhen(item.createdAt || item.timestamp)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
