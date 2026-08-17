import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { parentsApi } from '@/api'
import { useAsync } from '@/hooks/useAsync'
import { Alert, Button, Field, Input, Loading, PageHeader } from '@/components/ui'

export function ParentProfilePage() {
  const { data, loading, error, reload } = useAsync(() => parentsApi.me(), [])
  const [form, setForm] = useState({ fullName: '', phone: '' })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    if (!data) return
    setForm({
      fullName: data.fullName || '',
      phone: data.phone || '',
    })
  }, [data])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setFormError(null)
    try {
      await parentsApi.updateMe({
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
      })
      setMsg('Profile updated.')
      reload()
    } catch (err) {
      setFormError(err.message || 'Could not update profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="My profile"
        subtitle="Update your contact details"
        actions={(
          <Link to="/change-password">
            <Button variant="secondary" size="sm">Change password</Button>
          </Link>
        )}
      />
      {error && <Alert>{error}</Alert>}
      {msg && (
        <div className="mb-4">
          <Alert tone="success">{msg}</Alert>
        </div>
      )}
      {loading ? <Loading /> : (
        <form onSubmit={handleSave} className="max-w-lg space-y-4 rounded-2xl border border-blossom-200/80 bg-white p-5 shadow-sm">
          {formError && <Alert>{formError}</Alert>}
          <Field label="Email">
            <Input value={data?.email || ''} disabled />
          </Field>
          <Field label="Full name">
            <Input
              value={form.fullName}
              onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
              required
              maxLength={150}
            />
          </Field>
          <Field label="Phone">
            <Input
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              maxLength={30}
            />
          </Field>
          <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save profile'}</Button>
        </form>
      )}
    </div>
  )
}
