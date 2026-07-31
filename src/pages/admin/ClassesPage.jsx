import { useState } from 'react'
import { classesApi, subjectsApi } from '@/api'
import { useAsync } from '@/hooks/useAsync'
import { Alert, Button, Field, Input, Loading, Modal, PageHeader, Select, Table, Td, Th } from '@/components/ui'

function CheckboxList({ items, selected, onChange, labelKey = 'name' }) {
  const toggle = (id) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onChange([...next])
  }

  return (
    <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-border p-3">
      {items.map((item) => (
        <label key={item.id} className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={selected.includes(item.id)}
            onChange={() => toggle(item.id)}
          />
          {item[labelKey]}
        </label>
      ))}
      {items.length === 0 && <p className="text-sm text-muted">Nothing to select</p>}
    </div>
  )
}

export function ClassesPage() {
  const { data: classes, loading: classesLoading, reload: reloadClasses } = useAsync(
    () => classesApi.list({ size: 100 }).then((p) => p.content),
    [],
  )
  const { data: subjects, loading: subjectsLoading, reload: reloadSubjects } = useAsync(
    () => subjectsApi.list({ size: 100 }).then((p) => p.content),
    [],
  )

  const [classOpen, setClassOpen] = useState(false)
  const [subjectOpen, setSubjectOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(null)
  const [className, setClassName] = useState('')
  const [subjectName, setSubjectName] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [classSubjects, setClassSubjects] = useState([])
  const [bulkClassIds, setBulkClassIds] = useState([])
  const [bulkSubjectIds, setBulkSubjectIds] = useState([])
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const loadSubjects = async (classId) => {
    setAssignOpen(classId)
    setClassSubjects(await classesApi.subjects(classId))
  }

  const handleCreateClass = async (e) => {
    e.preventDefault()
    setError(null)
    try {
      await classesApi.create(className)
      setClassName('')
      setClassOpen(false)
      reloadClasses()
    } catch (err) {
      setError(err?.message || 'Failed to create class')
    }
  }

  const handleCreateSubject = async (e) => {
    e.preventDefault()
    setError(null)
    try {
      const name = subjectName.trim()
      await subjectsApi.create(name)
      setSubjectName('')
      setSubjectOpen(false)
      await reloadSubjects()
      setSuccess(`Subject "${name}" created`)
    } catch (err) {
      setError(err?.message || 'Failed to create subject')
    }
  }

  const handleAssign = async () => {
    if (!subjectId) {
      setError('Select a subject to assign')
      return
    }
    setError(null)
    try {
      await classesApi.assignSubject(assignOpen, Number(subjectId))
      setSubjectId('')
      await loadSubjects(assignOpen)
      setSuccess('Subject assigned to class')
    } catch (err) {
      setError(err?.message || 'Failed to assign subject')
    }
  }

  const handleBulkAssign = async (e) => {
    e.preventDefault()
    setError(null)
    if (bulkClassIds.length === 0 || bulkSubjectIds.length === 0) {
      setError('Select at least one class and one subject')
      return
    }
    try {
      const result = await classesApi.bulkAssignSubjects(bulkClassIds, bulkSubjectIds)
      setBulkOpen(false)
      setBulkClassIds([])
      setBulkSubjectIds([])
      if (assignOpen) {
        await loadSubjects(assignOpen)
      }
      setSuccess(
        `Assigned ${result.assignedCount} class–subject link(s)`
        + (result.skippedCount > 0 ? ` (${result.skippedCount} already existed)` : ''),
      )
    } catch (err) {
      setError(err?.message || 'Failed to bulk assign subjects')
    }
  }

  const loading = classesLoading || subjectsLoading
  const assignClass = classes?.find((c) => c.id === assignOpen)

  return (
    <div>
      <PageHeader
        title="Classes & Subjects"
        subtitle="Create subjects, then assign them to one or more classes"
        actions={(
          <>
            <Button variant="secondary" onClick={() => { setError(null); setSubjectOpen(true) }}>
              Add subject
            </Button>
            <Button variant="secondary" onClick={() => { setError(null); setBulkOpen(true) }}>
              Bulk assign
            </Button>
            <Button onClick={() => { setError(null); setClassOpen(true) }}>Add class</Button>
          </>
        )}
      />

      {error && <div className="mb-4"><Alert>{error}</Alert></div>}
      {success && (
        <div className="mb-4">
          <Alert tone="success">{success}</Alert>
        </div>
      )}

      {loading ? <Loading /> : (
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="mb-3 text-lg font-semibold">Subjects</h2>
            <Table>
              <thead><tr><Th>Name</Th></tr></thead>
              <tbody>
                {(subjects ?? []).map((s) => (
                  <tr key={s.id} className="border-t border-border">
                    <Td>{s.name}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            {subjects?.length === 0 && (
              <p className="mt-2 text-sm text-muted">No subjects yet. Click Add subject to create one.</p>
            )}
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold">Classes</h2>
            <Table>
              <thead><tr><Th>Class</Th><Th>Actions</Th></tr></thead>
              <tbody>
                {(classes ?? []).map((c) => (
                  <tr key={c.id} className="border-t border-border">
                    <Td>{c.name}</Td>
                    <Td>
                      <Button size="sm" variant="secondary" onClick={() => loadSubjects(c.id)}>
                        Manage subjects
                      </Button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </div>
      )}

      {assignOpen && (
        <div className="mt-6 rounded-xl border border-border bg-white p-4">
          <h3 className="mb-3 font-semibold">
            Subjects for {assignClass?.name ?? `class #${assignOpen}`}
          </h3>
          <div className="mb-3 flex flex-wrap gap-2">
            <Select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="max-w-xs">
              <option value="">Select subject</option>
              {subjects?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
            <Button size="sm" onClick={handleAssign}>Assign</Button>
            <Button size="sm" variant="secondary" onClick={() => setBulkOpen(true)}>Bulk assign…</Button>
          </div>
          <ul className="space-y-1 text-sm">
            {classSubjects.map((cs) => (
              <li key={cs.id}>
                {subjects?.find((s) => s.id === cs.subjectId)?.name ?? `Subject #${cs.subjectId}`}
              </li>
            ))}
            {classSubjects.length === 0 && (
              <li className="text-muted">No subjects assigned yet.</li>
            )}
          </ul>
        </div>
      )}

      <Modal open={classOpen} onClose={() => setClassOpen(false)} title="Add class">
        <form onSubmit={handleCreateClass} className="space-y-3">
          <Field label="Name">
            <Input value={className} onChange={(e) => setClassName(e.target.value)} required />
          </Field>
          <Button type="submit">Create</Button>
        </form>
      </Modal>

      <Modal open={subjectOpen} onClose={() => setSubjectOpen(false)} title="Add subject">
        <form onSubmit={handleCreateSubject} className="space-y-3">
          <Field label="Name">
            <Input value={subjectName} onChange={(e) => setSubjectName(e.target.value)} required />
          </Field>
          <Button type="submit">Create</Button>
        </form>
      </Modal>

      <Modal open={bulkOpen} onClose={() => setBulkOpen(false)} title="Assign subjects to classes">
        <form onSubmit={handleBulkAssign} className="space-y-4">
          <p className="text-sm text-muted">
            Select one or more classes and one or more subjects. Every selected subject will be
            assigned to every selected class (existing links are skipped).
          </p>
          <Field label="Classes">
            <CheckboxList
              items={classes ?? []}
              selected={bulkClassIds}
              onChange={setBulkClassIds}
            />
          </Field>
          <Field label="Subjects">
            <CheckboxList
              items={subjects ?? []}
              selected={bulkSubjectIds}
              onChange={setBulkSubjectIds}
            />
          </Field>
          <Button type="submit">Assign selected</Button>
        </form>
      </Modal>
    </div>
  )
}
