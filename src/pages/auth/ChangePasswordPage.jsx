import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { homePathForRole } from '@/lib/roles'
import { Alert, Button, Card, Field, Input } from '@/components/ui'

export function ChangePasswordPage() {
  const { isAuthenticated, passwordChangeRequired, changePassword, role, logout } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!passwordChangeRequired && !done) {
    return <Navigate to={homePathForRole(role)} replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (newPassword !== confirm) {
      setError('Passwords do not match')
      return
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await changePassword(currentPassword, newPassword)
      setDone(true)
    } catch (err) {
      setError(err?.message || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <Alert tone="success">Password updated successfully.</Alert>
          <Button className="mt-4 w-full" onClick={() => window.location.assign(homePathForRole(role))}>
            Continue to portal
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <h1 className="text-xl font-bold">Change your password</h1>
        <p className="mt-2 text-sm text-muted">
          You must set a new password before continuing.
        </p>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && <Alert>{error}</Alert>}
          <Field label="Current password">
            <Input
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </Field>
          <Field label="New password">
            <Input
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
            />
          </Field>
          <Field label="Confirm new password">
            <Input
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </Field>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Updating...' : 'Update password'}
          </Button>
        </form>
        <Button type="button" variant="secondary" className="mt-3 w-full" onClick={logout}>
          Sign out
        </Button>
      </Card>
    </div>
  )
}
