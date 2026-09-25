import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { parentsApi } from '@/api'
import { useAsync } from '@/hooks/useAsync'
import { useClasses } from '@/hooks/useSchoolData'
import { ClassSelect } from '@/components/ui/SchoolSelects'
import { Alert, Badge, Button, Field, Input, Loading, Modal, PageHeader, Select, Table, Td, Th } from '@/components/ui'

const emptyPupilForm = {
  firstName: '',
  lastName: '',
  admissionNumber: '',
  dateOfBirth: '',
  gender: '',
  classId: '',
}

function InfoRow({ label, value }) {
  return (
    <div className="grid gap-1 border-b border-brand-100 py-3 sm:grid-cols-[11rem_1fr] sm:gap-4">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted">{label}</dt>
      <dd className="text-sm text-ink whitespace-pre-wrap">{value || '—'}</dd>
    </div>
  )
}

function Section({ title, children, action }) {
  return (
    <section className="rounded-2xl border border-blossom-200/80 bg-white p-5 shadow-sm shadow-blossom-500/5">
      <div className="mb-4 flex items-baseline justify-between gap-3 border-b border-brand-100 pb-3">
        <h2 className="font-display text-lg font-semibold tracking-tight text-ink">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

export function ParentDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: classes } = useClasses()
  const { data, loading, error, reload } = useAsync(() => parentsApi.get(Number(id)), [id])
  const [linkOpen, setLinkOpen] = useState(false)
  const [form, setForm] = useState(emptyPupilForm)
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const classNameFor = (classId) => classes?.find((c) => c.id === classId)?.name || '—'

  const openAddPupil = () => {
    setForm(emptyPupilForm)
    setFormError(null)
    setLinkOpen(true)
  }

  const handleCreateAndLink = async (e) => {
    e.preventDefault()
    setFormError(null)
    setSubmitting(true)
    try {
      await parentsApi.createAndLinkStudent(Number(id), {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        admissionNumber: form.admissionNumber.trim(),
        dateOfBirth: form.dateOfBirth || null,
        gender: form.gender || null,
        classId: Number(form.classId),
      })
      setLinkOpen(false)
      setForm(emptyPupilForm)
      reload()
    } catch (err) {
      setFormError(err?.message || 'Failed to add pupil')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUnlink = async (pupilId) => {
    if (!window.confirm('Unlink this pupil from the parent?')) return
    setFormError(null)
    try {
      await parentsApi.unlinkStudent(Number(id), pupilId)
      reload()
    } catch (err) {
      setFormError(err?.message || 'Failed to unlink pupil')
    }
  }

  if (loading) return <Loading label="Loading parent profile…" />
  if (error) {
    return (
      <div>
        <PageHeader title="Parent profile" />
        <Alert>{error}</Alert>
        <Button className="mt-3" variant="secondary" onClick={() => navigate('/admin/parents')}>Back</Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title={data.fullName || 'Parent'}
        subtitle="Parent profile"
        actions={(
          <div className="flex flex-wrap gap-2">
            <Link to="/admin/parents">
              <Button variant="secondary" size="sm"><ArrowLeft size={14} /> All parents</Button>
            </Link>
            <Button size="sm" onClick={openAddPupil}>
              Add pupil
            </Button>
          </div>
        )}
      />

      {formError && !linkOpen && <Alert>{formError}</Alert>}

      <Section title="Parent information">
        <dl>
          <InfoRow label="Name" value={data.fullName} />
          <InfoRow label="Email" value={data.email} />
          <InfoRow label="Phone" value={data.phone} />
          <InfoRow label="Address" value={data.address} />
          <InfoRow
            label="Login status"
            value={data.loginActive === false ? 'Disabled' : 'Active'}
          />
          <InfoRow
            label="Record status"
            value={data.isActive === false ? 'Inactive' : 'Active'}
          />
        </dl>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge tone={data.loginActive === false ? 'danger' : 'success'}>
            Login {data.loginActive === false ? 'disabled' : 'active'}
          </Badge>
          <Badge tone={data.isActive === false ? 'danger' : 'success'}>
            {data.isActive === false ? 'Inactive' : 'Active'}
          </Badge>
        </div>
      </Section>

      <Section title="Linked pupils">
        {(data.students ?? []).length === 0 ? (
          <p className="text-sm text-muted">No pupils linked yet.</p>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Admission #</Th>
                <Th>Class</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {data.students.map((s) => (
                <tr key={s.id} className="border-t border-border">
                  <Td>
                    <Link to={`/admin/students/${s.id}`} className="font-medium text-brand-700 hover:text-brand-700">
                      {s.firstName} {s.lastName}
                    </Link>
                  </Td>
                  <Td>{s.admissionNumber || '—'}</Td>
                  <Td>{classNameFor(s.classId)}</Td>
                  <Td>
                    <div className="flex flex-wrap gap-2">
                      <Link to={`/admin/students/${s.id}`}>
                        <Button size="sm" variant="secondary">View pupil</Button>
                      </Link>
                      <Button size="sm" variant="ghost" onClick={() => handleUnlink(s.id)}>Unlink</Button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Section>

      <Modal open={linkOpen} onClose={() => setLinkOpen(false)} title="Add pupil for this parent">
        <form onSubmit={handleCreateAndLink} className="space-y-3">
          <p className="text-sm text-muted">
            Create a new pupil and link them to <span className="font-medium text-ink">{data.fullName}</span>.
            Parent login details are not needed.
          </p>
          {formError && <Alert>{formError}</Alert>}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="First name">
              <Input
                value={form.firstName}
                onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
                required
              />
            </Field>
            <Field label="Last name">
              <Input
                value={form.lastName}
                onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
                required
              />
            </Field>
          </div>
          <Field label="Admission number">
            <Input
              value={form.admissionNumber}
              onChange={(e) => setForm((prev) => ({ ...prev, admissionNumber: e.target.value }))}
              required
            />
          </Field>
          <Field label="Class">
            <ClassSelect
              value={form.classId}
              onChange={(classId) => setForm((prev) => ({ ...prev, classId }))}
              classes={classes}
              alwaysShow
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Date of birth">
              <Input
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => setForm((prev) => ({ ...prev, dateOfBirth: e.target.value }))}
              />
            </Field>
            <Field label="Gender">
              <Select
                value={form.gender}
                onChange={(e) => setForm((prev) => ({ ...prev, gender: e.target.value }))}
              >
                <option value="">Optional</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </Select>
            </Field>
          </div>
          <Button type="submit" disabled={submitting || !form.classId}>
            {submitting ? 'Adding…' : 'Add pupil'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}
