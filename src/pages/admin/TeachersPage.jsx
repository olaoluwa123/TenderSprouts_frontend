import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { teachersApi } from '@/api'
import { useAsync } from '@/hooks/useAsync'
import { useClasses } from '@/hooks/useSchoolData'
import { ClassSelect } from '@/components/ui/SchoolSelects'
import { parseTeacherCsv } from '@/lib/csvImport'
import { Alert, Badge, Button, Field, Input, Loading, Modal, PageHeader, Select, Table, Td, Th } from '@/components/ui'

const TEMPLATE_URL = '/templates/teacher-import-template.csv'
const emptyOnboardForm = { email: '', fullName: '', phone: '', classId: '' }
const emptyEdit = { fullName: '', phone: '', isActive: true }

export function TeachersPage() {
  const { data, loading, error, reload } = useAsync(
    () => teachersApi.list({ size: 100 }),
    [],
  )
  const { data: classes } = useClasses()
  const [msg, setMsg] = useState(null)
  const [onboardOpen, setOnboardOpen] = useState(false)
  const [onboardForm, setOnboardForm] = useState(emptyOnboardForm)
  const [onboardSubmitting, setOnboardSubmitting] = useState(false)
  const [onboardError, setOnboardError] = useState(null)
  const [editTeacher, setEditTeacher] = useState(null)
  const [editForm, setEditForm] = useState(emptyEdit)
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [editError, setEditError] = useState(null)

  const [importOpen, setImportOpen] = useState(false)
  const [previewRows, setPreviewRows] = useState([])
  const [importFile, setImportFile] = useState(null)
  const [parseError, setParseError] = useState(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const fileInputRef = useRef(null)

  const handleOnboard = async (e) => {
    e.preventDefault()
    setOnboardSubmitting(true)
    setOnboardError(null)
    try {
      const assignedClass = Boolean(onboardForm.classId)
      await teachersApi.onboard({
        email: onboardForm.email,
        fullName: onboardForm.fullName,
        phone: onboardForm.phone || undefined,
        classId: onboardForm.classId ? Number(onboardForm.classId) : undefined,
      })
      setOnboardOpen(false)
      setOnboardForm(emptyOnboardForm)
      setMsg(
        assignedClass
          ? 'Teacher onboarded, class assigned — welcome email sent'
          : 'Teacher onboarded — welcome email sent with login credentials',
      )
      reload()
    } catch (err) {
      setOnboardError(err?.message || 'Onboarding failed')
    } finally {
      setOnboardSubmitting(false)
    }
  }

  const openEdit = (teacher) => {
    setEditTeacher(teacher)
    setEditForm({
      fullName: teacher.fullName || '',
      phone: teacher.phone || '',
      isActive: teacher.isActive !== false,
    })
    setEditError(null)
  }

  const handleEdit = async (e) => {
    e.preventDefault()
    if (!editTeacher) return
    setEditSubmitting(true)
    setEditError(null)
    try {
      await teachersApi.update(editTeacher.id, {
        fullName: editForm.fullName,
        phone: editForm.phone || undefined,
        isActive: editForm.isActive,
      })
      setEditTeacher(null)
      setMsg('Teacher updated')
      reload()
    } catch (err) {
      setEditError(err?.message || 'Could not update teacher')
    } finally {
      setEditSubmitting(false)
    }
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
      setPreviewRows(parseTeacherCsv(text))
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
      const result = await teachersApi.importCsv(importFile)
      setImportResult(result)
      if (result.status === 'FAILED') {
        setParseError(result.errorMessage || 'Import failed')
      } else if (result.successCount > 0) {
        setMsg(`Imported ${result.successCount} teacher${result.successCount === 1 ? '' : 's'}`)
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
    && previewRows.every((r) => r.previewStatus === 'Ready')
    && !importing

  return (
    <div>
      <PageHeader
        title="Teachers"
        subtitle="All teachers"
        actions={(
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={openImportModal}>Import CSV</Button>
            <Button onClick={() => { setOnboardOpen(true); setOnboardError(null) }}>Add teacher</Button>
          </div>
        )}
      />
      {error && <Alert>{error}</Alert>}
      {msg && <div className="mb-4"><Alert tone="success">{msg}</Alert></div>}
      {loading ? <Loading /> : (
        <Table>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Phone</Th>
              <Th>Class</Th>
              <Th>Login</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {(data?.content ?? []).map((t) => (
              <tr key={t.id} className="border-t border-border">
                <Td>{t.fullName}</Td>
                <Td>{t.email || '—'}</Td>
                <Td>{t.phone || '—'}</Td>
                <Td>
                  {(t.classes ?? []).map((row) => row.className).filter(Boolean).join(' / ')
                    || t.className
                    || '—'}
                </Td>
                <Td>
                  <Badge tone={t.loginActive === false ? 'danger' : 'success'}>
                    {t.loginActive === false ? 'Disabled' : 'Active'}
                  </Badge>
                </Td>
                <Td>
                  <Badge tone={t.isActive === false ? 'danger' : 'success'}>
                    {t.isActive === false ? 'Inactive' : 'Active'}
                  </Badge>
                </Td>
                <Td>
                  <div className="flex flex-wrap gap-2">
                    <Link to={`/admin/teachers/${t.id}`}>
                      <Button size="sm" variant="secondary">View</Button>
                    </Link>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(t)}>Edit</Button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <Modal open={onboardOpen} onClose={() => setOnboardOpen(false)} title="Add teacher">
        <form onSubmit={handleOnboard} className="space-y-3">
          {onboardError && <Alert>{onboardError}</Alert>}
          <Field label="Email">
            <Input type="email" value={onboardForm.email} onChange={(e) => setOnboardForm({ ...onboardForm, email: e.target.value })} required />
          </Field>
          <Field label="Full name">
            <Input value={onboardForm.fullName} onChange={(e) => setOnboardForm({ ...onboardForm, fullName: e.target.value })} required />
          </Field>
          <Field label="Phone">
            <Input value={onboardForm.phone} onChange={(e) => setOnboardForm({ ...onboardForm, phone: e.target.value })} />
          </Field>
          <Field label="Class (optional)">
            <ClassSelect
              value={onboardForm.classId}
              onChange={(value) => setOnboardForm({ ...onboardForm, classId: value })}
              classes={classes ?? []}
            />
          </Field>
          <p className="text-xs text-muted">
            A portal account is created and an email is sent with login credentials. The teacher must change their password on first sign-in. You can assign a class now or later on their profile.
          </p>
          <Button type="submit" disabled={onboardSubmitting}>
            {onboardSubmitting ? 'Saving…' : 'Add & send email'}
          </Button>
        </form>
      </Modal>

      <Modal open={Boolean(editTeacher)} onClose={() => setEditTeacher(null)} title="Edit teacher">
        <form onSubmit={handleEdit} className="space-y-3">
          {editError && <Alert>{editError}</Alert>}
          <Field label="Full name">
            <Input value={editForm.fullName} onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} required />
          </Field>
          <Field label="Phone">
            <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
          </Field>
          <Field label="Status">
            <Select
              value={editForm.isActive ? 'true' : 'false'}
              onChange={(e) => setEditForm({ ...editForm, isActive: e.target.value === 'true' })}
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </Select>
          </Field>
          <Button type="submit" disabled={editSubmitting}>
            {editSubmitting ? 'Saving…' : 'Save changes'}
          </Button>
        </form>
      </Modal>

      <Modal open={importOpen} onClose={() => setImportOpen(false)} title="Import teachers from CSV">
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Upload a CSV with columns <code className="text-xs">email</code>, <code className="text-xs">full_name</code>, optional <code className="text-xs">phone</code>, and optional <code className="text-xs">class</code> (class name).
            Each teacher receives a welcome email with a temporary password and must change it on first login.
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
            <Alert tone="info">Import queued — saving teachers…</Alert>
          )}
          {importResult && importResult.status !== 'FAILED' && (
            <Alert tone={importResult.failureCount > 0 ? undefined : 'success'}>
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
                    <Th>Full name</Th>
                    <Th>Email</Th>
                    <Th>Phone</Th>
                    <Th>Class</Th>
                    <Th>{importResult ? 'Result' : 'Status'}</Th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row) => {
                    const result = resultByRow[row.rowNumber]
                    return (
                      <tr key={row.rowNumber} className="border-t border-border">
                        <Td>{row.rowNumber}</Td>
                        <Td>{row.fullName}</Td>
                        <Td>{row.email}</Td>
                        <Td>{row.phone}</Td>
                        <Td>{row.className}</Td>
                        <Td>{result ? result.message : row.previewStatus}</Td>
                      </tr>
                    )
                  })}
                </tbody>
              </Table>
            </div>
          )}
          <Button onClick={handleImport} disabled={!canImport || !importFile}>
            {importing
              ? 'Importing…'
              : `Import ${previewRows.length} teacher${previewRows.length === 1 ? '' : 's'}`}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
