import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authApi } from '@/api'
import { Alert, Button, Card, Field, Input } from '@/components/ui'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await authApi.forgotPassword(email)
      setSent(true)
    } catch (err) {
      setError(err?.message || 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <h1 className="text-xl font-bold">Forgot password</h1>
        <p className="mt-1 text-sm text-muted">We'll email you a reset link if the account exists.</p>
        {sent ? (
          <div className="mt-4"><Alert tone="success">If an account exists, a reset email has been sent.</Alert></div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {error && <Alert>{error}</Alert>}
            <Field label="Email">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </Field>
            <Button type="submit" disabled={loading}>{loading ? 'Sending...' : 'Send reset link'}</Button>
          </form>
        )}
        <p className="mt-4 text-sm"><Link to="/login" className="text-primary-600">Back to login</Link></p>
      </Card>
    </div>
  )
}
