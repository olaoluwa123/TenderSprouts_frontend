import { useEffect, useMemo, useState } from 'react'
import { attendanceApi, teachersApi } from '@/api'
import { useAuth } from '@/hooks/useAuth'
import { useAsync } from '@/hooks/useAsync'
import { ClassSelect } from '@/components/ui/SchoolSelects'
import { Alert, Badge, Button, Field, Input, Loading, PageHeader, Select, Table, Td, Th } from '@/components/ui'

const STATUSES = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']

function todayIso() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function statusTone(status) {
  if (status === 'PRESENT') return 'success'
  if (status === 'ABSENT') return 'danger'
  if (status === 'LATE') return 'warning'
  return 'default'
}

export function TeacherAttendancePage() {
  const { user } = useAuth()
  const teacherId = user?.profileId
  const [date, setDate] = useState(todayIso)
  const [classId, setClassId] = useState('')
  const [marks, setMarks] = useState({})
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)
  const [formError, setFormError] = useState(null)

  const { data: assignments } = useAsync(
    () => (teacherId ? teachersApi.classes(teacherId) : Promise.resolve([])),
    [teacherId],
  )
  const classes = assignments ?? []
  const classOptions = classes.map((row) => ({
    id: row.classId,
    name: row.className || `Class #${row.classId}`,
  }))
  const effectiveClassId = classId || (classes[0]?.classId ? String(classes[0].classId) : '')
  const selectedClass = classes.find((row) => String(row.classId) === String(effectiveClassId))
  const className = selectedClass?.className
    || (effectiveClassId ? `Class #${effectiveClassId}` : null)

  const { data: rows, loading, error, reload } = useAsync(
    () => (effectiveClassId
      ? attendanceApi.byClass(Number(effectiveClassId), date)
      : Promise.resolve([])),
    [effectiveClassId, date],
  )

  const sheet = useMemo(() => {
    if (!Array.isArray(rows)) return rows?.pupils ?? rows?.items ?? []
    return rows
  }, [rows])

  useEffect(() => {
    const next = {}
    for (const row of sheet) {
      const id = row.studentId ?? row.id
      next[id] = row.status || 'PRESENT'
    }
    setMarks(next)
  }, [sheet])

  const save = async () => {
    if (!effectiveClassId) return
    setSaving(true)
    setFormError(null)
    setMsg(null)
    try {
      await attendanceApi.markClass({
        classId: Number(effectiveClassId),
        date,
        marks: Object.entries(marks).map(([sid, status]) => ({
          studentId: Number(sid),
          status,
        })),
      })
      setMsg('Attendance saved')
      reload()
    } catch (err) {
      setFormError(err?.message || 'Could not save attendance')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Attendance"
        subtitle={className ? `Mark attendance · ${className}` : 'Mark attendance for your class'}
      />
      {!teacherId && <Alert>Teacher profile missing.</Alert>}
      <div className="flex flex-wrap gap-3">
        {classOptions.length > 0 && (
          <Field label="Class">
            <ClassSelect
              value={effectiveClassId}
              onChange={setClassId}
              classes={classOptions}
              alwaysShow={classOptions.length > 1}
            />
          </Field>
        )}
        <Field label="Date">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
      </div>
      {msg && <Alert tone="success">{msg}</Alert>}
      {(error || formError) && <Alert>{formError || error}</Alert>}
      {loading ? <Loading /> : sheet.length === 0 ? (
        <p className="text-sm text-muted">No pupils to mark for this class/date.</p>
      ) : (
        <>
          <Table>
            <thead>
              <tr>
                <Th>Pupil</Th>
                <Th>Admission #</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {sheet.map((row) => {
                const id = row.studentId ?? row.id
                return (
                  <tr key={id} className="border-t border-border">
                    <Td className="font-medium">{row.studentName || row.fullName || `Pupil #${id}`}</Td>
                    <Td>{row.admissionNumber || '—'}</Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <Select
                          value={marks[id] || 'PRESENT'}
                          onChange={(e) => setMarks((prev) => ({ ...prev, [id]: e.target.value }))}
                          className="min-w-[8rem]"
                        >
                          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </Select>
                        <Badge tone={statusTone(marks[id])}>{marks[id] || 'PRESENT'}</Badge>
                      </div>
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
          <Button onClick={save} disabled={saving || !effectiveClassId}>
            {saving ? 'Saving…' : 'Save attendance'}
          </Button>
        </>
      )}
    </div>
  )
}
