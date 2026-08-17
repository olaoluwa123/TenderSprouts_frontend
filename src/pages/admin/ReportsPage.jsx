import { useMemo, useState } from 'react'
import { reportsApi } from '@/api'
import { useActiveSession, useClasses, useStudents, useTerms } from '@/hooks/useSchoolData'
import { ClassSelect, TermSelect } from '@/components/ui/SchoolSelects'
import { Alert, Button, Field, Input, Loading, PageHeader, Select, Table, Td, Th } from '@/components/ui'

const SECTIONS = {
  Academic: [
    { key: 'class-performance', label: 'Class performance', filters: ['termId', 'classId'] },
    { key: 'subject-performance', label: 'Subject performance', filters: ['termId', 'classId'] },
    { key: 'pupil-performance', label: 'Pupil performance', filters: ['termId', 'studentId'] },
    { key: 'term-results', label: 'Term results', filters: ['termId', 'classId'] },
  ],
  Attendance: [
    { key: 'daily-attendance', label: 'Daily attendance', filters: ['date', 'classId'] },
    { key: 'monthly-attendance', label: 'Monthly attendance', filters: ['month', 'classId'] },
    { key: 'class-attendance', label: 'Class attendance', filters: ['from', 'to', 'classId'] },
    { key: 'individual-attendance', label: 'Individual attendance', filters: ['from', 'to', 'studentId'] },
  ],
  School: [
    { key: 'pupil-population', label: 'Pupil population', filters: ['classId'] },
    { key: 'teacher-stats', label: 'Teacher stats', filters: [] },
    { key: 'class-stats', label: 'Class stats', filters: [] },
    { key: 'admission-stats', label: 'Admission stats', filters: [] },
  ],
}

function currentMonth() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}

function todayIso() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function ReportsPage() {
  const [section, setSection] = useState('Academic')
  const reports = SECTIONS[section]
  const [reportKey, setReportKey] = useState(reports[0].key)
  const [termId, setTermId] = useState('')
  const [classId, setClassId] = useState('')
  const [studentId, setStudentId] = useState('')
  const [date, setDate] = useState(todayIso)
  const [month, setMonth] = useState(currentMonth)
  const [from, setFrom] = useState(todayIso)
  const [to, setTo] = useState(todayIso)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(null)
  const [error, setError] = useState(null)

  const { data: session } = useActiveSession()
  const { data: terms } = useTerms(session?.id)
  const { data: classes } = useClasses()
  const { data: students } = useStudents(classId || undefined)

  const selectedMeta = useMemo(
    () => Object.values(SECTIONS).flat().find((r) => r.key === reportKey) || reports[0],
    [reportKey, reports],
  )

  const onSectionChange = (next) => {
    setSection(next)
    const first = SECTIONS[next][0]
    setReportKey(first.key)
    setPreview(null)
    setError(null)
  }

  const buildParams = () => {
    const needed = new Set(selectedMeta.filters)
    const params = {}
    if (needed.has('termId') && termId) params.termId = Number(termId)
    if (needed.has('classId') && classId) params.classId = Number(classId)
    if (needed.has('studentId') && studentId) params.studentId = Number(studentId)
    if (needed.has('date') && date) params.date = date
    if (needed.has('month') && month) params.month = month
    if (needed.has('from') && from) params.from = from
    if (needed.has('to') && to) params.to = to
    return params
  }

  const handlePreview = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await reportsApi.preview(reportKey, buildParams())
      setPreview(data)
    } catch (err) {
      setPreview(null)
      setError(err?.message || 'Could not load report preview')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (format) => {
    setExporting(format)
    setError(null)
    try {
      const blob = await reportsApi.export(reportKey, format, buildParams())
      const ext = format === 'pdf' ? 'pdf' : 'csv'
      downloadBlob(blob, `${reportKey}.${ext}`)
    } catch (err) {
      setError(err?.message || `Could not export ${format.toUpperCase()}`)
    } finally {
      setExporting(null)
    }
  }

  const columns = preview?.columns ?? []
  const rows = preview?.rows ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        subtitle="Preview and export academic, attendance, and school reports"
      />

      <div className="grid gap-4 rounded-2xl border border-blossom-200/80 bg-white p-5 shadow-sm shadow-blossom-500/5 lg:grid-cols-3">
        <Field label="Section">
          <Select value={section} onChange={(e) => onSectionChange(e.target.value)}>
            {Object.keys(SECTIONS).map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </Select>
        </Field>
        <Field label="Report">
          <Select
            value={reportKey}
            onChange={(e) => {
              setReportKey(e.target.value)
              setPreview(null)
              setError(null)
            }}
          >
            {reports.map((r) => (
              <option key={r.key} value={r.key}>{r.label}</option>
            ))}
          </Select>
        </Field>
        <div className="flex flex-wrap items-end gap-2">
          <Button onClick={handlePreview} disabled={loading}>
            {loading ? 'Loading…' : 'Preview'}
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleExport('csv')}
            disabled={Boolean(exporting)}
          >
            {exporting === 'csv' ? 'Exporting…' : 'Export CSV'}
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleExport('pdf')}
            disabled={Boolean(exporting)}
          >
            {exporting === 'pdf' ? 'Exporting…' : 'Export PDF'}
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {selectedMeta.filters.includes('termId') && (
          <Field label="Term">
            <TermSelect value={termId} onChange={setTermId} terms={terms ?? []} />
          </Field>
        )}
        {selectedMeta.filters.includes('classId') && (
          <Field label="Class">
            <ClassSelect value={classId} onChange={setClassId} classes={classes ?? []} />
          </Field>
        )}
        {selectedMeta.filters.includes('studentId') && (
          <Field label="Pupil">
            <Select value={studentId} onChange={(e) => setStudentId(e.target.value)}>
              <option value="">Select pupil</option>
              {(students ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName || `Pupil #${s.id}`}
                </option>
              ))}
            </Select>
          </Field>
        )}
        {selectedMeta.filters.includes('date') && (
          <Field label="Date">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
        )}
        {selectedMeta.filters.includes('month') && (
          <Field label="Month">
            <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
          </Field>
        )}
        {selectedMeta.filters.includes('from') && (
          <Field label="From">
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </Field>
        )}
        {selectedMeta.filters.includes('to') && (
          <Field label="To">
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </Field>
        )}
      </div>

      {error && <Alert>{error}</Alert>}

      {loading ? <Loading /> : preview ? (
        <div className="space-y-3">
          <h2 className="font-display text-lg font-semibold text-ink">
            {preview.title || selectedMeta.label}
          </h2>
          {columns.length === 0 ? (
            <p className="text-sm text-muted">No columns returned for this report.</p>
          ) : (
            <Table>
              <thead>
                <tr>
                  {columns.map((col) => <Th key={col}>{col}</Th>)}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr className="border-t border-border">
                    <Td className="text-muted">No rows.</Td>
                  </tr>
                ) : rows.map((row, idx) => (
                  <tr key={idx} className="border-t border-border">
                    {(Array.isArray(row) ? row : columns.map((c) => row[c])).map((cell, cidx) => (
                      <Td key={cidx}>{cell == null || cell === '' ? '—' : String(cell)}</Td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted">Choose filters and click Preview to see the report.</p>
      )}
    </div>
  )
}
