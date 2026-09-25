import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { studentsApi } from '@/api'
import { useAsync } from '@/hooks/useAsync'
import { useClasses } from '@/hooks/useSchoolData'
import { ClassSelect } from '@/components/ui/SchoolSelects'
import { parseStudentParentCsv } from '@/lib/csvImport'
import { ageYearsFromDob, formatAge } from '@/lib/studentProfile'
import { Alert, Badge, Button, Field, Input, Loading, Modal, PageHeader, Select, Table, Td, Th } from '@/components/ui'

const TEMPLATE_URL = '/templates/student-parent-import-template.csv'

const emptyForm = {
  firstName: '',
  lastName: '',
  admissionNumber: '',
  gender: 'MALE',
  classId: '',
  dateOfBirth: '',
  height: '',
  weight: '',
  parentEmail: '',
  parentFullName: '',
  parentPhone: '',
}

const emptyEdit = {
  firstName: '',
  lastName: '',
  gender: 'MALE',
  dateOfBirth: '',
  height: '',
  weight: '',
  isActive: true,
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
  const [editPupil, setEditPupil] = useState(null)
  const [editForm, setEditForm] = useState(emptyEdit)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [previewRows, setPreviewRows] = useState([])
  const [importFile, setImportFile] = useState(null)
  const [parseError, setParseError] = useState(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const fileInputRef = useRef(null)

  const classNameFor = (id) => classes?.find((c) => c.id === id)?.name || '—'

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
        height: form.height || undefined,
        weight: form.weight || undefined,
        parentEmail: form.parentEmail,
        parentFullName: form.parentFullName,
        parentPhone: form.parentPhone || undefined,
      })
      setOpen(false)
      setForm(emptyForm)
      reload()
    } catch (err) {
      setSubmitError(err?.message || 'Could not add pupil')
    } finally {
      setSubmitting(false)
    }
  }

  const openAddModal = () => {
    setForm(emptyForm)
    setSubmitError(null)
    setOpen(true)
  }

  const openEdit = (pupil) => {
    setEditPupil(pupil)
    setEditForm({
      firstName: pupil.firstName || '',
      lastName: pupil.lastName || '',
      gender: pupil.gender || 'MALE',
      dateOfBirth: pupil.dateOfBirth || '',
      height: pupil.height || '',
      weight: pupil.weight || '',
      isActive: pupil.isActive !== false,
    })
    setSubmitError(null)
  }

  const handleEdit = async (e) => {
    e.preventDefault()
    if (!editPupil) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      await studentsApi.update(editPupil.id, {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        gender: editForm.gender,
        dateOfBirth: editForm.dateOfBirth || undefined,
        height: editForm.height,
        weight: editForm.weight,
        isActive: editForm.isActive,
      })
      setEditPupil(null)
      reload()
    } catch (err) {
      setSubmitError(err?.message || 'Could not update pupil')
    } finally {
      setSubmitting(false)
    }
  }

  const openImportModal = () => {
    setPreviewRows([])
    setImportFile(null)
    setParseError(null)
    setImportResult(null)
    setImportOpen(true)
    if (fileInputRef.current) fileInputRef.current.value = ''
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
    setImportResult(null)
    try {
      const result = await studentsApi.importCsv(importFile)
      setImportResult(result)
      if (result.status === 'FAILED') {
        setParseError(result.errorMessage || 'Import failed')
      } else if (result.successCount > 0) {
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
        title="Pupil Management"
        subtitle="All pupils"
        actions={(
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={openImportModal}>Import CSV</Button>
            <Button onClick={openAddModal}>Add pupil</Button>
          </div>
        )}
      />
      <div className="mb-4 flex flex-wrap gap-3">
        <Input
          placeholder="Search pupils…"
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
        <Link to="/admin/enrollments">
          <Button variant="secondary">Promote pupils</Button>
        </Link>
      </div>
      {error && <Alert>{error}</Alert>}
      {loading ? <Loading /> : (
        <Table>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Admission #</Th>
              <Th>Class</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {data?.content.map((s) => (
              <tr key={s.id} className="border-t border-border">
                <Td>{s.firstName} {s.lastName}</Td>
                <Td>{s.admissionNumber}</Td>
                <Td>{classNameFor(s.classId)}</Td>
                <Td>
                  <Badge tone={s.isActive === false ? 'danger' : 'success'}>
                    {s.isActive === false ? 'Inactive' : 'Active'}
                  </Badge>
                </Td>
                <Td>
                  <div className="flex flex-wrap gap-2">
                    <Link to={`/admin/students/${s.id}`}>
                      <Button size="sm" variant="secondary">View</Button>
                    </Link>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(s)}>Edit</Button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Add pupil">
        <form onSubmit={handleOnboard} className="space-y-4">
          {submitError && <Alert>{submitError}</Alert>}
          <div>
            <p className="mb-2 text-sm font-medium text-ink">Pupil</p>
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
              <Field label="Age">
                <Input value={formatAge(ageYearsFromDob(form.dateOfBirth)) || '—'} disabled />
              </Field>
              <Field label="Sex">
                <Select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </Select>
              </Field>
              <Field label="Height">
                <Input value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} placeholder="e.g. 1.20m" />
              </Field>
              <Field label="Weight">
                <Input value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} placeholder="e.g. 24kg" />
              </Field>
              <Field label="Assign to class">
                <Select value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })} required>
                  <option value="">Select class</option>
                  {classes?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
              </Field>
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-ink">Parent / guardian</p>
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
          <p className="text-xs text-muted">
            Creates the parent portal account and emails login credentials. The parent must change their password on first sign-in.
          </p>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Saving…' : 'Add pupil'}
          </Button>
        </form>
      </Modal>

      <Modal open={!!editPupil} onClose={() => setEditPupil(null)} title="Edit pupil">
        <form onSubmit={handleEdit} className="space-y-3">
          {submitError && <Alert>{submitError}</Alert>}
          <Field label="First name">
            <Input value={editForm.firstName} onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })} required />
          </Field>
          <Field label="Last name">
            <Input value={editForm.lastName} onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })} required />
          </Field>
          <Field label="Sex">
            <Select value={editForm.gender} onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </Select>
          </Field>
          <Field label="Date of birth">
            <Input type="date" value={editForm.dateOfBirth || ''} onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })} />
          </Field>
          <Field label="Age">
            <Input value={formatAge(ageYearsFromDob(editForm.dateOfBirth)) || '—'} disabled />
          </Field>
          <Field label="Height">
            <Input value={editForm.height} onChange={(e) => setEditForm({ ...editForm, height: e.target.value })} placeholder="e.g. 1.20m" />
          </Field>
          <Field label="Weight">
            <Input value={editForm.weight} onChange={(e) => setEditForm({ ...editForm, weight: e.target.value })} placeholder="e.g. 24kg" />
          </Field>
          <Field label="Status">
            <Select
              value={editForm.isActive ? 'ACTIVE' : 'WITHDRAWN'}
              onChange={(e) => setEditForm({ ...editForm, isActive: e.target.value === 'ACTIVE' })}
            >
              <option value="ACTIVE">Active</option>
              <option value="WITHDRAWN">Withdrawn / inactive</option>
            </Select>
          </Field>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save changes'}
          </Button>
        </form>
      </Modal>

      <Modal open={importOpen} onClose={() => setImportOpen(false)} title="Import pupils & parents from CSV">
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Upload a CSV with one row per pupil. Parent details are on the same row.
            {' '}
            <a href={TEMPLATE_URL} download className="font-medium text-brand-700 underline hover:text-brand-700">Download template</a>
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
          {importing && (
            <Alert tone="info">Import queued — saving pupils and parents…</Alert>
          )}
          {importResult && importResult.status !== 'FAILED' && (
            <Alert tone="success">
              Imported {importResult.successCount} of {importResult.totalRows} rows
              {importResult.failureCount > 0 ? ` (${importResult.failureCount} failed)` : ''}.
            </Alert>
          )}
          {previewRows.length > 0 && (
            <div className="max-h-80 overflow-x-auto">
              <Table>
                <thead>
                  <tr>
                    <Th>Row</Th>
                    <Th>Pupil</Th>
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
                        <Td>{result ? result.message : row.previewStatus}</Td>
                      </tr>
                    )
                  })}
                </tbody>
              </Table>
            </div>
          )}
          <Button onClick={handleImport} disabled={!canImport || !importFile}>
            {importing ? 'Importing…' : `Import ${previewRows.length} pupil${previewRows.length === 1 ? '' : 's'}`}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
