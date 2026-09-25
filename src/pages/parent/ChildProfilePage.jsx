import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { studentsApi } from '@/api'
import { useAsync } from '@/hooks/useAsync'
import { displayAge, formatSex } from '@/lib/studentProfile'
import { bandClassName, toPerformanceBand } from '@/lib/performanceBand'
import { Alert, Badge, Button, Loading, PageHeader, Table, Td, Th } from '@/components/ui'

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

export function ChildProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, loading, error } = useAsync(
    () => studentsApi.profile(Number(id)),
    [id],
  )

  if (loading) return <Loading label="Loading pupil profile…" />
  if (error) {
    return (
      <div>
        <PageHeader title="Child profile" />
        <Alert>{error}</Alert>
        <Button className="mt-3" variant="secondary" onClick={() => navigate('/parent/children')}>Back</Button>
      </div>
    )
  }

  const attendance = data.attendance ?? {}
  const guardians = data.guardians ?? []
  const results = (data.results ?? []).filter((r) => r.published)
  const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Pupil'

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title={fullName}
        subtitle="Pupil profile"
        actions={(
          <div className="flex flex-wrap gap-2">
            <Link to="/parent/children">
              <Button variant="secondary" size="sm"><ArrowLeft size={14} /> My children</Button>
            </Link>
            <Link to="/parent/results">
              <Button size="sm" variant="secondary">Report cards</Button>
            </Link>
            <Link to="/parent/attendance">
              <Button size="sm" variant="secondary">Attendance</Button>
            </Link>
          </div>
        )}
      />

      <Section title="Pupil information">
        <dl>
          <InfoRow label="Name" value={fullName} />
          <InfoRow label="Date of birth" value={data.dateOfBirth} />
          <InfoRow label="Age" value={displayAge(data)} />
          <InfoRow label="Sex" value={formatSex(data.gender)} />
          <InfoRow label="Height" value={data.height} />
          <InfoRow label="Weight" value={data.weight} />
          <InfoRow label="Admission number" value={data.admissionNumber} />
          <InfoRow label="Class" value={data.className} />
          <InfoRow label="Session" value={data.sessionName} />
          <InfoRow
            label="Parent / guardian"
            value={guardians.length
              ? guardians.map((g) => [g.fullName, g.email, g.phone].filter(Boolean).join(' · ')).join('\n')
              : null}
          />
          <InfoRow label="Address" value={data.address} />
          <InfoRow label="Medical information" value={data.medicalInformation} />
        </dl>
      </Section>

      <Section title="Academic">
        <div className="space-y-8">
          <div>
            <h3 className="mb-3 text-sm font-semibold text-ink">Published results</h3>
            {results.length === 0 ? (
              <p className="text-sm text-muted">No published report cards yet.</p>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Term</Th>
                    <Th>Session</Th>
                    <Th>Class</Th>
                    <Th>Average</Th>
                    <Th>Band</Th>
                    <Th>Rank</Th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => {
                    const band = toPerformanceBand(r.averageScore)
                    return (
                      <tr key={r.termResultId} className="border-t border-border">
                        <Td>{r.termName}</Td>
                        <Td>{r.sessionName}</Td>
                        <Td>{r.className}</Td>
                        <Td className="tabular-nums">{r.averageScore != null ? Number(r.averageScore).toFixed(1) : '—'}</Td>
                        <Td>
                          {band
                            ? <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${bandClassName(band)}`}>{band}</span>
                            : '—'}
                        </Td>
                        <Td className="tabular-nums">{r.rankInClass ?? '—'}</Td>
                      </tr>
                    )
                  })}
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
    </div>
  )
}
