import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { homePathForRole } from '@/lib/roles'
import { SCHOOL } from '@/lib/school'
import { Alert, Button, Card, Field, Input } from '@/components/ui'

export function LoginPage() {
  const { login, isAuthenticated, role } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  if (isAuthenticated && role) {
    return <Navigate to={homePathForRole(role)} replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const submittedPassword = password
    setPassword('')
    try {
      const tokens = await login(email, submittedPassword)
      if (tokens.passwordChangeRequired) {
        navigate('/change-password')
      } else {
        navigate(homePathForRole(tokens.role))
      }
    } catch (err) {
      setError(err?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-brand-50 via-white to-slate-100 p-4">
      <Card className="w-full max-w-md">
        <div className="mb-6">
          <img src={SCHOOL.logo} alt={SCHOOL.name} className="h-12 w-auto" />
          <h1 className="mt-5 text-xl font-bold">{SCHOOL.name} portal</h1>
          <p className="text-sm text-muted">Sign in to your account</p>
        </div>
        {error && <Alert>{error}</Alert>}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <Field label="Email">
            <Input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>
          <Field label="Password">
            <Input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </Field>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted">
          <Link to="/forgot-password" className="text-primary-600 hover:underline">Forgot password?</Link>
        </p>
      </Card>
      <Link to="/" className="mt-6 inline-flex items-center gap-2 text-sm text-muted hover:text-brand-700">
        <ArrowLeft size={16} />
        Back to {SCHOOL.shortName}
      </Link>
    </div>
  )
}
