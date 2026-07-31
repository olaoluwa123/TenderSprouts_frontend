import { useRef, useState } from 'react'
import { studentsApi } from '@/api'
import { useAsync } from '@/hooks/useAsync'
import { useClasses } from '@/hooks/useSchoolData'
import { ClassSelect } from '@/components/ui/SchoolSelects'
import { parseStudentParentCsv } from '@/lib/csvImport'
import { Alert, Button, Field, Input, Loading, Modal, PageHeader, Select, Table, Td, Th } from '@/components/ui'

const TEMPLATE_URL = '/templates/student-parent-import-template.csv'

const emptyForm = {
  firstName: '',
  lastName: '',
  admissionNumber: '',
  gender: 'MALE',
  classId: '',
  dateOfBirth: '',
  parentEmail: '',
  parentFullName: '',
  parentPhone: '',
}

export function StudentsPage() {
  const [search, setSearch] = useState('')
  const [classId, setClassId] = useState('')
  const { data, loading, error, reload } = useAsync(
    () => studentsApi.list({
      search: search || undefined,
      classId: classId ? Number(classId) : undefined,
      size: 50,
    }),
    [search, classId],
  )
  const { data: classes } = useClasses()
  const [open, setOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [previewRows, setPreviewRows] = useState([])
  const [importFile, setImportFile] = useState(null)
  const [parseError, setParseError] = useState(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const fileInputRef = useRef(null)

  const handleOnboard = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setSubmitError(null)
    try {
      await studentsApi.onboard({
        firstName: form.firstName,
        lastName: form.lastName,
        admissionNumber: form.admissionNumber,
        gender: form.gender,
        classId: Number(form.classId),
        dateOfBirth: form.dateOfBirth || undefined,
        parentEmail: form.parentEmail,
        parentFullName: form.parentFullName,
        parentPhone: form.parentPhone || undefined,
      })
      setOpen(false)
      setForm(emptyForm)
      reload()
    } catch (err) {
      setSubmitError(err?.message || 'Onboarding failed')
    } finally {
      setSubmitting(false)
    }
  }

  const openModal = () => {
    setForm(emptyForm)
    setSubmitError(null)
    setOpen(true)
  }

  const openImportModal = () => {
    setPreviewRows([])
    setImportFile(null)
    setParseError(null)
    setImportResult(null)
    setImportOpen(true)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    setImportFile(file ?? null)
    setImportResult(null)
    setParseError(null)
    setPreviewRows([])
    if (!file) return
    try {
      const text = await file.text()
      setPreviewRows(parseStudentParentCsv(text))
    } catch (err) {
      setParseError(err?.message || 'Failed to parse CSV')
    }
  }

  const handleImport = async () => {
    if (!importFile) return
    setImporting(true)
    setParseError(null)
    try {
      const result = await studentsApi.importCsv(importFile)
      setImportResult(result)
      if (result.successCount > 0) {
        reload()
      }
    } catch (err) {
      setParseError(err?.message || 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  const resultByRow = importResult?.rows
    ? Object.fromEntries(importResult.rows.map((r) => [r.rowNumber, r]))
    : {}

  const canImport = previewRows.length > 0
    && previewRows.every((r) => r.previewStatus === 'Ready' || r.previewStatus === 'Ready (link existing parent)')
    && !importing

  return (
    <div>
      <PageHeader
        title="Students"
        actions={(
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={openImportModal}>Import CSV</Button>
            <Button onClick={openModal}>Onboard student & parent</Button>
          </div>
        )}
      />
      <div className="mb-4 flex flex-wrap gap-3">
        <Input
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <ClassSelect
          value={classId}
          onChange={setClassId}
          classes={classes ?? []}
          className="max-w-xs"
        />
      </div>
      {error && <Alert>{error}</Alert>}
      {loading ? <Loading /> : (
        <Table>
          <thead><tr><Th>Name</Th><Th>Admission #</Th><Th>Class</Th></tr></thead>
          <tbody>
            {data?.content.map((s) => (
              <tr key={s.id} className="border-t border-border">
                <Td>{s.firstName} {s.lastName}</Td>
                <Td>{s.admissionNumber}</Td>
                <Td>{classes?.find((c) => c.id === s.classId)?.name || '—'}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title="Onboard student & parent">
        <form onSubmit={handleOnboard} className="space-y-4">
          {submitError && <Alert>{submitError}</Alert>}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Student</p>
            <div className="space-y-3">
              <Field label="First name">
                <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
              </Field>
              <Field label="Last name">
                <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
              </Field>
              <Field label="Admission number">
                <Input value={form.admissionNumber} onChange={(e) => setForm({ ...form, admissionNumber: e.target.value })} required />
              </Field>
              <Field label="Date of birth">
                <Input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
              </Field>
              <Field label="Gender">
                <Select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </Select>
              </Field>
              <Field label="Class">
                <Select value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })} required>
                  <option value="">Select class</option>
                  {classes?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
              </Field>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Parent / guardian</p>
            <div className="space-y-3">
              <Field label="Email">
                <Input type="email" value={form.parentEmail} onChange={(e) => setForm({ ...form, parentEmail: e.target.value })} required />
              </Field>
              <Field label="Full name">
                <Input value={form.parentFullName} onChange={(e) => setForm({ ...form, parentFullName: e.target.value })} required />
              </Field>
              <Field label="Phone">
                <Input value={form.parentPhone} onChange={(e) => setForm({ ...form, parentPhone: e.target.value })} />
              </Field>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            A parent portal account is created and an email is sent with login credentials. The parent must change their password on first sign-in.
          </p>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Onboarding…' : 'Onboard & send credentials email'}
          </Button>
        </form>
      </Modal>
      <Modal open={importOpen} onClose={() => setImportOpen(false)} title="Import students & parents from CSV">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Upload a CSV with one row per student. Parent details are on the same row.
            {' '}
            <a href={TEMPLATE_URL} download className="text-primary underline">Download template</a>
          </p>
          <Field label="CSV file">
            <Input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
            />
          </Field>
          {parseError && <Alert>{parseError}</Alert>}
          {importResult && (
            <Alert>
              Imported {importResult.successCount} of {importResult.totalRows} rows
              {importResult.failureCount > 0 ? ` (${importResult.failureCount} failed)` : ''}.
            </Alert>
          )}
          {previewRows.length > 0 && (
            <div className="overflow-x-auto max-h-80">
              <Table>
                <thead>
                  <tr>
                    <Th>Row</Th>
                    <Th>Student</Th>
                    <Th>Admission #</Th>
                    <Th>Class</Th>
                    <Th>Parent</Th>
                    <Th>Parent email</Th>
                    <Th>{importResult ? 'Result' : 'Status'}</Th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row) => {
                    const result = resultByRow[row.rowNumber]
                    return (
                      <tr key={row.rowNumber} className="border-t border-border">
                        <Td>{row.rowNumber}</Td>
                        <Td>{row.studentName}</Td>
                        <Td>{row.admissionNumber}</Td>
                        <Td>{row.className}</Td>
                        <Td>{row.parentName}</Td>
                        <Td>{row.parentEmail}</Td>
                        <Td>
                          {result
                            ? (result.status === 'IMPORTED' ? result.message : result.message)
                            : row.previewStatus}
                        </Td>
                      </tr>
                    )
                  })}
                </tbody>
              </Table>
            </div>
          )}
          <Button onClick={handleImport} disabled={!canImport || !importFile}>
            {importing ? 'Importing…' : `Import ${previewRows.length} student${previewRows.length === 1 ? '' : 's'}`}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
