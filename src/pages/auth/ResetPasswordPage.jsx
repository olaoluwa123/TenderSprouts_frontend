import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { authApi } from '@/api'
import { Alert, Button, Card, Field, Input } from '@/components/ui'

export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get('token') || ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState(null)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    setError(null)
    try {
      await authApi.resetPassword(token, password)
      setDone(true)
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      setError(err?.message || 'Reset failed')
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="max-w-md"><Alert>Invalid reset link.</Alert></Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <h1 className="text-xl font-bold">Reset password</h1>
        {done ? (
          <div className="mt-4"><Alert tone="success">Password updated. Redirecting to login...</Alert></div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {error && <Alert>{error}</Alert>}
            <Field label="New password">
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
            </Field>
            <Field label="Confirm password">
              <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
            </Field>
            <Button type="submit">Update password</Button>
          </form>
        )}
        <p className="mt-4 text-sm"><Link to="/login" className="text-primary-600">Back to login</Link></p>
      </Card>
    </div>
  )
}
