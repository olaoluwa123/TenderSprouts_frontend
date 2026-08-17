import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { studentsApi } from '@/api'
import { useAsync } from '@/hooks/useAsync'
import { Alert, Badge, Button, Field, Input, Loading, Modal, PageHeader, Select, Table, Td, Textarea, Th } from '@/components/ui'

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

export function PupilDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, loading, error, reload } = useAsync(
    () => studentsApi.profile(Number(id)),
    [id],
  )
  const [editOpen, setEditOpen] = useState(false)
  const [form, setForm] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  const openEdit = () => {
    if (!data) return
    setForm({
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      gender: data.gender || 'MALE',
      dateOfBirth: data.dateOfBirth || '',
      isActive: data.isActive !== false,
      address: data.address || '',
      medicalInformation: data.medicalInformation || '',
    })
    setSubmitError(null)
    setEditOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setSubmitError(null)
    try {
      await studentsApi.update(Number(id), {
        firstName: form.firstName,
        lastName: form.lastName,
        gender: form.gender,
        dateOfBirth: form.dateOfBirth || undefined,
        isActive: form.isActive,
        address: form.address,
        medicalInformation: form.medicalInformation,
      })
      setEditOpen(false)
      reload()
    } catch (err) {
      setSubmitError(err?.message || 'Could not update pupil')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Loading label="Loading pupil profile…" />
  if (error) {
    return (
      <div>
        <PageHeader title="Pupil profile" />
        <Alert>{error}</Alert>
        <Button className="mt-3" variant="secondary" onClick={() => navigate('/admin/students')}>Back</Button>
      </div>
    )
  }

  const attendance = data.attendance ?? {}
  const guardians = data.guardians ?? []
  const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Pupil'

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title={fullName}
        subtitle="Pupil profile"
        actions={(
          <div className="flex flex-wrap gap-2">
            <Link to="/admin/students">
              <Button variant="secondary" size="sm"><ArrowLeft size={14} /> All pupils</Button>
            </Link>
            <Button size="sm" onClick={openEdit}>Edit pupil</Button>
          </div>
        )}
      />

      <Section title="Pupil Information">
        <dl>
          <InfoRow label="Name" value={fullName} />
          <InfoRow label="Date of Birth" value={data.dateOfBirth} />
          <InfoRow label="Gender" value={data.gender} />
          <InfoRow label="Admission Number" value={data.admissionNumber} />
          <InfoRow label="Class" value={data.className} />
          <InfoRow label="Session" value={data.sessionName} />
          <InfoRow
            label="Parent / Guardian"
            value={guardians.length
              ? guardians.map((g) => [g.fullName, g.email, g.phone].filter(Boolean).join(' · ')).join('\n')
              : null}
          />
          <InfoRow label="Address" value={data.address} />
          <InfoRow label="Medical Information" value={data.medicalInformation} />
        </dl>
        <div className="mt-3">
          <Badge tone={data.isActive === false ? 'danger' : 'success'}>
            {data.isActive === false ? 'Withdrawn / inactive' : 'Active'}
          </Badge>
        </div>
      </Section>

      <Section title="Academic">
        <div className="space-y-8">
          <div>
            <h3 className="mb-3 text-sm font-semibold text-ink">Results</h3>
            {(data.results ?? []).length === 0 ? (
              <p className="text-sm text-muted">No term results yet.</p>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Term</Th>
                    <Th>Session</Th>
                    <Th>Class</Th>
                    <Th>Average</Th>
                    <Th>Grade</Th>
                    <Th>Rank</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {data.results.map((r) => (
                    <tr key={r.termResultId} className="border-t border-border">
                      <Td>{r.termName}</Td>
                      <Td>{r.sessionName}</Td>
                      <Td>{r.className}</Td>
                      <Td className="tabular-nums">{r.averageScore != null ? Number(r.averageScore).toFixed(1) : '—'}</Td>
                      <Td>{r.letterGrade || '—'}</Td>
                      <Td className="tabular-nums">{r.rankInClass ?? '—'}</Td>
                      <Td>
                        <Badge tone={r.published ? 'success' : 'default'}>
                          {r.published ? 'Published' : 'Draft'}
                        </Badge>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-ink">Attendance</h3>
            {(attendance.totalMarked ?? 0) === 0 ? (
              <p className="text-sm text-muted">No attendance records yet.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                {[
                  ['Present', attendance.present],
                  ['Absent', attendance.absent],
                  ['Late', attendance.late],
                  ['Excused', attendance.excused],
                  ['Marked', attendance.totalMarked],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl bg-brand-50/70 px-3 py-3">
                    <p className="text-[11px] uppercase tracking-wide text-muted">{label}</p>
                    <p className="mt-1 text-xl font-semibold tabular-nums text-ink">{value ?? 0}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-ink">Subjects</h3>
            {(data.subjects ?? []).length === 0 ? (
              <p className="text-sm text-muted">No subjects assigned to this class.</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {data.subjects.map((s) => (
                  <li key={s.id} className="rounded-full bg-brand-50 px-3 py-1.5 text-sm text-brand-800">
                    {s.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-ink">Class history</h3>
            {(data.classHistory ?? []).length === 0 ? (
              <p className="text-sm text-muted">No enrolment history.</p>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Class</Th>
                    <Th>Session</Th>
                    <Th>Start</Th>
                    <Th>End</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {data.classHistory.map((h) => (
                    <tr key={h.enrollmentId} className="border-t border-border">
                      <Td>{h.className}</Td>
                      <Td>{h.sessionName}</Td>
                      <Td>{h.startDate || '—'}</Td>
                      <Td>{h.endDate || '—'}</Td>
                      <Td>{h.status || '—'}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </div>
        </div>
      </Section>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit pupil">
        {form && (
          <form onSubmit={handleSave} className="space-y-3">
            {submitError && <Alert>{submitError}</Alert>}
            <Field label="First name">
              <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
            </Field>
            <Field label="Last name">
              <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
            </Field>
            <Field label="Gender">
              <Select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </Select>
            </Field>
            <Field label="Date of birth">
              <Input type="date" value={form.dateOfBirth || ''} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
            </Field>
            <Field label="Address">
              <Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={2} />
            </Field>
            <Field label="Medical information">
              <Textarea value={form.medicalInformation} onChange={(e) => setForm({ ...form, medicalInformation: e.target.value })} rows={3} />
            </Field>
            <Field label="Status">
              <Select
                value={form.isActive ? 'ACTIVE' : 'WITHDRAWN'}
                onChange={(e) => setForm({ ...form, isActive: e.target.value === 'ACTIVE' })}
              >
                <option value="ACTIVE">Active</option>
                <option value="WITHDRAWN">Withdrawn / inactive</option>
              </Select>
            </Field>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving…' : 'Save changes'}
            </Button>
          </form>
        )}
      </Modal>
    </div>
  )
}
